import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// =============================================================================
// Multi-source job search.
//
// Strategy:
//   1. Query a wide set of FREE, no-key public job APIs in parallel
//      (Remotive, Arbeitnow, The Muse, Jobicy, RemoteOK). Each one
//      guarantees title + company + location so cards never look empty.
//   2. Score, dedupe, and filter (entry-level / remote / location).
//   3. Only if nothing usable comes back do we fall back to Tavily
//      web search of ATS boards.
// =============================================================================

const TAVILY_API = "https://api.tavily.com/search";

const ENTRY_LEVEL_PATTERNS = [
  /\bentry[\s-]?level\b/i,
  /\bjunior\b/i,
  /\bjr\.?\b/i,
  /\bintern(ship)?\b/i,
  /\bgraduate\b/i,
  /\bnew[\s-]?grad\b/i,
  /\bfresher?s?\b/i,
  /\btrainee\b/i,
  /\bassociate\b/i,
  /\bapprentice\b/i,
  /\b0[\s-]?to[\s-]?2[\s-]?years?\b/i,
  /\b0[\s-]?-?[\s-]?2\s?(yrs?|years?)\b/i,
  /\bless than (1|2|3) years?\b/i,
  /\bL[12]\b/,
];

type NormalizedJob = {
  source: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string;
  description: string;
  postedAt: string | null;
};

function clean(text: string | null | undefined, max = 5000) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isEntryLevel(j: NormalizedJob) {
  const hay = `${j.title} ${j.description}`;
  return ENTRY_LEVEL_PATTERNS.some((re) => re.test(hay));
}

function tokens(q: string) {
  return q
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .filter((t) => t.length >= 2 && !["the", "and", "for", "with", "job", "jobs", "remote", "in", "of", "a", "an"].includes(t));
}

function scoreJob(j: NormalizedJob, qTokens: string[], loc: string | null, remoteOnly: boolean) {
  const hay = `${j.title} ${j.company} ${j.description}`.toLowerCase();
  let s = 0;
  for (const t of qTokens) {
    if (j.title.toLowerCase().includes(t)) s += 4;
    else if (hay.includes(t)) s += 1;
  }
  if (loc && (j.location ?? "").toLowerCase().includes(loc.toLowerCase())) s += 5;
  if (remoteOnly && j.remote) s += 3;
  return s;
}

async function fetchJSON<T>(url: string, init?: RequestInit, timeoutMs = 8000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/json",
        "User-Agent": "CareerOS/1.0 (+https://careeros.app)",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// --- Source adapters ---------------------------------------------------------

async function fromRemotive(query: string): Promise<NormalizedJob[]> {
  const url = `https://remotive.com/api/remote-jobs?limit=50${query ? `&search=${encodeURIComponent(query)}` : ""}`;
  const json = await fetchJSON<{ jobs?: Array<Record<string, unknown>> }>(url);
  return (json?.jobs ?? []).flatMap((j) => {
    const title = String(j.title ?? "").trim();
    const company = String(j.company_name ?? "").trim();
    if (!title || !company) return [];
    return [{
      source: "remotive",
      title,
      company,
      location: String(j.candidate_required_location ?? "Remote").trim() || "Remote",
      remote: true,
      url: String(j.url ?? ""),
      description: clean(String(j.description ?? "")),
      postedAt: (j.publication_date as string) ?? null,
    }];
  });
}

async function fromArbeitnow(): Promise<NormalizedJob[]> {
  const json = await fetchJSON<{ data?: Array<Record<string, unknown>> }>(
    "https://www.arbeitnow.com/api/job-board-api",
  );
  return (json?.data ?? []).flatMap((j) => {
    const title = String(j.title ?? "").trim();
    const company = String(j.company_name ?? "").trim();
    if (!title || !company) return [];
    return [{
      source: "arbeitnow",
      title,
      company,
      location: String(j.location ?? "").trim() || null,
      remote: Boolean(j.remote),
      url: String(j.url ?? ""),
      description: clean(String(j.description ?? "")),
      postedAt: (j.created_at as string) ?? null,
    }];
  });
}

async function fromTheMuse(query: string, page = 0): Promise<NormalizedJob[]> {
  // The Muse supports limited filtering; we fetch a page and score client-side.
  const url = `https://www.themuse.com/api/public/jobs?page=${page}&descending=true${
    query ? `&category=${encodeURIComponent(query)}` : ""
  }`;
  const json = await fetchJSON<{ results?: Array<Record<string, unknown>> }>(url);
  return (json?.results ?? []).flatMap((j) => {
    const title = String(j.name ?? "").trim();
    const company = String((j.company as { name?: string } | undefined)?.name ?? "").trim();
    if (!title || !company) return [];
    const locs = (j.locations as Array<{ name?: string }> | undefined) ?? [];
    const location = locs.map((l) => l.name).filter(Boolean).join(", ") || null;
    const refs = j.refs as { landing_page?: string } | undefined;
    return [{
      source: "themuse",
      title,
      company,
      location,
      remote: /remote/i.test(location ?? ""),
      url: refs?.landing_page ?? "",
      description: clean(String(j.contents ?? "")),
      postedAt: (j.publication_date as string) ?? null,
    }];
  });
}

async function fromJobicy(query: string, geo?: string): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({ count: "50" });
  if (query) params.set("tag", query);
  if (geo) params.set("geo", geo);
  const json = await fetchJSON<{ jobs?: Array<Record<string, unknown>> }>(
    `https://jobicy.com/api/v2/remote-jobs?${params}`,
  );
  return (json?.jobs ?? []).flatMap((j) => {
    const title = String(j.jobTitle ?? "").trim();
    const company = String(j.companyName ?? "").trim();
    if (!title || !company) return [];
    return [{
      source: "jobicy",
      title,
      company,
      location: String(j.jobGeo ?? "Remote").trim() || "Remote",
      remote: true,
      url: String(j.url ?? ""),
      description: clean(String(j.jobDescription ?? "")),
      postedAt: (j.pubDate as string) ?? null,
    }];
  });
}

