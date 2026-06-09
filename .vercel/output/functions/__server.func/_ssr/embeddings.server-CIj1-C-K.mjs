const EMBEDDING_MODEL = "mistral-embed";
const EMBED_URL = "https://api.mistral.ai/v1/embeddings";
async function embedTexts(inputs) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    throw new Error(
      "AI features are unavailable: MISTRAL_API_KEY is not set. Add your Mistral API key to the .env file to enable semantic search and document embeddings. Get your key from: https://console.mistral.ai/api-keys/"
    );
  }
  if (inputs.length === 0) return [];
  const BATCH = 64;
  const out = new Array(inputs.length);
  for (let start = 0; start < inputs.length; start += BATCH) {
    const slice = inputs.slice(start, start + BATCH);
    const res = await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: slice })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mistral embedding error ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = await res.json();
    json.data.slice().sort((a, b) => a.index - b.index).forEach((d, i) => {
      out[start + i] = d.embedding;
    });
  }
  return out;
}
async function embedText(input) {
  const [v] = await embedTexts([input]);
  return v;
}
function chunkText(text, size = 1100, overlap = 200) {
  const clean = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n{2,}/).flatMap((p) => splitOversized(p.trim(), size));
  const chunks = [];
  let buf = "";
  for (const p of paragraphs) {
    if (!p) continue;
    if ((buf + "\n\n" + p).length <= size) {
      buf = buf ? `${buf}

${p}` : p;
    } else {
      if (buf) chunks.push(buf);
      buf = overlap > 0 && chunks.length ? tail(chunks[chunks.length - 1], overlap) + "\n\n" + p : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks.map((c) => c.trim()).filter((c) => c.length >= 80 && /[A-Za-z0-9]/.test(c));
}
function splitOversized(p, size) {
  if (p.length <= size) return [p];
  const sentences = p.match(/[^.!?\n]+[.!?]+(\s+|$)|[^.!?\n]+$/g) ?? [p];
  const out = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + s).length > size) {
      if (buf) out.push(buf.trim());
      if (s.length > size) {
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
function tail(s, n) {
  if (s.length <= n) return s;
  const slice = s.slice(-n);
  const cut = slice.search(/[.!?]\s/);
  return cut >= 0 ? slice.slice(cut + 2) : slice;
}
function toVectorLiteral(v) {
  return `[${v.join(",")}]`;
}
const STOPWORDS = new Set(
  "a an the and or but of for to in on at by with from is are was were be been being do does did have has had this that these those it its as your you our we they i me my mine".split(
    " "
  )
);
function extractKeywords(query, max = 8) {
  const tokens = query.toLowerCase().replace(/[^\p{L}\p{N}\s+#.-]/gu, " ").split(/\s+/).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
      if (out.length >= max) break;
    }
  }
  return out;
}
export {
  chunkText,
  embedText,
  embedTexts,
  extractKeywords,
  toVectorLiteral
};
