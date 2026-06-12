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
      "timesjobs.com": "TimesJobs",
      "freshersworld.com": "Freshersworld",
      "internshala.com": "Internshala",
      "glassdoor.co.in": "Glassdoor India",
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
  ];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, "i").test(hay)) {
      return c === "Bangalore" ? "Bengaluru" : c;
    }
  }
  return null;
}

function isListingPage(url: string, title: string): boolean {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Pattern matching numbers of jobs, vacancies, or positions anywhere in the title
  // E.g., "16 Prevalent Ai Jobs", "41855 Google Cloud Ai Job Vacancies"
  if (/\b\d{2,}\b.*?\b(jobs|openings|vacancies|positions|opportunities|roles)\b/i.test(title)) {
    return true;
  }

  // Broad URL listing patterns
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

  // Common title keywords for listing pages
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

    // Portal specific validations (relaxed to allow listing pages)
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
      return path.includes("/jobs/") || /\/jobs\/\d+/.test(path);
    }
    if (host.includes("lever.co")) {
      const parts = path.split("/").filter(Boolean);
      return parts.length >= 2;
    }
    if (host.includes("ashbyhq.com")) {
      return path.includes("/jobs/");
    }
    if (host.includes("myworkdayjobs.com")) {
      return path.includes("/job/");
    }
    if (host.includes("smartrecruiters.com")) {
      const parts = path.split("/").filter(Boolean);
      return parts.length >= 2;
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

    // Determine if the search location is in India to filter domains
    const isIndia = loc
      ? /india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai|kolkata|jaipur/i.test(loc)
      : true; // Default to true for local optimization

    const key = process.env.TAVILY_API_KEY;
    if (!key) {
      return {
        success: false,
        jobs: [],
        error: "Job search is currently unavailable: TAVILY_API_KEY is not configured.",
      };
    }

    // Formulate search streams targeting portals, ATS systems, and general web career pages
    const searchQueries: Array<{ qText: string; domains: string[] }> = [
      // 1. ATS Boards
      {
        qText: `"${q}" ${loc ? `"${loc}"` : ""} ("job description" OR "apply" OR "requirements")`,
        domains: ["boards.greenhouse.io", "jobs.lever.co", "jobs.ashbyhq.com", "myworkdayjobs.com", "smartrecruiters.com"],
      },
      // 2. Global Portals & Startups
      {
        qText: `"${q}" ${loc ? `"${loc}"` : ""} ("apply" OR "job posting")`,
        domains: ["linkedin.com", "indeed.com", "glassdoor.com", "wellfound.com", "ycombinator.com", "weworkremotely.com"],
      },
      // 3. General Startup Career Pages (entire web search for startup roles)
      {
        qText: `"${q}" ${loc ? `"${loc}"` : ""} ("careers" OR "hiring" OR "join us") "job description"`,
        domains: [], // No domain restrictions to capture direct startup website listings
      }
    ];

    // 4. Indian Portals & Startups (if location matches India)
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
            api_key: key,
            query: qText,
            search_depth: "advanced",
            max_results: 15,
            include_domains: domains.length > 0 ? domains : undefined,
            time_range: "week", // Ensure active and latest jobs
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

    // Heuristics URL & Title Blockers
    const BAD_URL_PATTERNS = [
      /\/blog\b/i,
      /\/blogs\b/i,
      /\/news\b/i,
      /\/resource\b/i,
      /\/guide\b/i,
      /\/how-to\b/i,
      /\/resume\b/i,
      /\/interview\b/i,
      /\/course\b/i,
      /\/courses\b/i,
      /\/salary\b/i,
      /\/hiring-advice\b/i,
      /\/career-path\b/i,
      /\/questions\b/i,
      /\/forum\b/i,
      /\/discussion\b/i,
      /\/insights\b/i,
      /\/press\b/i,
      /\/support\b/i,
      /\/help\b/i,
      /\/login\b/i,
      /\/register\b/i,
      /\/signup\b/i,
    ];

    const BAD_TITLE_PATTERNS = [
      /\bhow to\b/i,
      /\btips\b/i,
      /\bquestions\b/i,
      /\banswers\b/i,
      /\bbest jobs\b/i,
      /\btop \d+\b/i,
      /\bguide\b/i,
      /\bresume\b/i,
      /\bsalary guide\b/i,
      /\binterview questions\b/i,
      /\bcourse\b/i,
      /\bclasses\b/i,
      /\bcertification\b/i,
    ];

    const candidates = rawResults.filter((r): r is { url: string; title: string; content: string; raw_content?: string } => {
      const url = r.url;
      const title = r.title;
      if (!url || !title) return false;
      if (BAD_URL_PATTERNS.some((p) => p.test(url))) return false;
      if (BAD_TITLE_PATTERNS.some((p) => p.test(title))) return false;
      return isRealJobUrl(url, title);
    });

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
        return host;
      } catch {
        return "Web";
      }
    }

    let finalJobs: Array<{
      source: string;
      title: string;
      company: string;
      location: string | null;
      remote: boolean;
      url: string;
      description: string;
      postedAt: string | null;
    }> = [];

    // AI Filter & Extraction
    if (candidates.length > 0) {
      try {
        const { generateObject } = await import("ai");
        const { getGateway } = await import("@/lib/ai-gateway.server");
        const gateway = getGateway();

        // Limit payload size to avoid token overflow
        const listToEvaluate = candidates.slice(0, 25).map((c, idx) => {
          const isPossibleList = isListingPage(c.url, c.title);
          return {
            index: idx,
            title: c.title,
            url: c.url,
            isPossibleList,
            snippet: c.content ? c.content.slice(0, 300) : "",
            raw_content: c.raw_content
              ? c.raw_content.slice(0, 6000)
              : (c.content ? c.content.slice(0, 500) : ""),
          };
        });

        const response = await generateObject({
          model: gateway("google/gemini-2.5-flash"),
          system: `You are an expert recruitment AI. Your task is to analyze web search results and extract SPECIFIC, INDIVIDUAL job postings (specific roles at specific companies that a candidate can apply to).

A candidate search result (provided with title, url, snippet, raw_content, and isPossibleList flag) can be:
- An individual job description page (details for a single opening).
- A job search/listing page, directory, or aggregate page containing multiple jobs.
- Irrelevant content (blogs, guides, courses, articles, homepages, login pages) - discard these.

For each relevant search result:
1. If it is an individual job description page, extract that single job.
2. If it is a listing/aggregate/search page, extract ALL the individual job postings listed. For each extracted job, look at the raw_content or snippet to find:
   - Clean Job Title: Extract only the job role/title (e.g. "Software Engineer" or "React Developer"). Strip company slogans, "hiring for", location suffixes, and other boilerplate.
   - Company Name: Extract the actual employer/company. Do NOT name the portal/site (e.g. if the job is on Cutshort or Naukri, extract the company hiring like "SynRadar" or "Steps AI", not "Cutshort" or "Naukri"). If the company cannot be found, use the domain name without suffix.
   - Location: Specific location if mentioned, or null.
   - Remote: Is it remote/WFH?
   - URL: The specific URL for this individual job. If a specific URL (like a direct job link) is available in the text/raw_content, extract it. Otherwise, fallback to the parent page URL.
   - Description: A brief description snippet of the job requirements or role (1-2 sentences).

STRICTLY EXCLUDE aggregate listing pages as single jobs. You MUST decompose them into individual jobs. If you cannot extract any individual jobs from a list page, discard it.`,
          prompt: `Search Query: "${q}"\nLocation: "${loc ?? ""}"\n\nAnalyze these candidates:\n${JSON.stringify(listToEvaluate, null, 2)}`,
          schema: z.object({
            jobs: z.array(
              z.object({
                parentIndex: z.number().int().describe("The index of the candidate search result from the input list"),
                title: z.string().describe("Cleaned job title"),
                company: z.string().describe("Cleaned hiring company name"),
                location: z.string().nullable().describe("Specific location if mentioned, or null"),
                remote: z.boolean().describe("Is the job remote?"),
                url: z.string().describe("The specific job detail URL or fallback to the parent page URL"),
                description: z.string().describe("Brief description of the job requirements/role"),
              })
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

          finalJobs.push({
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
        console.error("[searchJobsWeb] AI extraction failed, falling back to heuristics:", err);
        // Heuristic fallback: strictly filter out listing pages
        const filteredCandidates = candidates.filter((c) => !isListingPage(c.url, c.title));
        finalJobs = filteredCandidates.map((c) => {
          const source = getJobSource(c.url);
          const title = cleanTitle(c.title);
          const content = clean(c.content);
          const company = extractCompany(c.title, content, new URL(c.url).hostname);
          const location = extractLocation(c.title, content);
          return {
            source,
            title,
            company,
            location,
            remote: /remote|work from home|wfh/i.test(`${c.title} ${c.content}`),
            url: c.url,
            description: content || c.title,
            postedAt: null,
          };
        });
      }
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const dedupedJobs = [];
    for (const job of finalJobs) {
      if (seenUrls.has(job.url)) continue;
      seenUrls.add(job.url);
      dedupedJobs.push(job);
    }

    // Score jobs lightly based on keywords for sorting (remoteOnly & query tokens)
    const qTokens = tokens(q);
    dedupedJobs.sort(
      (a, b) =>
        scoreJob(b, qTokens, loc ?? null, !!data.remoteOnly) -
        scoreJob(a, qTokens, loc ?? null, !!data.remoteOnly),
    );

    // Apply remote only filtering if selected
    let filtered = dedupedJobs;
    if (data.remoteOnly) {
      filtered = filtered.filter((j) => j.remote);
    }

    const top = filtered.slice(0, data.limit);

    // Check pipeline status
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

    return {
      success: true,
      jobs: jobsWithStatus,
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
