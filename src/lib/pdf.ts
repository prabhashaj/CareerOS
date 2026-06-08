/**
 * Render Markdown (lightweight subset) as a paginated PDF and trigger download.
 * Supports: # / ## / ### headings, **bold**, *italic*, `code`, "- " bullets,
 * "1. " numbered lists, blank-line paragraph breaks, and horizontal rules (---).
 */
type Inline = { text: string; bold?: boolean; italic?: boolean; mono?: boolean };
type Block =
  | { kind: "h"; level: 1 | 2 | 3; runs: Inline[] }
  | { kind: "p"; runs: Inline[] }
  | { kind: "li"; runs: Inline[]; marker: string; indent: number }
  | { kind: "hr" }
  | { kind: "space" };

function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  // Handle **bold**, *italic*, `code` non-greedily.
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > i) out.push({ text: line.slice(i, m.index) });
    if (m[2] != null) out.push({ text: m[2], bold: true });
    else if (m[3] != null) out.push({ text: m[3], italic: true });
    else if (m[4] != null) out.push({ text: m[4], mono: true });
    i = re.lastIndex;
  }
  if (i < line.length) out.push({ text: line.slice(i) });
  return out;
}

function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (line.trim().length === 0) {
      blocks.push({ kind: "space" });
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push({ kind: "hr" });
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ kind: "h", level: h[1].length as 1 | 2 | 3, runs: parseInline(h[2]) });
      continue;
    }
    const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      blocks.push({ kind: "li", marker: "•", indent: Math.min(bullet[1].length / 2, 3), runs: parseInline(bullet[2]) });
      continue;
    }
    const num = /^(\s*)(\d+)\.\s+(.*)$/.exec(line);
    if (num) {
      blocks.push({ kind: "li", marker: `${num[2]}.`, indent: Math.min(num[1].length / 2, 3), runs: parseInline(num[3]) });
      continue;
    }
    blocks.push({ kind: "p", runs: parseInline(line) });
  }
  return blocks;
}

export async function downloadTextAsPdf(opts: {
  filename: string;
  title?: string;
  body: string;
}) {
  let safeFilename = opts.filename
    .replace(/[\/\\?%*:|"<>]/g, "-") // replace invalid file system characters with hyphen
    .replace(/\s+/g, "_")            // replace whitespace with underscore
    .replace(/__+/g, "_")            // compress multiple underscores
    .trim();

  if (!/\.pdf$/i.test(safeFilename)) {
    safeFilename += ".pdf";
  }
  if (!safeFilename || safeFilename === ".pdf") {
    safeFilename = "document.pdf";
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const setFontFor = (run: Inline, base: "normal" | "bold" = "normal") => {
    const family = run.mono ? "courier" : "helvetica";
    let weight: "normal" | "bold" | "italic" | "bolditalic" = base;
    if (run.bold && run.italic) weight = "bolditalic";
    else if (run.bold || base === "bold") weight = "bold";
    else if (run.italic) weight = "italic";
    doc.setFont(family, weight);
  };

  const drawRuns = (runs: Inline[], x: number, width: number, lineHeight: number, baseBold = false) => {
    // Render with simple word-wrap honoring per-run styling.
    const tokens: { run: Inline; word: string }[] = [];
    for (const r of runs) {
      const parts = r.text.split(/(\s+)/);
      for (const w of parts) if (w.length > 0) tokens.push({ run: r, word: w });
    }
    let cursor = x;
    const right = x + width;
    for (const { run, word } of tokens) {
      setFontFor(run, baseBold ? "bold" : "normal");
      const w = doc.getTextWidth(word);
      if (cursor + w > right && !/^\s+$/.test(word)) {
        y += lineHeight;
        ensureSpace(lineHeight);
        cursor = x;
        if (/^\s+$/.test(word)) continue;
      }
      doc.text(word, cursor, y);
      cursor += w;
    }
    y += lineHeight;
  };

  if (opts.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const lines = doc.splitTextToSize(opts.title, maxWidth) as string[];
    for (const ln of lines) {
      ensureSpace(22);
      doc.text(ln, margin, y);
      y += 22;
    }
    y += 6;
  }

  const blocks = parseMarkdown(opts.body);
  for (const b of blocks) {
    if (b.kind === "space") {
      y += 6;
      continue;
    }
    if (b.kind === "hr") {
      ensureSpace(12);
      doc.setDrawColor(180);
      doc.line(margin, y, margin + maxWidth, y);
      y += 10;
      continue;
    }
    if (b.kind === "h") {
      const size = b.level === 1 ? 16 : b.level === 2 ? 13 : 11.5;
      const lh = size + 4;
      y += b.level === 1 ? 6 : 4;
      ensureSpace(lh);
      doc.setFontSize(size);
      drawRuns(b.runs, margin, maxWidth, lh, true);
      doc.setFontSize(10.5);
      continue;
    }
    if (b.kind === "li") {
      const lh = 14;
      const indent = 14 + b.indent * 12;
      ensureSpace(lh);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "normal");
      doc.text(b.marker, margin + indent - 12, y);
      drawRuns(b.runs, margin + indent, maxWidth - indent, lh);
      continue;
    }
    // paragraph
    ensureSpace(14);
    doc.setFontSize(10.5);
    drawRuns(b.runs, margin, maxWidth, 14);
  }

  doc.save(safeFilename);
}
