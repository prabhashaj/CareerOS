import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType, j as arrayType } from "../_libs/zod.mjs";
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
async function scrapeUrl(url, apiKey) {
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
    signal: AbortSignal.timeout(25e3)
  });
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const json = await res.json();
  return (json.data?.markdown ?? json.markdown ?? "").replace(/\s+/g, " ").trim().slice(0, 2e4);
}
const expandProfile_createServerFn_handler = createServerRpc({
  id: "f9e29a34087db992df181049503dcac8fd3c6cdc6c2285fa73657c0a51ef0011",
  name: "expandProfile",
  filename: "src/lib/expand.functions.ts"
}, (opts) => expandProfile.__executeServer(opts));
const expandProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  urls: arrayType(stringType().url()).min(1).max(8),
  title: stringType().min(1).max(120).default("Profile enrichment")
}).parse(input)).handler(expandProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("Firecrawl is not configured.");
  const scraped = [];
  for (const url of data.urls) {
    try {
      scraped.push({
        url,
        text: await scrapeUrl(url, apiKey)
      });
    } catch (e) {
      scraped.push({
        url,
        text: "",
        error: e instanceof Error ? e.message : "scrape failed"
      });
    }
  }
  const okSources = scraped.filter((s) => s.text.length > 80);
  if (okSources.length === 0) throw new Error("None of the URLs returned readable content.");
  const {
    generateText
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const {
    EXPAND_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const gateway = getGateway();
  const {
    text: enriched
  } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    system: EXPAND_SYSTEM,
    prompt: okSources.map((s) => `SOURCE: ${s.url}
${s.text}`).join("\n\n---\n\n")
  });
  const {
    data: doc,
    error
  } = await supabase.from("documents").insert({
    user_id: userId,
    title: data.title,
    kind: "knowledge_base",
    extracted_text: enriched,
    mime_type: "text/markdown",
    metadata: {
      source_urls: data.urls,
      kind: "profile_enrichment"
    }
  }).select().single();
  if (error) throw new Error(error.message);
  const {
    embedTexts,
    chunkText,
    toVectorLiteral
  } = await import("./embeddings.server-CIj1-C-K.mjs");
  const chunks = chunkText(enriched);
  if (chunks.length > 0) {
    const vectors = await embedTexts(chunks);
    await supabase.from("document_chunks").insert(chunks.map((content, i) => ({
      user_id: userId,
      document_id: doc.id,
      chunk_index: i,
      content,
      embedding: toVectorLiteral(vectors[i]),
      metadata: {
        title: doc.title,
        kind: doc.kind
      }
    })));
  }
  return {
    document_id: doc.id,
    enriched_chars: enriched.length,
    chunks: chunks.length,
    sources: scraped.map((s) => ({
      url: s.url,
      ok: !s.error,
      error: s.error ?? null
    }))
  };
});
export {
  expandProfile_createServerFn_handler
};
