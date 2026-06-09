import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType } from "../_libs/zod.mjs";
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
function extractGithubHandle(input) {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  const m = trimmed.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]+$/.test(trimmed)) return trimmed;
  return null;
}
async function fetchGithub(handle) {
  const headers = {
    "User-Agent": "CareerOS/1.0",
    Accept: "application/vnd.github+json"
  };
  const [userRes, reposRes] = await Promise.all([fetch(`https://api.github.com/users/${handle}`, {
    headers,
    signal: AbortSignal.timeout(15e3)
  }), fetch(`https://api.github.com/users/${handle}/repos?per_page=30&sort=updated`, {
    headers,
    signal: AbortSignal.timeout(15e3)
  })]);
  if (!userRes.ok) throw new Error(`GitHub user not found (${userRes.status}).`);
  const user = await userRes.json();
  const repos = reposRes.ok ? await reposRes.json() : [];
  const repoLines = repos.filter((r) => !r.fork).slice(0, 20).map((r) => `- ${r.name} (${r.language ?? "n/a"}, ★${r.stargazers_count ?? 0}): ${r.description ?? "no description"}`).join("\n");
  return [`GITHUB PROFILE: ${user.login}`, `Name: ${user.name ?? ""}`, `Bio: ${user.bio ?? ""}`, `Location: ${user.location ?? ""}`, `Company: ${user.company ?? ""}`, `Blog: ${user.blog ?? ""}`, `Public repos: ${user.public_repos ?? 0} · Followers: ${user.followers ?? 0}`, "", "TOP REPOSITORIES:", repoLines || "(none)"].join("\n");
}
async function fetchLinkedin(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true
        }),
        signal: AbortSignal.timeout(3e4)
      });
      if (res.ok) {
        const json = await res.json();
        const md = (json.data?.markdown ?? json.markdown ?? "").trim();
        if (md.length >= 100) {
          return `LINKEDIN PROFILE (${url}):
${md.slice(0, 2e4)}`;
        }
      }
    } catch (e) {
      console.warn("Firecrawl scrape failed, falling back to Tavily search:", e);
    }
  }
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    throw new Error("LinkedIn import requires Firecrawl or Tavily API key configured. Paste your profile text instead.");
  }
  const match = url.match(/\/in\/([A-Za-z0-9-]+)/i);
  const handle = match?.[1] ?? url;
  const nameQuery = handle.replace(/-[0-9a-zA-Z]+$/, "").replace(/-/g, " ");
  const query = `site:linkedin.com/in/${handle} OR "${handle}" OR "${nameQuery}"`;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: "advanced",
        max_results: 5
      }),
      signal: AbortSignal.timeout(15e3)
    });
    if (!res.ok) {
      throw new Error(`Tavily fallback search failed (status ${res.status}).`);
    }
    const json = await res.json();
    const resultsList = json.results ?? [];
    if (resultsList.length === 0) {
      throw new Error("Could not find public profile details via search. Paste your profile text instead.");
    }
    const snippets = resultsList.map((r) => `### Source: ${r.url}
${r.content}`).join("\n\n");
    if (snippets.length < 100) {
      throw new Error("Could not find public profile details via search. Paste your profile text instead.");
    }
    return `LINKEDIN PROFILE SEARCH CONTEXT (${url}):
${snippets.slice(0, 2e4)}`;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Failed to scrape LinkedIn profile. Paste your profile text instead.");
  }
}
const importProfile_createServerFn_handler = createServerRpc({
  id: "830957613f44908f187c8f6dfab3ee897f532826ac1ea82889f3ad23f34fac4b",
  name: "importProfile",
  filename: "src/lib/profile-import.functions.ts"
}, (opts) => importProfile.__executeServer(opts));
const importProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  github: stringType().max(200).optional(),
  linkedin: stringType().max(500).optional()
}).refine((v) => !!(v.github || v.linkedin), {
  message: "Provide a GitHub or LinkedIn URL."
}).parse(input)).handler(importProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const sources = [];
  const titleParts = [];
  if (data.github) {
    const handle = extractGithubHandle(data.github);
    if (!handle) throw new Error("Invalid GitHub username or URL.");
    const block = await fetchGithub(handle);
    sources.push(block);
    titleParts.push(`GitHub @${handle}`);
  }
  if (data.linkedin) {
    if (!/^https?:\/\/(www\.)?linkedin\.com\//i.test(data.linkedin)) {
      throw new Error("LinkedIn URL must look like https://www.linkedin.com/in/yourname");
    }
    const block = await fetchLinkedin(data.linkedin);
    sources.push(block);
    titleParts.push("LinkedIn");
  }
  const raw = sources.join("\n\n---\n\n");
  const {
    generateText
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const gateway = getGateway();
  let distilled = raw;
  try {
    const {
      text
    } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      prompt: `Summarize this candidate's public profile data into a clean Markdown knowledge-base entry that an ATS matcher can use. Include sections: Summary, Skills (bulleted, concrete), Experience, Projects, Education, Certifications, Links. Be faithful — do not invent facts. If a section has no data, omit it.

SOURCE DATA:
${raw.slice(0, 25e3)}`
    });
    if (text && text.trim().length > 200) distilled = text.trim();
  } catch (e) {
    console.error("[importProfile] distill failed", e);
  }
  const title = `Imported profile — ${titleParts.join(" + ")}`;
  const {
    data: row,
    error
  } = await supabase.from("documents").insert({
    user_id: userId,
    kind: "knowledge_base",
    title,
    extracted_text: distilled,
    metadata: {
      source: "profile_import",
      github: data.github ?? null,
      linkedin: data.linkedin ?? null
    }
  }).select("id, title").single();
  if (error) throw new Error(error.message);
  return {
    id: row.id,
    title: row.title,
    preview: distilled.slice(0, 800)
  };
});
export {
  importProfile_createServerFn_handler
};
