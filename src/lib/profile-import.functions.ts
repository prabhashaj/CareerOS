import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Pulls public profile data from GitHub (REST API) or LinkedIn (Firecrawl),
// then asks the LLM to distill it into a clean knowledge-base markdown blob
// and stores it on `documents` so candidate-context picks it up automatically.

function extractGithubHandle(input: string): string | null {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  const m = trimmed.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]+$/.test(trimmed)) return trimmed;
  return null;
}

async function fetchGithub(handle: string): Promise<string> {
  const headers: Record<string, string> = {
    "User-Agent": "CareerOS/1.0",
    Accept: "application/vnd.github+json",
  };
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${handle}`, { headers, signal: AbortSignal.timeout(15_000) }),
    fetch(`https://api.github.com/users/${handle}/repos?per_page=30&sort=updated`, { headers, signal: AbortSignal.timeout(15_000) }),
  ]);
  if (!userRes.ok) throw new Error(`GitHub user not found (${userRes.status}).`);
  const user = (await userRes.json()) as Record<string, unknown>;
  const repos = reposRes.ok ? ((await reposRes.json()) as Array<Record<string, unknown>>) : [];

  const repoLines = repos
    .filter((r) => !r.fork)
    .slice(0, 20)
    .map(
      (r) =>
        `- ${r.name} (${r.language ?? "n/a"}, ★${r.stargazers_count ?? 0}): ${r.description ?? "no description"}`,
    )
    .join("\n");

  return [
    `GITHUB PROFILE: ${user.login}`,
    `Name: ${user.name ?? ""}`,
    `Bio: ${user.bio ?? ""}`,
    `Location: ${user.location ?? ""}`,
    `Company: ${user.company ?? ""}`,
    `Blog: ${user.blog ?? ""}`,
    `Public repos: ${user.public_repos ?? 0} · Followers: ${user.followers ?? 0}`,
    "",
    "TOP REPOSITORIES:",
    repoLines || "(none)",
  ].join("\n");
}

async function fetchLinkedin(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { markdown?: string }; markdown?: string };
        const md = (json.data?.markdown ?? json.markdown ?? "").trim();
        if (md.length >= 100) {
          return `LINKEDIN PROFILE (${url}):\n${md.slice(0, 20_000)}`;
        }
      }
    } catch (e) {
      console.warn("Firecrawl scrape failed, falling back to Tavily search:", e);
    }
  }

  // Fallback: Use Tavily search to lookup the LinkedIn profile information
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    throw new Error("LinkedIn import requires Firecrawl or Tavily API key configured. Paste your profile text instead.");
  }

  // Extract candidate's unique identifier from the URL
  // e.g. https://www.linkedin.com/in/prabhash-aj-82841a255/ -> prabhash-aj-82841a255
  const match = url.match(/\/in\/([A-Za-z0-9-]+)/i);
  const handle = match?.[1] ?? url;
  // Clean handle for querying: remove trailing alphanumeric ID and replace hyphens with spaces
  const nameQuery = handle.replace(/-[0-9a-zA-Z]+$/, "").replace(/-/g, " ");

  const query = `site:linkedin.com/in/${handle} OR "${handle}" OR "${nameQuery}"`;

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: query,
        search_depth: "advanced",
        max_results: 5,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`Tavily fallback search failed (status ${res.status}).`);
    }

    const json = (await res.json()) as {
      results?: Array<{ url: string; title: string; content: string }>;
    };

    const resultsList = json.results ?? [];
    if (resultsList.length === 0) {
      throw new Error("Could not find public profile details via search. Paste your profile text instead.");
    }

    // Combine snippets/contents from search results to construct profile context
    const snippets = resultsList
      .map((r) => `### Source: ${r.url}\n${r.content}`)
      .join("\n\n");

    if (snippets.length < 100) {
      throw new Error("Could not find public profile details via search. Paste your profile text instead.");
    }

    return `LINKEDIN PROFILE SEARCH CONTEXT (${url}):\n${snippets.slice(0, 20_000)}`;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? e.message
        : "Failed to scrape LinkedIn profile. Paste your profile text instead."
    );
  }
}

export const importProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        github: z.string().max(200).optional(),
        linkedin: z.string().max(500).optional(),
      })
      .refine((v) => !!(v.github || v.linkedin), { message: "Provide a GitHub or LinkedIn URL." })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const sources: string[] = [];
    const titleParts: string[] = [];

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

    // Distill into clean KB markdown the matching pipeline can use.
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();
    let distilled = raw;
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        prompt: `Summarize this candidate's public profile data into a clean Markdown knowledge-base entry that an ATS matcher can use. Include sections: Summary, Skills (bulleted, concrete), Experience, Projects, Education, Certifications, Links. Be faithful — do not invent facts. If a section has no data, omit it.\n\nSOURCE DATA:\n${raw.slice(0, 25_000)}`,
      });
      if (text && text.trim().length > 200) distilled = text.trim();
    } catch (e) {
      console.error("[importProfile] distill failed", e);
    }

    const title = `Imported profile — ${titleParts.join(" + ")}`;
    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        kind: "knowledge_base",
        title,
        extracted_text: distilled,
        metadata: { source: "profile_import", github: data.github ?? null, linkedin: data.linkedin ?? null },
      })
      .select("id, title")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, title: row.title, preview: distilled.slice(0, 800) };
  });