async function fromRemoteOK(query: string): Promise<NormalizedJob[]> {
  const url = `https://remoteok.com/api${query ? `?tags=${encodeURIComponent(query.split(/\s+/)[0])}` : ""}`;
  const json = await fetchJSON<Array<Record<string, unknown>>>(url);
  if (!Array.isArray(json)) return [];
  // First entry is metadata.
  return json.slice(1).flatMap((j) => {
    const title = String(j.position ?? "").trim();
    const company = String(j.company ?? "").trim();
    if (!title || !company) return [];
    return [{
      source: "remoteok",
      title,
      company,
      location: String(j.location ?? "Remote").trim() || "Remote",
      remote: true,
      url: String(j.url ?? `https://remoteok.com/remote-jobs/${j.id}`),
      description: clean(String(j.description ?? "")),
      postedAt: (j.date as string) ?? null,
    }];
  });
}

async function fetchAggregators(query: string, location?: string): Promise<NormalizedJob[]> {
  const geo = location?.toLowerCase().includes("usa") || location?.toLowerCase().includes("united states")
    ? "usa"
    : undefined;
  const results = await Promise.all([
    fromRemotive(query).catch(() => []),
    fromArbeitnow().catch(() => []),
    fromTheMuse(query, 0).catch(() => []),
    fromJobicy(query, geo).catch(() => []),
    fromRemoteOK(query).catch(() => []),
  ]);
  return results.flat();
}

// --- Indian portals (via Tavily web search) ----------------------------------
//
// India-specific job boards rarely expose free JSON APIs, so we lean on
// Tavily to surface listings from the top portals in parallel and parse
// just enough metadata (company, title, location) to render a useful card.

const INDIAN_PORTALS = [
  "naukri.com",
  "shine.com",
  "foundit.in",
  "instahyre.com",
  "hirist.tech",
  "cutshort.io",
  "iimjobs.com",
  "indeed.co.in",
  "timesjobs.com",
  "freshersworld.com",
  "internshala.com",
  "glassdoor.co.in",
  "linkedin.com",
  "apna.co",
  "wellfound.com",
];

const PORTAL_LABELS: Record<string, string> = {
  "naukri.com": "Naukri",
  "shine.com": "Shine",
  "foundit.in": "Foundit",
  "instahyre.com": "Instahyre",
  "hirist.tech": "Hirist",
  "cutshort.io": "Cutshort",
  "iimjobs.com": "iimjobs",
  "indeed.co.in": "Indeed India",
  "timesjobs.com": "TimesJobs",
  "freshersworld.com": "Freshersworld",
  "internshala.com": "Internshala",
  "glassdoor.co.in": "Glassdoor India",
  "linkedin.com": "LinkedIn",
  "apna.co": "Apna",
  "wellfound.com": "Wellfound",
};

