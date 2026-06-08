// Server-only helpers for Mistral embeddings.
// Model: mistral-embed (1024 dims — note: different from the previous 1536-dim model;
// if you have existing vectors in pgvector, you'll need to re-embed documents).
const EMBEDDING_MODEL = "mistral-embed";
const EMBED_URL = "https://api.mistral.ai/v1/embeddings";

export async function embedTexts(inputs: string[]): Promise<number[][]> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    throw new Error(
      "AI features are unavailable: MISTRAL_API_KEY is not set. " +
        "Add your Mistral API key to the .env file to enable semantic search and document embeddings. " +
        "Get your key from: https://console.mistral.ai/api-keys/",
    );
  }

  if (inputs.length === 0) return [];

  // Batch large inputs to stay within API limits.
  const BATCH = 64;
  const out: number[][] = new Array(inputs.length);
  for (let start = 0; start < inputs.length; start += BATCH) {
    const slice = inputs.slice(start, start + BATCH);
    const res = await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: slice }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mistral embedding error ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
    json.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .forEach((d, i) => {
        out[start + i] = d.embedding;
      });
  }
  return out;
}

export async function embedText(input: string): Promise<number[]> {
  const [v] = await embedTexts([input]);
  return v;
}


/**
 * Structure-aware chunker.
 * - Splits on blank lines (paragraphs) first.
 * - Greedily packs paragraphs up to `size` characters.
 * - Falls back to sentence-level splits for oversized paragraphs.
 * - Keeps a small overlap (last sentence) for context continuity.
 * - Drops tiny / noisy chunks (< 80 chars or no alphanumerics).
 */
export function chunkText(text: string, size = 1100, overlap = 200): string[] {
  const clean = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n{2,}/).flatMap((p) => splitOversized(p.trim(), size));

  const chunks: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if (!p) continue;
    if ((buf + "\n\n" + p).length <= size) {
      buf = buf ? `${buf}\n\n${p}` : p;
    } else {
      if (buf) chunks.push(buf);
      buf = overlap > 0 && chunks.length ? tail(chunks[chunks.length - 1], overlap) + "\n\n" + p : p;
    }
  }
  if (buf) chunks.push(buf);

  return chunks
    .map((c) => c.trim())
    .filter((c) => c.length >= 80 && /[A-Za-z0-9]/.test(c));
}

function splitOversized(p: string, size: number): string[] {
  if (p.length <= size) return [p];
  // Split on sentence boundaries first.
  const sentences = p.match(/[^.!?\n]+[.!?]+(\s+|$)|[^.!?\n]+$/g) ?? [p];
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + s).length > size) {
      if (buf) out.push(buf.trim());
      if (s.length > size) {
        // hard-wrap very long sentence
        for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
        buf = "";
      } else {
        buf = s;
      }
    } else {
      buf += s;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function tail(s: string, n: number): string {
  if (s.length <= n) return s;
  const slice = s.slice(-n);
  const cut = slice.search(/[.!?]\s/);
  return cut >= 0 ? slice.slice(cut + 2) : slice;
}

// pgvector expects "[1,2,3]" string literal in JS bindings.
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

// Extract meaningful keywords from a query for hybrid retrieval.
const STOPWORDS = new Set(
  "a an the and or but of for to in on at by with from is are was were be been being do does did have has had this that these those it its as your you our we they i me my mine".split(
    " ",
  ),
);

export function extractKeywords(query: string, max = 8): string[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#.-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
      if (out.length >= max) break;
    }
  }
  return out;
}
