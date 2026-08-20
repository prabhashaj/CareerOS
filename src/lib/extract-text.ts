import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker for browser execution
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md" || ext === "rtf" || ext === "json") {
    const text = await file.text();
    if (!text.trim()) throw new Error("The uploaded text file is empty.");
    return text;
  }

  if (ext === "docx" || ext === "doc") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value.trim();
      if (!text) throw new Error("Could not extract any text from this Word document.");
      return text;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse Word document: ${message}`);
    }
  }

  if (ext === "pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Sort items by Y descending (top-to-bottom), then X ascending (left-to-right)
        type TextItem = { str: string; transform: number[]; hasEOL?: boolean };
        const items = (textContent.items as TextItem[]).filter(
          (item) => item && typeof item.str === "string",
        );

        // Group into lines based on Y coordinate
        let lastY: number | null = null;
        let pageText = "";

        for (const item of items) {
          const y = item.transform && item.transform[5] !== undefined ? item.transform[5] : null;
          if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
            pageText += "\n";
          } else if (pageText.length > 0 && !pageText.endsWith(" ") && !pageText.endsWith("\n")) {
            pageText += " ";
          }

          pageText += item.str;
          if (y !== null) lastY = y;
          if (item.hasEOL) {
            pageText += "\n";
            lastY = null;
          }
        }

        fullText += pageText + "\n\n";
      }

      const trimmed = fullText.trim();
      if (!trimmed || trimmed.length < 15) {
        throw new Error(
          "No readable text found in this PDF. It might be a scanned image or protected. Please upload a vector PDF, DOCX file, or use 'Paste Resume Text'.",
        );
      }
      return trimmed;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse PDF document: ${message}`);
    }
  }

  // Fallback to plain text
  return await file.text();
}
