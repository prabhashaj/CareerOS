import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, h as numberType, k as enumType, z as booleanType, i as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const TAVILY_API = "https://api.tavily.com/search";
const ENTRY_LEVEL_PATTERNS = [/\bentry[\s-]?level\b/i, /\bjunior\b/i, /\bjr\.?\b/i, /\bintern(ship)?\b/i, /\bgraduate\b/i, /\bnew[\s-]?grad\b/i, /\bfresher?s?\b/i, /\btrainee\b/i, /\bassociate\b/i, /\bapprentice\b/i, /\b0[\s-]?to[\s-]?2[\s-]?years?\b/i, /\b0[\s-]?-?[\s-]?2\s?(yrs?|years?)\b/i, /\bless than (1|2|3) years?\b/i, /\bL[12]\b/];
function clean(text, max = 5e3) {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function isEntryLevel(j) {
  const hay = `${j.title} ${j.description}`;
  return ENTRY_LEVEL_PATTERNS.some((re) => re.test(hay));
}
function tokens(q) {
  return q.toLowerCase().split(/[^a-z0-9+#.]+/i).filter((t) => t.length >= 2 && !["the", "and", "for", "with", "job", "jobs", "remote", "in", "of", "a", "an"].includes(t));
}
function scoreJob(j, qTokens, loc, remoteOnly) {
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
async function fetchJSON(url, init, timeoutMs = 8e3) {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/json",
        "User-Agent": "CareerOS/1.0 (+https://careeros.app)",
        ...init?.headers ?? {}
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function fromRemotive(query) {
  const url = `https://remotive.com/api/remote-jobs?limit=50${query ? `&search=${encodeURIComponent(query)}` : ""}`;
  const json = await fetchJSON(url);
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
      postedAt: j.publication_date ?? null
    }];
  });
}
async function fromArbeitnow() {
  const json = await fetchJSON("https://www.arbeitnow.com/api/job-board-api");
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
      postedAt: j.created_at ?? null
    }];
  });
}
async function fromTheMuse(query, page = 0) {
  const url = `https://www.themuse.com/api/public/jobs?page=${page}&descending=true${query ? `&category=${encodeURIComponent(query)}` : ""}`;
  const json = await fetchJSON(url);
  return (json?.results ?? []).flatMap((j) => {
    const title = String(j.name ?? "").trim();
    const company = String(j.company?.name ?? "").trim();
    if (!title || !company) return [];
    const locs = j.locations ?? [];
    const location = locs.map((l) => l.name).filter(Boolean).join(", ") || null;
    const refs = j.refs;
    return [{
      source: "themuse",
      title,
      company,
      location,
      remote: /remote/i.test(location ?? ""),
      url: refs?.landing_page ?? "",
      description: clean(String(j.contents ?? "")),
      postedAt: j.publication_date ?? null
    }];
  });
}
async function fromJobicy(query, geo) {
  const params = new URLSearchParams({
    count: "50"
  });
  if (query) params.set("tag", query);
  if (geo) params.set("geo", geo);
  const json = await fetchJSON(`https://jobicy.com/api/v2/remote-jobs?${params}`);
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
      postedAt: j.pubDate ?? null
    }];
  });
}
async function fromRemoteOK(query) {
  const url = `https://remoteok.com/api${query ? `?tags=${encodeURIComponent(query.split(/\s+/)[0])}` : ""}`;
  const json = await fetchJSON(url);
  if (!Array.isArray(json)) return [];
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
      postedAt: j.date ?? null
    }];
  });
}
async function fetchAggregators(query, location) {
  const geo = location?.toLowerCase().includes("usa") || location?.toLowerCase().includes("united states") ? "usa" : void 0;
  const results = await Promise.all([fromRemotive(query).catch(() => []), fromArbeitnow().catch(() => []), fromTheMuse(query, 0).catch(() => []), fromJobicy(query, geo).catch(() => []), fromRemoteOK(query).catch(() => [])]);
  return results.flat();
}
const INDIAN_PORTALS = ["naukri.com", "shine.com", "foundit.in", "instahyre.com", "hirist.tech", "cutshort.io", "iimjobs.com", "indeed.co.in", "timesjobs.com", "freshersworld.com", "internshala.com", "glassdoor.co.in", "linkedin.com", "apna.co", "wellfound.com"];
const PORTAL_LABELS = {
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
  "wellfound.com": "Wellfound"
};
const INDIVIDUAL_JOB_URL_PATTERNS = [/naukri\.com\/job-listings-/i, /linkedin\.com\/jobs\/view\//i, /indeed\.co\.in\/(viewjob|rc\/clk)/i, /shine\.com\/jobs\/[^/]+\/\d+/i, /foundit\.in\/job\//i, /instahyre\.com\/job\//i, /hirist\.tech\/j\//i, /cutshort\.io\/job\//i, /iimjobs\.com\/j\//i, /timesjobs\.com\/job-detail\//i, /freshersworld\.com\/jobs\/jobdetails\//i, /internshala\.com\/(internship|job)\/detail\//i, /glassdoor\.co\.in\/job-listing\//i, /apna\.co\/jobs\//i, /wellfound\.com\/jobs\/\d+/i];
const LISTING_PAGE_BLOCKERS = [/\b\d{2,}\s*\+?\s*(jobs|openings|vacancies|positions)\b/i, /\/jobs-in-/i, /\/job-search/i, /\/category\//i, /\/companies\//i, /\/search\?/i];
function isIndividualJobUrl(url, title) {
  if (LISTING_PAGE_BLOCKERS.some((re) => re.test(url) || re.test(title))) return false;
  return INDIVIDUAL_JOB_URL_PATTERNS.some((re) => re.test(url));
}
function portalLabel(host) {
  const h = host.replace(/^www\./, "");
  for (const k of Object.keys(PORTAL_LABELS)) {
    if (h.includes(k)) return PORTAL_LABELS[k];
  }
  return h;
}
function cleanTitle(raw) {
  let title = raw.replace(/\s*[-|–·]\s*(naukri|shine|foundit|monster|indeed|linkedin|glassdoor|instahyre|hirist|cutshort|iimjobs|timesjobs|freshersworld|internshala|apna|wellfound)[^|]*$/i, "").replace(/\s*\|\s*.*$/, "").replace(/\s+job(s)?\s+(in|at)\s+.*$/i, "").trim();
  title = title.replace(/\s+(?:at|@|hiring|by|for)\s+([A-Z][\w&.\- ]{2,}).*$/i, "").trim();
  title = title.replace(/\s+(?:in|near)\s+([A-Z][a-zA-Z\s\/,]+)$/i, "").trim();
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
function extractCompany(title, content, host) {
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
    company = company.replace(/\s+in\s+([A-Z][a-zA-Z]+)/g, "");
    company = company.split(/\s*[\/,|–-]\s*/)[0].trim();
    if (/\b(job|jobs|hiring|work from home|wfh|recruitment|careers|salary|fresher|experience|openings|vacancies|walkin)\b/i.test(company)) {
      company = "";
    }
  }
  if (!company || company.length < 2) {
    return portalLabel(host);
  }
  return company;
}
function extractLocation(title, content) {
  const hay = `${title} ${content}`;
  const cities = ["Bengaluru", "Bangalore", "Mumbai", "Delhi", "Gurgaon", "Gurugram", "Noida", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Coimbatore", "Indore", "Chandigarh", "Remote"];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, "i").test(hay)) {
      return c === "Bangalore" ? "Bengaluru" : c;
    }
  }
  return null;
}
function parseTavilyResult(r) {
  if (!r.url || !r.title) return null;
  try {
    const u = new URL(r.url);
    const host = u.hostname.replace(/^www\./, "");
    const title = cleanTitle(r.title);
    if (title.length < 3) return null;
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
      postedAt: null
    };
  } catch {
    return null;
  }
}
const PORTAL_URL_HINTS = {
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
  "wellfound.com": "inurl:/jobs/"
};
async function searchIndianPortals(query, location, remoteOnly, entryLevel, limit) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  const tasks = INDIAN_PORTALS.map(async (domain) => {
    const hint = PORTAL_URL_HINTS[domain] ?? "";
    const portalQuery = [query, entryLevel ? "entry level fresher 0-2 years" : "", location || "India", remoteOnly ? "remote work from home" : "", hint].filter(Boolean).join(" ");
    try {
      const res = await fetch(TAVILY_API, {
        method: "POST",
        signal: AbortSignal.timeout(1e4),
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: key,
          query: portalQuery,
          search_depth: "advanced",
          max_results: 8,
          include_domains: [domain]
        })
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.results ?? []).map(parseTavilyResult).filter((j) => !!j);
    } catch {
      return [];
    }
  });
  const batches = await Promise.all(tasks);
  return batches.flat().slice(0, limit * 3);
}
const searchJobsWeb_createServerFn_handler = createServerRpc({
  id: "88a23fd8ea2ce93d18ebdd701a87d4c4decf7b18fd0d26aee8ab06e06474b5f1",
  name: "searchJobsWeb",
  filename: "src/lib/jobsearch.functions.ts"
}, (opts) => searchJobsWeb.__executeServer(opts));
const searchJobsWeb = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  query: stringType().min(2).max(200).optional(),
  location: stringType().max(100).optional(),
  remoteOnly: booleanType().optional(),
  mode: enumType(["any", "entry_level"]).optional().default("any"),
  limit: numberType().int().min(1).max(100).default(40)
}).parse(input)).handler(searchJobsWeb_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  let q = data.query?.trim() ?? "";
  if (!q) {
    const {
      data: profile
    } = await supabase.from("profiles").select("target_roles, headline").eq("id", userId).maybeSingle();
    const roles = profile?.target_roles ?? [];
    q = roles[0] ?? profile?.headline ?? "Software Engineer";
  }
  const loc = data.location?.trim() || void 0;
  const qTokens = tokens(q);
  const entryLevel = data.mode === "entry_level";
  const filterPass = (rows2, applyKeyword = true) => {
    let out = rows2;
    if (data.remoteOnly) out = out.filter((j) => j.remote);
    if (loc) {
      const ll = loc.toLowerCase();
      out = out.filter((j) => j.remote || (j.location ?? "").toLowerCase().includes(ll));
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
  let candidates = [];
  let usedSource = "indian_portals";
  try {
    candidates = await searchIndianPortals(q, loc, !!data.remoteOnly, entryLevel, data.limit);
  } catch (e) {
    console.error("[searchJobsWeb] indian portals error", e);
  }
  let filtered = filterPass(candidates);
  if (filtered.length === 0 && candidates.length > 0) {
    filtered = filterPass(candidates, false);
  }
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
      jobs: [],
      error: `No matching jobs found for "${q}". Try a broader keyword, remove filters, or change the location.`
    };
  }
  const seen = /* @__PURE__ */ new Map();
  for (const j of filtered) {
    if (!j.url) continue;
    const prev = seen.get(j.url);
    if (!prev) seen.set(j.url, j);
  }
  const unique = [...seen.values()];
  unique.sort((a, b) => scoreJob(b, qTokens, loc ?? null, !!data.remoteOnly) - scoreJob(a, qTokens, loc ?? null, !!data.remoteOnly));
  const top = unique.slice(0, data.limit);
  const urls = top.map((j) => j.url);
  const {
    data: existing
  } = await supabase.from("jobs").select("source_url").eq("user_id", userId).in("source_url", urls);
  const existingSet = new Set((existing ?? []).map((r) => r.source_url));
  const rows = top.filter((j) => !existingSet.has(j.url)).map((j) => ({
    user_id: userId,
    source: "url_paste",
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
    salary_max: null
  }));
  if (rows.length === 0) {
    return {
      ingested: 0,
      skipped: top.length,
      jobs: [],
      error: "All matching results are already in your pipeline."
    };
  }
  const {
    data: inserted,
    error: insertErr
  } = await supabase.from("jobs").insert(rows).select("id");
  if (insertErr) {
    console.error("[searchJobsWeb] insert error", insertErr);
    return {
      ingested: 0,
      skipped: top.length,
      jobs: [],
      error: insertErr.message
    };
  }
  const ids = (inserted ?? []).map((r) => r.id);
  console.log(`[searchJobsWeb] ingested=${ids.length} skipped=${top.length - ids.length} fallback=${usedSource}`);
  return {
    ingested: ids.length,
    skipped: top.length - ids.length,
    jobs: ids,
    error: null
  };
});
export {
  searchJobsWeb_createServerFn_handler
};
