import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// =============================================================================
// Multi-source job search.
//
// Strategy:
//   1. Query a wide set of FREE, no-key public job APIs in parallel
//      (Remotive, Arbeitnow, The Muse, Jobicy, RemoteOK). Each one
//      guarantees structured title + company + location so cards are clean.
//   2. If TAVILY_API_KEY is configured, also query live ATS boards
//      (Greenhouse, Lever, Ashby, Workday) and job portals (LinkedIn, Naukri,
//      Cutshort, etc.) and extract postings via AI or heuristic fallback.
//   3. Merge, deduplicate by canonical URL and (title + company), score against
//      query/location/mode/remote filters, and check existing pipeline status.
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

function clean(text: unknown, max = 5000): string {
  if (typeof text !== "string") return "";
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

function normalizeUrlForDedup(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.searchParams.delete("ref");
    u.hash = "";
    let cleanUrl = u.toString();
    if (cleanUrl.endsWith("/")) cleanUrl = cleanUrl.slice(0, -1);
    return cleanUrl;
  } catch {
    return rawUrl.trim();
  }
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

// --- Free Aggregator Adapters (No API key required) --------------------------

async function fromRemotive(query: string): Promise<NormalizedJob[]> {
  const url = `https://remotive.com/api/remote-jobs?limit=50${query ? `&search=${encodeURIComponent(query)}` : ""}`;
  const json = await fetchJSON<{ jobs?: Array<Record<string, unknown>> }>(url);
  return (json?.jobs ?? []).flatMap((j) => {
    const title = String(j.title ?? "").trim();
    const company = String(j.company_name ?? "").trim();
    if (!title || !company) return [];
    return [{
      source: "Remotive",
      title,
      company,
      location: String(j.candidate_required_location ?? "Remote").trim() || "Remote",
      remote: true,
      url: String(j.url ?? ""),
      description: clean(j.description),
      postedAt: (j.publication_date as string) ?? null,
    }];
  });
}

async function fromArbeitnow(query?: string): Promise<NormalizedJob[]> {
  const json = await fetchJSON<{ data?: Array<Record<string, unknown>> }>(
    "https://www.arbeitnow.com/api/job-board-api",
  );
  const qLower = query?.toLowerCase().trim();
  return (json?.data ?? []).flatMap((j) => {
    const title = String(j.title ?? "").trim();
    const company = String(j.company_name ?? "").trim();
    if (!title || !company) return [];
    const desc = clean(j.description);
    if (qLower && !title.toLowerCase().includes(qLower) && !desc.toLowerCase().includes(qLower)) {
      return [];
    }
    return [{
      source: "Arbeitnow",
      title,
      company,
      location: String(j.location ?? "").trim() || null,
      remote: Boolean(j.remote),
      url: String(j.url ?? ""),
      description: desc,
      postedAt: (j.created_at as string) ?? null,
    }];
  });
}

async function fromTheMuse(query: string, page = 0): Promise<NormalizedJob[]> {
  const url = `https://www.themuse.com/api/public/jobs?page=${page}&descending=true`;
  const json = await fetchJSON<{ results?: Array<Record<string, unknown>> }>(url);
  const qLower = query?.toLowerCase().trim();
  return (json?.results ?? []).flatMap((j) => {
    const title = String(j.name ?? "").trim();
    const company = String((j.company as { name?: string } | undefined)?.name ?? "").trim();
    if (!title || !company) return [];
    const desc = clean(j.contents);
    if (qLower && !title.toLowerCase().includes(qLower) && !desc.toLowerCase().includes(qLower)) {
      return [];
    }
    const locs = (j.locations as Array<{ name?: string }> | undefined) ?? [];
    const location = locs.map((l) => l.name).filter(Boolean).join(", ") || null;
    const refs = j.refs as { landing_page?: string } | undefined;
    return [{
      source: "The Muse",
      title,
      company,
      location,
      remote: /remote/i.test(location ?? ""),
      url: refs?.landing_page ?? "",
      description: desc,
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
      source: "Jobicy",
      title,
      company,
      location: String(j.jobGeo ?? "Remote").trim() || "Remote",
      remote: true,
      url: String(j.url ?? ""),
      description: clean(j.jobDescription),
      postedAt: (j.pubDate as string) ?? null,
    }];
  });
}

async function fromRemoteOK(query: string): Promise<NormalizedJob[]> {
  const url = "https://remoteok.com/api";
  const json = await fetchJSON<Array<Record<string, unknown>>>(url);
  if (!Array.isArray(json)) return [];
  const qLower = query?.toLowerCase().trim();
  // First entry in RemoteOK response is disclaimer metadata
  return json.slice(1).flatMap((j) => {
    const title = String(j.position ?? "").trim();
    const company = String(j.company ?? "").trim();
    if (!title || !company) return [];
    const desc = clean(j.description);
    const tags = Array.isArray(j.tags) ? j.tags.join(" ") : "";
    if (
      qLower &&
      !title.toLowerCase().includes(qLower) &&
      !desc.toLowerCase().includes(qLower) &&
      !tags.toLowerCase().includes(qLower)
    ) {
      return [];
    }
    return [{
      source: "RemoteOK",
      title,
      company,
      location: String(j.location ?? "Remote").trim() || "Remote",
      remote: true,
      url: String(j.url ?? `https://remoteok.com/remote-jobs/${j.id}`),
      description: desc,
      postedAt: (j.date as string) ?? null,
    }];
  });
}

async function fetchAggregators(query: string, location?: string): Promise<NormalizedJob[]> {
  const geo = location?.toLowerCase().includes("usa") || location?.toLowerCase().includes("united states")
    ? "usa"
    : undefined;

  const results = await Promise.allSettled([
    fromRemotive(query),
    fromArbeitnow(query),
    fromTheMuse(query, 0),
    fromJobicy(query, geo),
    fromRemoteOK(query),
  ]);

  return results
    .filter((r): r is PromiseFulfilledResult<NormalizedJob[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}

// --- Web Extraction & Parsing Helpers ----------------------------------------

function cleanTitle(raw: string) {
  let title = raw
    .replace(/\s*[-|–·]\s*(naukri|shine|foundit|monster|indeed|linkedin|glassdoor|instahyre|hirist|cutshort|iimjobs|timesjobs|freshersworld|internshala|apna|wellfound)[^|]*$/i, "")
    .replace(/\s*\|\s*.*$/, "")
    .replace(/\s+job(s)?\s+(in|at)\s+.*$/i, "")
    .trim();

  // Strip trailing " at/by/for/@ [Company]" but not hiring
  title = title.replace(/\s+(?:at|@|by|for)\s+([A-Z][\w&.\- ]{2,}).*$/i, "").trim();

  // Strip trailing " in/near [Location]"
  title = title.replace(/\s+(?:in|near)\s+([A-Z][a-zA-Z\s\/,]+)$/i, "").trim();

  return title.replace(/\s+/g, " ").trim();
}

function extractCompany(title: string, content: string, host: string): string {
  let company = "";
  const m1 = title.match(/(.+?)\s+(?:at|@|–|-|\|)\s+([A-Z][\w&.\- ]{1,60})/);
  if (m1?.[2]) {
    company = m1[2].trim();
  } else {
    const m2 = content.match(/\b(?:at|by|with)\s+([A-Z][\w&.\- ]{2,60})\b/);
    if (m2?.[1]) {
      company = m2[1].trim();
    }
  }

  if (company) {
    company = company.replace(/\s+in\s+([A-Z][a-zA-Z]+)/g, "");
    company = company.split(/\s*[\/,|–-]\s*/)[0].trim();
    if (/\b(job|jobs|hiring|work from home|wfh|recruitment|careers|salary|fresher|experience|openings|vacancies|walkin)\b/i.test(company)) {
      company = "";
    }
  }

  const portalLabel = (h: string) => {
    const cleanHost = h.replace(/^www\./, "");
    const PORTAL_LABELS: Record<string, string> = {
      "naukri.com": "Naukri",
      "shine.com": "Shine",
      "foundit.in": "Foundit",
      "instahyre.com": "Instahyre",
      "hirist.tech": "Hirist",
      "cutshort.io": "Cutshort",
      "iimjobs.com": "iimjobs",
      "indeed.co.in": "Indeed India",
      "indeed.com": "Indeed",
      "timesjobs.com": "TimesJobs",
      "freshersworld.com": "Freshersworld",
      "internshala.com": "Internshala",
      "glassdoor.co.in": "Glassdoor India",
      "glassdoor.com": "Glassdoor",
      "linkedin.com": "LinkedIn",
      "apna.co": "Apna",
      "wellfound.com": "Wellfound",
    };
    for (const k of Object.keys(PORTAL_LABELS)) {
      if (cleanHost.includes(k)) return PORTAL_LABELS[k];
    }
    return cleanHost;
  };

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
    "San Francisco", "New York", "London", "Berlin", "Toronto", "Austin", "Seattle",
  ];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, "i").test(hay)) {
      return c === "Bangalore" ? "Bengaluru" : c;
    }
  }
  return null;
}