// URL patterns that identify INDIVIDUAL job postings (not category/listing pages).
// Used to reject "8505 python developer jobs" aggregate pages so we surface
// one card per actual opening.
const INDIVIDUAL_JOB_URL_PATTERNS: Array<RegExp> = [
  /naukri\.com\/job-listings-/i,
  /linkedin\.com\/jobs\/view\//i,
  /indeed\.co\.in\/(viewjob|rc\/clk)/i,
  /shine\.com\/jobs\/[^/]+\/\d+/i,
  /foundit\.in\/job\//i,
  /instahyre\.com\/job\//i,
  /hirist\.tech\/j\//i,
  /cutshort\.io\/job\//i,
  /iimjobs\.com\/j\//i,
  /timesjobs\.com\/job-detail\//i,
  /freshersworld\.com\/jobs\/jobdetails\//i,
  /internshala\.com\/(internship|job)\/detail\//i,
  /glassdoor\.co\.in\/job-listing\//i,
  /apna\.co\/jobs\//i,
  /wellfound\.com\/jobs\/\d+/i,
];

const LISTING_PAGE_BLOCKERS: Array<RegExp> = [
  /\b\d{2,}\s*\+?\s*(jobs|openings|vacancies|positions)\b/i,
  /\/jobs-in-/i,
  /\/job-search/i,
  /\/category\//i,
  /\/companies\//i,
  /\/search\?/i,
];

function isIndividualJobUrl(url: string, title: string): boolean {
  if (LISTING_PAGE_BLOCKERS.some((re) => re.test(url) || re.test(title))) return false;
  return INDIVIDUAL_JOB_URL_PATTERNS.some((re) => re.test(url));
}

function portalLabel(host: string) {
  const h = host.replace(/^www\./, "");
  for (const k of Object.keys(PORTAL_LABELS)) {
    if (h.includes(k)) return PORTAL_LABELS[k];
  }
  return h;
}

function cleanTitle(raw: string) {
  let title = raw
    .replace(/\s*[-|–·]\s*(naukri|shine|foundit|monster|indeed|linkedin|glassdoor|instahyre|hirist|cutshort|iimjobs|timesjobs|freshersworld|internshala|apna|wellfound)[^|]*$/i, "")
    .replace(/\s*\|\s*.*$/, "")
    .replace(/\s+job(s)?\s+(in|at)\s+.*$/i, "")
    .trim();

  // Strip trailing " at/hiring/by/for [Company]" and everything after it
  title = title.replace(/\s+(?:at|@|hiring|by|for)\s+([A-Z][\w&.\- ]{2,}).*$/i, "").trim();

  // Strip trailing " in/near [Location]" and everything after it
  title = title.replace(/\s+(?:in|near)\s+([A-Z][a-zA-Z\s\/,]+)$/i, "").trim();

  // If the title contains a separator and the text following it contains generic listing terms, strip it
  if (/\b(job|jobs|hiring|work from home|wfh|recruitment|careers|salary|fresher|experience|openings|vacancies|walkin)\b/i.test(title)) {
    const parts = title.split(/\s*[-–—·]\s*/);
    if (parts.length > 1) {
      const cleanParts = [];
      for (const part of parts) {
        if (/\b(job|jobs|data entry|writing|marketing|posting|postings|category)\b/i.test(part) && cleanParts.length > 0) {
          break;
        }
        cleanParts.push(part);
      }
      title = cleanParts.join(" - ");
    }
  }

  return title.replace(/\s+/g, " ").trim();
}

function extractCompany(title: string, content: string, host: string): string {
  let company = "";
  const m1 = title.match(/(.+?)\s+(?:at|@|–|-|\|)\s+([A-Z][\w&.\- ]{1,60})/);
  if (m1?.[2]) {
    company = m1[2].trim();
  } else {
    const m2 = content.match(/\b(?:at|by|with|hiring)\s+([A-Z][\w&.\- ]{2,60})\b/);
    if (m2?.[1]) {
      company = m2[1].trim();
    }
  }

  if (company) {
    // Clean " in <City>"
    company = company.replace(/\s+in\s+([A-Z][a-zA-Z]+)/g, "");
    // Remove location parts after slash, comma or hyphen
    company = company.split(/\s*[\/,|–-]\s*/)[0].trim();
    // Reject fake/garbage aggregate companies
    if (/\b(job|jobs|hiring|work from home|wfh|recruitment|careers|salary|fresher|experience|openings|vacancies|walkin)\b/i.test(company)) {
      company = "";
    }
  }

  if (!company || company.length < 2) {
    return portalLabel(host);
  }
  return company;
}

