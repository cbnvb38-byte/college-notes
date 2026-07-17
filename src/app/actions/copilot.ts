"use server";

import { auth } from "@clerk/nextjs/server";
import { GenerationType } from "@/lib/ai/types";
import { createClient } from "@supabase/supabase-js";
import { extractTextFromPDF } from "@/lib/pdf/extract-text";
import { GoogleGenAI } from "@google/genai";

const isDev = process.env.NODE_ENV === "development";

function devLog(...args: unknown[]) {
  if (isDev) {
    console.log("[Study Copilot]", ...args);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function generateStudyMaterialAction(
  noteId: string,
  generationType: GenerationType,
  question?: string
) {
  try {
    // 1. Validate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: { message: "Unauthorized." } };
    }

    if (!noteId) {
      return { success: false, error: { message: "Note ID is required." } };
    }

    if (generationType !== "summary") {
      return {
        success: false,
        error: { message: "This tool will be enabled in a later Phase 8 step." },
      };
    }

    // 2. Validate note & check approval
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, title, status, file_path")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      return { success: false, error: { message: "Note not found." } };
    }

    devLog("------- Smart Summary Start -------");
    devLog("noteId:", noteId);
    devLog("title:", note.title ?? "(no title)");
    devLog("status:", note.status);
    devLog("file_path:", note.file_path ?? "MISSING");

    if (note.status !== "approved") {
      return { success: false, error: { message: "Only approved notes can be analyzed." } };
    }

    if (!note.file_path) {
      devLog("file_path is missing → aborting");
      return { success: false, error: { message: "PDF file path is missing for this note." } };
    }

    // 3. Cache Check & Text Extraction
    let extractedText = "";

    const { data: cacheData } = await supabase
      .from("note_text_cache")
      .select("extracted_text")
      .eq("note_id", noteId)
      .single();

    const cacheExists = !!cacheData;
    const cacheLength = cacheData?.extracted_text?.length ?? 0;
    devLog("Cache exists:", cacheExists);
    devLog("Cached text length:", cacheLength);

    // Use cache only if it has meaningful text (>= 100 chars).
    // Otherwise (missing cache, NULL value, or too short), re-extract from PDF.
    if (cacheExists && cacheData.extracted_text && cacheLength >= 100) {
      devLog("Using cached text.");
      extractedText = cacheData.extracted_text;
    } else {
      if (cacheExists && cacheLength < 100) {
        devLog("Cache exists but text is too short — ignoring bad cache, re-extracting from PDF.");
      } else {
        devLog("No cache found — extracting from PDF.");
      }

      try {
        const extracted = await extractTextFromPDF(note.file_path);
        extractedText = extracted.text;
        devLog("Fresh extraction buffer size:", extracted.bufferSize, "bytes");
        devLog("Fresh extraction first bytes:", JSON.stringify(extracted.firstBytes));
        devLog("Fresh extracted text length:", extractedText.length);

        // Upsert to cache (overwrite bad short cache)
        await supabase.from("note_text_cache").upsert({
          note_id: noteId,
          extracted_text: extractedText,
        });
        devLog("Text cached (upserted).");
      } catch (extError: any) {
        devLog("Extraction failed:", extError.message);
        return { success: false, error: { message: extError.message } };
      }
    }

    // Final guard — do not call Gemini on insufficient text
    if (!extractedText || extractedText.length < 100) {
      return {
        success: false,
        error: {
          message:
            "This PDF appears to be scanned or does not contain enough selectable text for Smart Summary.",
        },
      };
    }

    // 4. Gemini Configuration & Invocation
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: {
          message:
            "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local and restart the dev server.",
        },
      };
    }

    devLog("Calling Gemini...");
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt = `You are an expert AI Study Assistant.
Your task is to create a clean, comprehensive study summary of the provided text.
Use ONLY the information in the provided text. Do not add outside facts.

Format your response in Markdown with the following specific sections exactly:
## Quick Summary
## Detailed Summary
## Key Concepts
## Important Exam Points
## Revision Tip

Provided Text:
"""
${extractedText.substring(0, 30000)}
"""`;

    let resultText = "";
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      resultText = response.text || "";
      if (!resultText) {
        devLog("Gemini returned empty response.");
        return { success: false, error: { message: "Gemini returned an empty response." } };
      }
      devLog("Gemini response received, length:", resultText.length);
    } catch (genError: any) {
      console.error("[Study Copilot] Gemini API Error:", genError);

      if (
        genError.status === 429 ||
        genError.message?.includes("429") ||
        genError.message?.includes("quota")
      ) {
        return {
          success: false,
          error: { message: "Gemini free quota reached. Please wait and try again later." },
        };
      }

      return {
        success: false,
        error: { message: "Failed to generate summary from AI provider." },
      };
    }

    // 5. Database Save
    const { data: genRow, error: genError } = await supabase
      .from("ai_generations")
      .insert({
        user_id: userId,
        note_id: noteId,
        generation_type: "summary",
        status: "completed",
        result_text: resultText,
      })
      .select("id")
      .single();

    if (genError) {
      console.error("[Study Copilot] DB Save Error:", genError);
      return { success: false, error: { message: "Failed to save generation result." } };
    }

    devLog("ai_generations row inserted:", genRow.id);

    // 6. Increment Usage (only after successful Gemini + DB save)
    const monthKey = new Date().toISOString().slice(0, 7) + "-01"; // e.g. "2026-07-01"

    const { data: usageData } = await supabase
      .from("ai_usage")
      .select("id, generations_count")
      .eq("user_id", userId)
      .eq("month", monthKey)
      .single();

    if (usageData) {
      await supabase
        .from("ai_usage")
        .update({ generations_count: usageData.generations_count + 1 })
        .eq("id", usageData.id);
    } else {
      await supabase.from("ai_usage").insert({
        user_id: userId,
        month: monthKey,
        generations_count: 1,
      });
    }

    devLog("ai_usage incremented for month:", monthKey);
    devLog("------- Smart Summary End -------");

    return {
      success: true,
      data: {
        id: genRow.id,
        resultText,
      },
      message: "Saved to Study Copilot history",
    };
  } catch (error: any) {
    console.error("[Study Copilot] Unexpected Error:", error);
    return { success: false, error: { message: "An unexpected error occurred." } };
  }
}