function isListingPage(url: string, title: string): boolean {
  if (/\b\d{2,}\b.*?\b(jobs|openings|vacancies|positions|opportunities|roles)\b/i.test(title)) {
    return true;
  }

  const listingPatterns = [
    /\/jobs-in-/i,
    /\/job-search/i,
    /\/category\//i,
    /\/companies\//i,
    /\/search\?/i,
    /\/jobs\?q=/i,
    /\/jobs\/\?q=/i,
    /naukri\.com\/.*-jobs/i,
    /indeed\.com\/q-/i,
    /linkedin\.com\/jobs\/search/i,
  ];

  if (listingPatterns.some((re) => re.test(url))) {
    return true;
  }

  const listingTitleKeywords = [
    /\b(vacancies|openings|positions|opportunities)\b/i,
    /\b(latest|best|top)\s+.*?\bjobs\b/i,
    /\bjobs\s+in\s+[a-z]+/i,
  ];

  if (listingTitleKeywords.some((re) => re.test(title))) {
    return true;
  }

  return false;
}

function isRealJobUrl(url: string, title: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname;

    const LISTING_PAGE_BLOCKERS = [
      /\/category\//i,
      /\/search\?/i,
    ];
    if (LISTING_PAGE_BLOCKERS.some((re) => re.test(url) || re.test(title))) {
      return false;
    }

    if (host.includes("naukri.com")) {
      return path.includes("/job-listings-") || path.includes("-jobs") || path.includes("/jobs-in-");
    }
    if (host.includes("linkedin.com")) {
      return path.includes("/jobs/view/") || path.includes("/jobs/search/") || path.includes("/jobs/");
    }
    if (host.includes("indeed.com") || host.includes("indeed.co.in")) {
      return path.includes("/viewjob") || path.includes("/rc/clk") || path.includes("/jobs") || path.includes("/q-");
    }
    if (host.includes("glassdoor.com") || host.includes("glassdoor.co.in")) {
      return path.includes("/job-listing/") || path.includes("/Jobs/");
    }
    if (host.includes("instahyre.com")) {
      return path.includes("/job-") || path.includes("/jobs/");
    }
    if (host.includes("cutshort.io")) {
      return path.includes("/job/") || path.includes("/jobs/");
    }
    if (host.includes("foundit.in")) {
      return path.includes("/job/") || path.includes("/lite/job/") || path.includes("/jobs/");
    }
    if (host.includes("hirist.tech")) {
      return path.includes("/j/") || path.includes("/jobs/");
    }
    if (host.includes("shine.com")) {
      return path.includes("/jobs/");
    }
    if (host.includes("greenhouse.io")) {
      return path.includes("/jobs/") || /\/jobs\/\d+/.test(path) || path.split("/").filter(Boolean).length >= 2;
    }
    if (host.includes("lever.co")) {
      return path.split("/").filter(Boolean).length >= 2;
    }
    if (host.includes("ashbyhq.com")) {
      return path.includes("/jobs/") || path.split("/").filter(Boolean).length >= 2;
    }
    if (host.includes("myworkdayjobs.com")) {
      return path.includes("/job/");
    }
    if (host.includes("smartrecruiters.com")) {
      return path.split("/").filter(Boolean).length >= 2;
    }
    if (host.includes("wellfound.com")) {
      return path.includes("/jobs/");
    }
    if (host.includes("ycombinator.com")) {
      return path.includes("/jobs") || path.includes("/companies/");
    }
    if (host.includes("weworkremotely.com")) {
      return path.includes("/remote-jobs/") || path.includes("/jobs/");
    }

    if (path === "/" || path === "") return false;
    return true;
  } catch {
    return false;
  }
}