function extractLocation(title: string, content: string): string | null {
  const hay = `${title} ${content}`;
  const cities = [
    "Bengaluru", "Bangalore", "Mumbai", "Delhi", "Gurgaon", "Gurugram",
    "Noida", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad",
    "Jaipur", "Kochi", "Coimbatore", "Indore", "Chandigarh", "Remote",
  ];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, "i").test(hay)) {
      return c === "Bangalore" ? "Bengaluru" : c;
    }
  }
  return null;
}

function parseTavilyResult(r: { url?: string; title?: string; content?: string }): NormalizedJob | null {
  if (!r.url || !r.title) return null;
  try {
    const u = new URL(r.url);
    const host = u.hostname.replace(/^www\./, "");
    const title = cleanTitle(r.title);
    if (title.length < 3) return null;
    // Reject aggregate listing pages — we only want one card per real job.
    if (!isIndividualJobUrl(r.url, r.title)) return null;
    const content = clean(r.content ?? "");
    const company = extractCompany(r.title, content, host);
    const location = extractLocation(r.title, content);
    return {
      source: portalLabel(host).toLowerCase().replace(/\s+/g, "_"),
      title,
      company,
      location,
      remote: /remote|work from home|wfh/i.test(`${r.title} ${content}`),
      url: r.url,
      description: content || title,
      postedAt: null,
    };
  } catch {
    return null;
  }
}

// Hints that nudge Tavily to the per-job detail URL on each portal.
const PORTAL_URL_HINTS: Record<string, string> = {
  "linkedin.com": "inurl:/jobs/view/",
  "naukri.com": "inurl:/job-listings-",
  "indeed.co.in": "inurl:/viewjob",
  "shine.com": "inurl:/jobs/",
  "foundit.in": "inurl:/job/",
  "instahyre.com": "inurl:/job/",
  "hirist.tech": "inurl:/j/",
  "cutshort.io": "inurl:/job/",
  "iimjobs.com": "inurl:/j/",
  "timesjobs.com": "inurl:/job-detail/",
  "freshersworld.com": "inurl:/jobs/jobdetails/",
  "internshala.com": "inurl:/detail/",
  "glassdoor.co.in": "inurl:/job-listing/",
  "apna.co": "inurl:/jobs/",
  "wellfound.com": "inurl:/jobs/",
};

async function searchIndianPortals(
  query: string,
  location: string | undefined,
  remoteOnly: boolean,
  entryLevel: boolean,
  limit: number,
): Promise<NormalizedJob[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const tasks = INDIAN_PORTALS.map(async (domain) => {
    const hint = PORTAL_URL_HINTS[domain] ?? "";
    const portalQuery = [
      query,
      entryLevel ? "entry level fresher 0-2 years" : "",
      location || "India",
      remoteOnly ? "remote work from home" : "",
      hint,
    ]
      .filter(Boolean)
      .join(" ");
    try {
      const res = await fetch(TAVILY_API, {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          query: portalQuery,
          search_depth: "advanced",
          max_results: 8,
          include_domains: [domain],
        }),
      });
      if (!res.ok) return [] as NormalizedJob[];
      const json = (await res.json()) as {
        results?: Array<{ url?: string; title?: string; content?: string }>;
      };
      return (json.results ?? [])
        .map(parseTavilyResult)
        .filter((j): j is NormalizedJob => !!j);
    } catch {
      return [] as NormalizedJob[];
    }
  });
  const batches = await Promise.all(tasks);
  return batches.flat().slice(0, limit * 3);
}

// =============================================================================

