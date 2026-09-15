import * as pdfjsLib from 'pdfjs-dist';

// Set up worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Could not set PDF worker URL", e);
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface PDFExtractionResult {
  numPages: number;
  pages: ExtractedPage[];
  fullText: string;
  totalWords: number;
  characterCount: number;
}

export async function extractTextFromPDF(
  fileOrArrayBuffer: File | ArrayBuffer,
  onProgress?: (progress: number, total: number) => void
): Promise<PDFExtractionResult> {
  const arrayBuffer =
    fileOrArrayBuffer instanceof File
      ? await fileOrArrayBuffer.arrayBuffer()
      : fileOrArrayBuffer;

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pages: ExtractedPage[] = [];
  let totalText = "";

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pages.push({
        pageNumber: i,
        text: pageText,
      });

      totalText += `\n[صفحة ${i}]:\n` + pageText + "\n";
    } catch (err) {
      console.warn(`Error extracting text from page ${i}`, err);
      pages.push({
        pageNumber: i,
        text: `[تعذر استخراج النص مباشرة من الصفحة ${i} - سيتم الاعتماد على الفحص الذكي للـ PDF]`,
      });
    }

    if (onProgress) {
      onProgress(i, numPages);
    }
  }

  const words = totalText.trim().split(/\s+/).filter(Boolean);

  return {
    numPages,
    pages,
    fullText: totalText.trim(),
    totalWords: words.length,
    characterCount: totalText.length,
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