function getJobSource(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host.includes("indeed.com")) return "Indeed";
    if (host.includes("glassdoor.com")) return "Glassdoor";
    if (host.includes("naukri.com")) return "Naukri";
    if (host.includes("instahyre.com")) return "Instahyre";
    if (host.includes("cutshort.io")) return "Cutshort";
    if (host.includes("hirist.tech")) return "Hirist";
    if (host.includes("foundit.in")) return "Foundit";
    if (host.includes("greenhouse.io")) return "Greenhouse";
    if (host.includes("lever.co")) return "Lever";
    if (host.includes("ashbyhq.com")) return "Ashby";
    if (host.includes("myworkdayjobs.com")) return "Workday";
    if (host.includes("smartrecruiters.com")) return "SmartRecruiters";
    if (host.includes("wellfound.com")) return "Wellfound";
    if (host.includes("ycombinator.com")) return "YCombinator";
    if (host.includes("weworkremotely.com")) return "WeWorkRemotely";
    if (host.includes("remotive.com")) return "Remotive";
    if (host.includes("arbeitnow.com")) return "Arbeitnow";
    if (host.includes("themuse.com")) return "The Muse";
    if (host.includes("jobicy.com")) return "Jobicy";
    if (host.includes("remoteok.com")) return "RemoteOK";
    return host.split(".")[0].toUpperCase();
  } catch {
    return "Web";
  }
}

