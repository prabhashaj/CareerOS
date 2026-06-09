import path from "path";

// Polyfill DOMMatrix globally to support pdfjs-dist in Node.js server environments.
// Modern pdfjs-dist relies on DOMMatrix for coordinate transformations (e.g. image decoding/scaling),
// which is standard in browsers but missing in Node.js.
// We also use a "fake worker" (by not setting pdfjs.GlobalWorkerOptions.workerSrc) to ensure
// that parsing runs on the main thread and has access to this polyfill.
if (typeof globalThis.DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;

    constructor(init?: any) {
      if (init) {
        if (Array.isArray(init)) {
          if (init.length === 6) {
            this.a = init[0];
            this.b = init[1];
            this.c = init[2];
            this.d = init[3];
            this.e = init[4];
            this.f = init[5];
          } else if (init.length === 16) {
            this.a = init[0];
            this.b = init[1];
            this.c = init[4];
            this.d = init[5];
            this.e = init[12];
            this.f = init[13];
          }
        } else if (typeof init === "object") {
          this.a = init.a !== undefined ? init.a : 1;
          this.b = init.b !== undefined ? init.b : 0;
          this.c = init.c !== undefined ? init.c : 0;
          this.d = init.d !== undefined ? init.d : 1;
          this.e = init.e !== undefined ? init.e : 0;
          this.f = init.f !== undefined ? init.f : 0;
        }
      }
    }

    get m11() { return this.a; }
    get m12() { return this.b; }
    get m21() { return this.c; }
    get m22() { return this.d; }
    get m41() { return this.e; }
    get m42() { return this.f; }

    static fromMatrix(init?: any) { return new DOMMatrixPolyfill(init); }
    static fromFloat32Array(init: any) { return new DOMMatrixPolyfill(Array.from(init)); }
    static fromFloat64Array(init: any) { return new DOMMatrixPolyfill(Array.from(init)); }

    scaleSelf(sx = 1, sy = sx) {
      this.a *= sx;
      this.b *= sx;
      this.c *= sy;
      this.d *= sy;
      return this;
    }

    translateSelf(tx = 0, ty = 0) {
      this.e += tx * this.a + ty * this.c;
      this.f += tx * this.b + ty * this.d;
      return this;
    }

    translate(tx = 0, ty = 0) {
      return new DOMMatrixPolyfill(this).translateSelf(tx, ty);
    }

    scale(sx = 1, sy = sx) {
      return new DOMMatrixPolyfill(this).scaleSelf(sx, sy);
    }

    multiply(other: any) {
      const res = new DOMMatrixPolyfill();
      res.a = this.a * other.a + this.c * other.b;
      res.b = this.b * other.a + this.d * other.b;
      res.c = this.a * other.c + this.c * other.d;
      res.d = this.b * other.c + this.d * other.d;
      res.e = this.a * other.e + this.c * other.f + this.e;
      res.f = this.b * other.e + this.d * other.f + this.f;
      return res;
    }
  }
  globalThis.DOMMatrix = DOMMatrixPolyfill as any;
}

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";

// Dynamically compute the absolute path of the worker file.
// Since this runs on the server under TanStack Start / Nitro,
// using a file:// URL ensures standard dynamic import works reliably.
// Note: We leave pdfjs.GlobalWorkerOptions.workerSrc undefined so that
// pdfjs falls back to the "fake worker" executing on the main thread,
// which correctly inherits our global DOMMatrix polyfill.
const workerPath = "file:///" + path.resolve("./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs").replace(/\\/g, "/");

/**
 * Extracts plain text from a PDF file buffer using the legacy build of pdfjs-dist.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  
  // Set standardFontDataUrl to avoid missing font warnings
  const standardFontDataUrl = "file:///" + path.resolve("./node_modules/pdfjs-dist/standard_fonts/").replace(/\\/g, "/") + "/";

  const loadingTask = pdfjs.getDocument({
    data,
    standardFontDataUrl,
    useSystemFonts: true,
  });
  
  const pdfDocument = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}

/**
 * Extracts plain text from a Word (.docx) file buffer using mammoth.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

/**
 * High-level file-agnostic text extraction handler.
 * Decides standard parser to use based on mime_type or file extension.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType?: string,
  filename?: string
): Promise<string> {
  const mime = (mimeType || "").toLowerCase();
  const name = (filename || "").toLowerCase();

  try {
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      return await extractTextFromPdf(buffer);
    }

    if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      return await extractTextFromDocx(buffer);
    }

    // Default fallback for plain text (TXT, MD, etc.)
    return buffer.toString("utf-8");
  } catch (error) {
    const errorPrefix = `Text extraction failed for ${filename || "uploaded file"}`;
    throw new Error(`${errorPrefix}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
