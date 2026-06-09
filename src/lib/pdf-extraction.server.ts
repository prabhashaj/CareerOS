import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";

// Dynamically compute the absolute path of the worker file.
// Since this runs on the server under TanStack Start / Nitro,
// using a file:// URL ensures standard dynamic import works reliably.
const workerPath = "file:///" + path.resolve("./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs").replace(/\\/g, "/");
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

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
