import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Index (chunk + embed) a document's extracted_text. Replaces existing chunks.
export const indexDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ document_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { embedTexts, chunkText, toVectorLiteral } = await import("@/lib/embeddings.server");

    const { data: doc, error: dErr } = await supabase
      .from("documents")
      .select("id, title, kind, extracted_text")
      .eq("id", data.document_id)
      .single();
    if (dErr) throw new Error(dErr.message);
    if (!doc?.extracted_text) throw new Error("Document has no extracted_text to index");

    const chunks = chunkText(doc.extracted_text);
    if (chunks.length === 0) return { indexed: 0 };

    const vectors = await embedTexts(chunks);

    // Replace prior chunks for this document
    await supabase.from("document_chunks").delete().eq("document_id", doc.id);

    const rows = chunks.map((content, i) => ({
      user_id: userId,
      document_id: doc.id,
      chunk_index: i,
      content,
      embedding: toVectorLiteral(vectors[i]),
      metadata: { title: doc.title, kind: doc.kind },
    }));

    const { error: iErr } = await supabase.from("document_chunks").insert(rows);

    if (iErr) throw new Error(iErr.message);

    return { indexed: rows.length };
  });

// Embed a job description so it can be matched / searched.
export const indexJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { embedText, toVectorLiteral } = await import("@/lib/embeddings.server");

    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, title, company, description, skills, requirements")
      .eq("id", data.job_id)
      .single();
    if (error) throw new Error(error.message);

    const composite = [
      `${job.title} @ ${job.company}`,
      (job.skills ?? []).join(", "),
      (job.requirements ?? []).join("\n"),
      job.description ?? "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 8000);

    const vec = await embedText(composite);
    const { error: uErr } = await supabase
      .from("jobs")
      .update({ embedding: toVectorLiteral(vec) })
      .eq("id", job.id);

    if (uErr) throw new Error(uErr.message);

    return { ok: true };
  });

// Retrieve top-k document chunks for a free-text query.
// Hybrid: vector similarity + keyword (ILIKE) recall, fused with Reciprocal
// Rank Fusion, then lightly diversified across documents.
export const retrieveContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        query: z.string().min(1).max(8000),
        match_count: z.number().int().min(1).max(20).default(8),
        min_similarity: z.number().min(0).max(1).default(0.15),
        per_document: z.number().int().min(1).max(10).default(3),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { embedText, toVectorLiteral, extractKeywords } = await import(
      "@/lib/embeddings.server"
    );

    const k = data.match_count;
    const pool = Math.min(40, Math.max(20, k * 4));

    // 1. Vector recall (broader pool than k).
    const vec = await embedText(data.query);
    const vectorPromise = supabase.rpc("match_user_chunks", {
      _user_id: userId,
      query_embedding: toVectorLiteral(vec) as unknown as string,
      match_count: pool,
    });

    // 2. Keyword recall via ILIKE OR over top keywords.
    const keywords = extractKeywords(data.query);
    const keywordPromise = keywords.length
      ? supabase
          .from("document_chunks")
          .select("id, document_id, content, metadata")
          .eq("user_id", userId)
          .or(keywords.slice(0, 6).map((k) => `content.ilike.%${k.replace(/[%_,()]/g, "")}%`).join(","))
          .limit(pool)
      : Promise.resolve({ data: [] as Array<{ id: string; document_id: string; content: string; metadata: Record<string, unknown> | null }>, error: null });

    const [vecRes, kwRes] = await Promise.all([vectorPromise, keywordPromise]);
    if (vecRes.error) throw new Error(vecRes.error.message);

    type Row = {
      id: string;
      document_id: string;
      content: string;
      metadata: Record<string, unknown> | null;
      similarity?: number;
    };
    const vecRows = (vecRes.data ?? []) as unknown as Row[];
    const kwRows = ((kwRes.data ?? []) as unknown as Row[]);

    // Filter weak vector hits early.
    const strongVec = vecRows.filter((r) => (r.similarity ?? 0) >= data.min_similarity);
    // If everything is weak, keep the best few so we don't return empty.
    const vecUsed = strongVec.length >= Math.min(3, k) ? strongVec : vecRows.slice(0, k);

    // Score chunks via Reciprocal Rank Fusion (RRF).
    const RRF_K = 60;
    const scores = new Map<string, { row: Row; score: number }>();
    const addRanked = (rows: Row[], weight: number) => {
      rows.forEach((row, idx) => {
        const prev = scores.get(row.id);
        const inc = weight / (RRF_K + idx + 1);
        if (prev) prev.score += inc;
        else scores.set(row.id, { row, score: inc });
      });
    };
    addRanked(vecUsed, 1.0);
    addRanked(kwRows, 0.6);

    // Mild keyword-overlap boost on raw content (helps exact phrase matches).
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    for (const entry of scores.values()) {
      const text = entry.row.content.toLowerCase();
      const hits = lowerKeywords.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0);
      if (hits) entry.score += 0.02 * hits;
    }

    const ranked = [...scores.values()].sort((a, b) => b.score - a.score);

    // Diversify across documents so one big doc doesn't crowd results.
    const perDoc = new Map<string, number>();
    const out: Array<{
      id: string;
      document_id: string;
      content: string;
      title: string | null;
      similarity: number | null;
      score: number;
    }> = [];
    for (const { row, score } of ranked) {
      const count = perDoc.get(row.document_id) ?? 0;
      if (count >= data.per_document) continue;
      perDoc.set(row.document_id, count + 1);
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      out.push({
        id: row.id,
        document_id: row.document_id,
        content: row.content,
        title: typeof meta.title === "string" ? meta.title : null,
        similarity: typeof row.similarity === "number" ? row.similarity : null,
        score,
      });
      if (out.length >= k) break;
    }
    return out;
  });