export const searchJobsWeb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        query: z.string().min(2).max(200).optional(),
        location: z.string().max(100).optional(),
        remoteOnly: z.boolean().optional(),
        mode: z.enum(["any", "entry_level"]).optional().default("any"),
        limit: z.number().int().min(1).max(100).default(40),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let q = data.query?.trim() ?? "";
    if (!q) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_roles, headline")
        .eq("id", userId)
        .maybeSingle();
      const roles = (profile?.target_roles as string[] | null) ?? [];
      q = roles[0] ?? profile?.headline ?? "Software Engineer";
    }
    const loc = data.location?.trim() || undefined;
    const qTokens = tokens(q);
    const entryLevel = data.mode === "entry_level";

    const filterPass = (rows: NormalizedJob[], applyKeyword = true) => {
      let out = rows;
      if (data.remoteOnly) out = out.filter((j) => j.remote);
      if (loc) {
        const ll = loc.toLowerCase();
        out = out.filter((j) =>
          j.remote || (j.location ?? "").toLowerCase().includes(ll),
        );
      }
      if (entryLevel) out = out.filter(isEntryLevel);
      if (applyKeyword && qTokens.length) {
        out = out.filter((j) => {
          const hay = `${j.title} ${j.company} ${j.description}`.toLowerCase();
          return qTokens.some((t) => hay.includes(t));
        });
      }
      return out;
    };

    // 1. Indian portals first (Tavily-powered).
    let candidates: NormalizedJob[] = [];
    let usedSource = "indian_portals";
    try {
      candidates = await searchIndianPortals(q, loc, !!data.remoteOnly, entryLevel, data.limit);
    } catch (e) {
      console.error("[searchJobsWeb] indian portals error", e);
    }
    let filtered = filterPass(candidates);
    if (filtered.length === 0 && candidates.length > 0) {
      // Relax keyword filter — portal results already match the query string.
      filtered = filterPass(candidates, false);
    }

    // 2. Fall back to remote-job aggregators (good for "remote India" roles).
    if (filtered.length === 0) {
      try {
        const agg = await fetchAggregators(q, loc);
        const aggFiltered = filterPass(agg);
        if (aggFiltered.length > 0) {
          candidates = agg;
          filtered = aggFiltered;
          usedSource = "aggregators";
        }
      } catch (e) {
        console.error("[searchJobsWeb] aggregator error", e);
      }
    }

    if (filtered.length === 0) {
      return {
        ingested: 0,
        skipped: 0,
        jobs: [] as string[],
        error: `No matching jobs found for "${q}". Try a broader keyword, remove filters, or change the location.`,
      };
    }


    // Score + dedupe by URL, keep best.
    const seen = new Map<string, NormalizedJob>();
    for (const j of filtered) {
      if (!j.url) continue;
      const prev = seen.get(j.url);
      if (!prev) seen.set(j.url, j);
    }
    const unique = [...seen.values()];
    unique.sort(
      (a, b) =>
        scoreJob(b, qTokens, loc ?? null, !!data.remoteOnly) -
        scoreJob(a, qTokens, loc ?? null, !!data.remoteOnly),
    );
    const top = unique.slice(0, data.limit);

    // Dedup against existing rows.
    const urls = top.map((j) => j.url);
    const { data: existing } = await supabase
      .from("jobs")
      .select("source_url")
      .eq("user_id", userId)
      .in("source_url", urls);
    const existingSet = new Set((existing ?? []).map((r) => r.source_url));

    const rows = top
      .filter((j) => !existingSet.has(j.url))
      .map((j) => ({
        user_id: userId,
        source: "url_paste" as const,
        source_url: j.url,
        title: j.title,
        company: j.company,
        location: j.location,
        remote: j.remote,
        employment_type: null,
        description: j.description || j.title,
        requirements: [],
        skills: [],
        salary_min: null,
        salary_max: null,
      }));

    if (rows.length === 0) {
      return {
        ingested: 0,
        skipped: top.length,
        jobs: [],
        error: "All matching results are already in your pipeline.",
      };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("jobs")
      .insert(rows)
      .select("id");
    if (insertErr) {
      console.error("[searchJobsWeb] insert error", insertErr);
      return { ingested: 0, skipped: top.length, jobs: [], error: insertErr.message };
    }

    const ids = (inserted ?? []).map((r) => r.id as string);
    console.log(
      `[searchJobsWeb] ingested=${ids.length} skipped=${top.length - ids.length} fallback=${usedSource}`,
    );
    return { ingested: ids.length, skipped: top.length - ids.length, jobs: ids, error: null };
  });
