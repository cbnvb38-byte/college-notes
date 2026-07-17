import "server-only";
import { createClient } from "@supabase/supabase-js";
import { extractTextFromPDF } from "@/lib/pdf/extract-text";
import { cleanStudyText } from "@/lib/ai/clean-study-text";

const isDev = process.env.NODE_ENV === "development";

function devLog(...args: unknown[]) {
  if (isDev) {
    console.log("[Document Content]", ...args);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type DocumentContentResult = {
  success: boolean;
  sourceType: "text_pdf" | "scanned_pdf" | "unknown";
  contentMarkdown: string | null;
  needsDocumentFallback: boolean;
  code?: string;
  message?: string;
};

/**
 * Reusable pipeline to extract, clean, and cache PDF study content.
 * Returns clean markdown/text for generation, or a structured fallback request for scanned PDFs.
 */
export async function getStudyContentForNote(
  noteId: string,
  filePath: string
): Promise<DocumentContentResult> {
  // 1. Cache Check
  const { data: cacheData } = await supabase
    .from("note_text_cache")
    .select("extracted_text")
    .eq("note_id", noteId)
    .single();

  const cacheExists = !!cacheData;
  const cacheLength = cacheData?.extracted_text?.length ?? 0;
  devLog("Cache exists:", cacheExists);
  devLog("Cached text length:", cacheLength);

  if (cacheExists && cacheData.extracted_text && cacheLength >= 100) {
    devLog("Using cached clean content.");
    return {
      success: true,
      sourceType: "text_pdf",
      contentMarkdown: cacheData.extracted_text,
      needsDocumentFallback: false,
    };
  }

  // 2. Normal Extraction
  devLog("No valid cache found. Extracting from PDF.");
  let rawText = "";
  try {
    const extracted = await extractTextFromPDF(filePath);
    rawText = extracted.text;
    devLog("Extracted text length before cleaning:", rawText.length);
  } catch (extError: any) {
    devLog("Extraction error:", extError.message);
    throw new Error(extError.message);
  }

  // 3. Clean Text
  const cleanedText = cleanStudyText(rawText);
  devLog("Cleaned text length:", cleanedText.length);

  // 4. Evaluate Content Length (Scanned PDF Check)
  if (cleanedText.length < 100) {
    devLog("Content too short. Returning SCANNED_PDF_CONFIRM_REQUIRED.");
    return {
      success: false,
      sourceType: "scanned_pdf",
      contentMarkdown: null,
      needsDocumentFallback: true,
      code: "SCANNED_PDF_CONFIRM_REQUIRED",
      message:
        "This PDF looks scanned or image-based. Normal text extraction could not find enough selectable text. Gemini document reading can try to read it, but it may use extra API quota.",
    };
  }

  // 5. Save to Cache
  try {
    await supabase.from("note_text_cache").upsert({
      note_id: noteId,
      extracted_text: cleanedText,
    });
    devLog("Cleaned content saved to cache.");
  } catch (cacheError) {
    devLog("Failed to cache content:", cacheError);
    // Non-fatal, continue returning content
  }

  return {
    success: true,
    sourceType: "text_pdf",
    contentMarkdown: cleanedText,
    needsDocumentFallback: false,
  };
}
