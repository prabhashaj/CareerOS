import path from "path";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extracts plain text from a PDF file buffer using unpdf.
 * unpdf is cross-platform, zero-dependency, and works seamlessly in serverless (e.g. Vercel)
 * without requiring DOMMatrix polyfills or external worker files.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
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