// =============================================================================
// Server Functions
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

    // 1. Fetch free public job aggregators (No API key needed)
    const aggregatorPromise = fetchAggregators(q, loc).catch((err) => {
      console.error("[searchJobsWeb] Aggregator fetch failed:", err);
      return [] as NormalizedJob[];
    });

    // 2. Fetch Tavily live web & ATS searches if TAVILY_API_KEY is available
    const tavilyKey = process.env.TAVILY_API_KEY;
    const tavilyPromise = (async (): Promise<NormalizedJob[]> => {
      if (!tavilyKey) return [];

      const isIndia = loc
        ? /india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai|kolkata|jaipur/i.test(loc)
        : true;

      const searchQueries: Array<{ qText: string; domains: string[] }> = [
        // ATS Boards
        {
          qText: `"${q}" ${loc ? `"${loc}"` : ""} ("job description" OR "apply" OR "requirements")`,
          domains: ["boards.greenhouse.io", "jobs.lever.co", "jobs.ashbyhq.com", "myworkdayjobs.com", "smartrecruiters.com"],
        },
        // Global Portals & Startups
        {
          qText: `"${q}" ${loc ? `"${loc}"` : ""} ("apply" OR "job posting")`,
          domains: ["linkedin.com", "indeed.com", "glassdoor.com", "wellfound.com", "ycombinator.com", "weworkremotely.com"],
        },
        // General Startup Career Pages
        {
          qText: `"${q}" ${loc ? `"${loc}"` : ""} ("careers" OR "hiring" OR "join us") "job description"`,
          domains: [],
        },
      ];

      if (isIndia) {
        searchQueries.push({
          qText: `"${q}" ${loc ? `"${loc}"` : "India"} ("apply" OR "job posting" OR "experience")`,
          domains: ["naukri.com", "instahyre.com", "cutshort.io", "hirist.tech", "foundit.in"],
        });
      }

      const searchTasks = searchQueries.map(async ({ qText, domains }) => {
        try {
          const res = await fetch(TAVILY_API, {
            method: "POST",
            signal: AbortSignal.timeout(12_000),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: qText,
              search_depth: "advanced",
              max_results: 15,
              include_domains: domains.length > 0 ? domains : undefined,
              time_range: "week",
              include_raw_content: true,
            }),
          });
          if (!res.ok) return [];
          const json = (await res.json()) as {
            results?: Array<{ url?: string; title?: string; content?: string; raw_content?: string }>;
          };
          return json.results ?? [];
        } catch (e) {
          console.error(`[searchJobsWeb] Tavily query failed for "${qText}":`, e);
          return [];
        }
      });

      const searchResponses = await Promise.all(searchTasks);
      const rawResults = searchResponses.flat();

      const BAD_URL_PATTERNS = [
        /\/blog\b/i, /\/blogs\b/i, /\/news\b/i, /\/resource\b/i, /\/guide\b/i,
        /\/how-to\b/i, /\/resume\b/i, /\/interview\b/i, /\/course\b/i, /\/courses\b/i,
        /\/salary\b/i, /\/hiring-advice\b/i, /\/career-path\b/i, /\/questions\b/i,
        /\/forum\b/i, /\/discussion\b/i, /\/insights\b/i, /\/press\b/i, /\/support\b/i,
        /\/help\b/i, /\/login\b/i, /\/register\b/i, /\/signup\b/i,
      ];

      const BAD_TITLE_PATTERNS = [
        /\bhow to\b/i, /\btips\b/i, /\bquestions\b/i, /\banswers\b/i, /\bbest jobs\b/i,
        /\btop \d+\b/i, /\bguide\b/i, /\bresume\b/i, /\bsalary guide\b/i,
        /\binterview questions\b/i, /\bcourse\b/i, /\bclasses\b/i, /\bcertification\b/i,
      ];

      const candidates = rawResults.filter((r): r is { url: string; title: string; content: string; raw_content?: string } => {
        const url = r.url;
        const title = r.title;
        if (!url || !title) return false;
        if (BAD_URL_PATTERNS.some((p) => p.test(url))) return false;
        if (BAD_TITLE_PATTERNS.some((p) => p.test(title))) return false;
        return isRealJobUrl(url, title);
      });

      if (candidates.length === 0) return [];

      const tavilyExtracted: NormalizedJob[] = [];

      // AI-assisted parsing if Mistral API key is set
      if (process.env.MISTRAL_API_KEY) {
        try {
          const { generateObject } = await import("ai");
          const { getGateway } = await import("@/lib/ai-gateway.server");
          const gateway = getGateway();

          const listToEvaluate = candidates.slice(0, 20).map((c, idx) => ({
            index: idx,
            title: c.title,
            url: c.url,
            isPossibleList: isListingPage(c.url, c.title),
            snippet: c.content ? c.content.slice(0, 300) : "",
            raw_content: c.raw_content
              ? c.raw_content.slice(0, 4000)
              : (c.content ? c.content.slice(0, 500) : ""),
          }));

          const response = await generateObject({
            model: gateway("google/gemini-2.5-flash"),
            system: `You are an expert recruitment AI. Analyze web search results and extract SPECIFIC, INDIVIDUAL job postings (role, company, location, url, short description). Discard blogs/guides/login pages.`,
            prompt: `Search Query: "${q}"\nLocation: "${loc ?? ""}"\n\nAnalyze candidates:\n${JSON.stringify(listToEvaluate, null, 2)}`,
            schema: z.object({
              jobs: z.array(
                z.object({
                  parentIndex: z.number().int(),
                  title: z.string().describe("Cleaned job title"),
                  company: z.string().describe("Cleaned hiring company name"),
                  location: z.string().nullable(),
                  remote: z.boolean(),
                  url: z.string().describe("Specific job detail URL or parent page URL"),
                  description: z.string().describe("Brief description of role"),
                }),
              ),
            }),
          });

          for (const item of response.object.jobs) {
            const orig = candidates[item.parentIndex];
            if (!orig) continue;
            let jobUrl = item.url ? item.url.trim() : orig.url;
            if (!jobUrl.startsWith("http://") && !jobUrl.startsWith("https://")) {
              jobUrl = orig.url;
            }
            tavilyExtracted.push({
              source: getJobSource(jobUrl),
              title: item.title || orig.title,
              company: item.company || "Unknown",
              location: item.location,
              remote: item.remote,
              url: jobUrl,
              description: item.description || orig.content || "",
              postedAt: null,
            });
          }
        } catch (err) {
          console.error("[searchJobsWeb] AI extraction failed, falling back to heuristic parsing:", err);
        }
      }

      // Fallback heuristic extraction if AI did not return jobs
      if (tavilyExtracted.length === 0) {
        const filteredCandidates = candidates.filter((c) => !isListingPage(c.url, c.title));
        for (const c of filteredCandidates) {
          const source = getJobSource(c.url);
          const title = cleanTitle(c.title);
          const content = clean(c.content);
          const company = extractCompany(c.title, content, new URL(c.url).hostname);
          const location = extractLocation(c.title, content);
          tavilyExtracted.push({
            source,
            title,
            company,
            location,
            remote: /remote|work from home|wfh/i.test(`${c.title} ${c.content}`),
            url: c.url,
            description: content || c.title,
            postedAt: null,
          });
        }
      }

      return tavilyExtracted;
    })();

    // 3. Wait for all sources
    const [aggregatorJobs, tavilyJobs] = await Promise.all([aggregatorPromise, tavilyPromise]);
    const allJobs = [...aggregatorJobs, ...tavilyJobs];

    // 4. Deduplicate by canonical URL and (title + company)
    const seenUrls = new Set<string>();
    const seenTitleCompany = new Set<string>();
    const dedupedJobs: NormalizedJob[] = [];

    for (const job of allJobs) {
      const normUrl = normalizeUrlForDedup(job.url);
      const titleCompKey = `${job.title.toLowerCase().replace(/[^a-z0-9]/g, "")}::${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

      if (seenUrls.has(normUrl) || seenTitleCompany.has(titleCompKey)) {
        continue;
      }
      seenUrls.add(normUrl);
      seenTitleCompany.add(titleCompKey);
      dedupedJobs.push(job);
    }

    // 5. Filter by remote / entry-level mode
    let filtered = dedupedJobs;
    if (data.remoteOnly) {
      filtered = filtered.filter((j) => j.remote);
    }
    if (data.mode === "entry_level") {
      const entryLevelOnly = filtered.filter((j) => isEntryLevel(j));
      if (entryLevelOnly.length >= 5) {
        filtered = entryLevelOnly;
      }
    }

    // 6. Score and sort matches
    const qTokens = tokens(q);
    filtered.sort(
      (a, b) =>
        scoreJob(b, qTokens, loc ?? null, !!data.remoteOnly) -
        scoreJob(a, qTokens, loc ?? null, !!data.remoteOnly),
    );

    const top = filtered.slice(0, data.limit);

    // 7. Check if already added to user's pipeline in Supabase
    const urls = top.map((j) => j.url);
    let existingSet = new Set<string>();
    if (urls.length > 0) {
      const { data: existing } = await supabase
        .from("jobs")
        .select("source_url")
        .eq("user_id", userId)
        .in("source_url", urls);
      existingSet = new Set((existing ?? []).map((r) => r.source_url).filter((u): u is string => !!u));
    }

    const jobsWithStatus = top.map((j) => ({
      ...j,
      alreadyInPipeline: existingSet.has(j.url),
    }));

    const distinctSources = Array.from(new Set(top.map((j) => j.source)));

    return {
      success: true,
      jobs: jobsWithStatus,
      sourceMeta: {
        queriedAggregators: true,
        tavilyEnabled: Boolean(tavilyKey),
        totalDiscovered: filtered.length,
        sources: distinctSources,
      },
      error: null,
    };
  });

export const importDiscoveredJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        company: z.string().min(1).max(200),
        location: z.string().max(200).nullable(),
        remote: z.boolean(),
        url: z.string().url().max(2000),
        description: z.string().max(50_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check if it already exists in user's pipeline
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("user_id", userId)
      .eq("source_url", data.url)
      .maybeSingle();

    if (existing) {
      return { id: existing.id, alreadyExists: true };
    }

    const { data: row, error } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        source: "url_paste" as const,
        source_url: data.url,
        title: data.title,
        company: data.company,
        location: data.location,
        remote: data.remote,
        description: data.description || data.title,
        requirements: [],
        skills: [],
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id, alreadyExists: false };
  });
