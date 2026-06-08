import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function scrapeUrl(url: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const json = (await res.json()) as { data?: { markdown?: string }; markdown?: string };
  return (json.data?.markdown ?? json.markdown ?? "").replace(/\s+/g, " ").trim().slice(0, 20_000);
}

export const expandProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      urls: z.array(z.string().url()).min(1).max(8),
      title: z.string().min(1).max(120).default("Profile enrichment"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("Firecrawl is not configured.");

    const scraped: { url: string; text: string; error?: string }[] = [];
    for (const url of data.urls) {
      try {
        scraped.push({ url, text: await scrapeUrl(url, apiKey) });
      } catch (e) {
        scraped.push({ url, text: "", error: e instanceof Error ? e.message : "scrape failed" });
      }
    }
    const okSources = scraped.filter((s) => s.text.length > 80);
    if (okSources.length === 0) throw new Error("None of the URLs returned readable content.");

    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { EXPAND_SYSTEM } = await import("@/lib/prompts.server");
    const gateway = getGateway();
    const { text: enriched } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: EXPAND_SYSTEM,
      prompt: okSources.map((s) => `SOURCE: ${s.url}\n${s.text}`).join("\n\n---\n\n"),
    });

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title: data.title,
        kind: "knowledge_base",
        extracted_text: enriched,
        mime_type: "text/markdown",
        metadata: { source_urls: data.urls, kind: "profile_enrichment" },
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Index synchronously so it shows up in retrieval immediately.
    const { embedTexts, chunkText, toVectorLiteral } = await import("@/lib/embeddings.server");
    const chunks = chunkText(enriched);
    if (chunks.length > 0) {
      const vectors = await embedTexts(chunks);
      await supabase.from("document_chunks").insert(
        chunks.map((content, i) => ({
          user_id: userId,
          document_id: doc.id,
          chunk_index: i,
          content,
          embedding: toVectorLiteral(vectors[i]),
          metadata: { title: doc.title, kind: doc.kind },
        })),
      );
    }

    return {
      document_id: doc.id,
      enriched_chars: enriched.length,
      chunks: chunks.length,
      sources: scraped.map((s) => ({ url: s.url, ok: !s.error, error: s.error ?? null })),
    };
  });
