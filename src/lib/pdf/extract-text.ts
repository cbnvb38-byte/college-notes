import "server-only";
import { createClient } from "@supabase/supabase-js";

// Safe import path: avoids the root-level require() which triggers
// "test/data/05-versions-space.pdf ENOENT" in Next.js / Turbopack
// and avoids pdfjs-dist worker loading in server runtime.
// pdf-parse v1.1.1 is a pure Node.js parser — no web workers needed.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const isDev = process.env.NODE_ENV === "development";

function devLog(...args: unknown[]) {
  if (isDev) console.log("[PDF Extract]", ...args);
}

export interface PDFExtractionResult {
  text: string;
  bufferSize: number;
  firstBytes: string;
}

/**
 * Download and extract readable text from a PDF stored in Supabase Storage.
 * Server-only. No web workers, no pdfjs-dist, no browser runtime required.
 */
export async function extractTextFromPDF(filePath: string): Promise<PDFExtractionResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  devLog("Downloading from storage:", filePath);

  // 1. Download from Supabase Storage bucket "notes"
  const { data, error } = await supabase.storage.from("notes").download(filePath);

  if (error || !data) {
    devLog("Storage download FAILED:", error?.message);
    throw new Error("Could not load the PDF file from storage.");
  }

  // 2. Convert Blob → Buffer
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const bufferSize = buffer.length;

  // Read first 5 bytes for header check (safe even if buffer is small)
  const firstBytes = buffer.slice(0, 5).toString("binary").replace(/[^\x20-\x7E]/g, "?");

  devLog("Buffer size:", bufferSize, "bytes");
  devLog("First 5 bytes:", JSON.stringify(firstBytes));

  // 3. Verify it is actually a PDF
  if (bufferSize < 4 || !buffer.slice(0, 4).toString("binary").startsWith("%PDF")) {
    devLog("PDF validity check: FAILED");
    throw new Error("The stored file is not a valid PDF.");
  }
  devLog("PDF validity check: PASSED");
  devLog("Parser: pdf-parse v1.1.1 (pure Node.js, no web worker)");

  // 4. Extract text with pdf-parse
  let text = "";
  try {
    const parsed = await pdfParse(buffer);
    text = (parsed.text as string) || "";
  } catch (parseErr: any) {
    devLog("pdf-parse error:", parseErr.message);
    throw new Error("Could not extract readable text from this PDF.");
  }

  // 5. Clean up: collapse repeated whitespace and blank lines
  text = text
    .replace(/[ \t]+/g, " ")       // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")     // collapse 3+ blank lines to 2
    .trim();

  devLog("Extracted text length:", text.length, "characters");

  // 6. Guard against scanned / image-only PDFs
  if (text.length < 100) {
    devLog("Text too short — likely scanned/image-based PDF");
    throw new Error(
      "This PDF appears to be scanned or does not contain enough selectable text for Smart Summary."
    );
  }

  return { text, bufferSize, firstBytes };
}
