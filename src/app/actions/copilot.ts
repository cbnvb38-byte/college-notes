"use server";

import { auth } from "@clerk/nextjs/server";
import { GenerationType } from "@/lib/ai/types";
import { createClient } from "@supabase/supabase-js";
import { getStudyContentForNote } from "@/lib/ai/document-content";
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

    // 3. Reusable Text Extraction Pipeline
    const contentResult = await getStudyContentForNote(noteId, note.file_path);
    
    if (contentResult.needsDocumentFallback) {
      // Pass this directly to the frontend so it knows to show the fallback UI
      return {
        success: false,
        error: { message: contentResult.message, code: contentResult.code }
      };
    }
    
    const extractedText = contentResult.contentMarkdown;

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

Formatting Rules:
- Use Markdown headings.
- Use bullet points.
- Wrap inline math in $...$.
- Wrap display equations in $$...$$.
- Do not escape LaTeX unnecessarily.
- Do not output raw JSON unless structured JSON is requested.

Format your response in Markdown with the following specific sections exactly:
## Quick Summary
## Detailed Summary
## Key Concepts
## Important Exam Points
## Revision Tip

Provided Text:
"""
${extractedText}
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

    // 6. Increment Usage
    const monthKey = new Date().toISOString().slice(0, 7) + "-01";
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

    devLog("------- Smart Summary End -------");

    return {
      success: true,
      data: {
        id: genRow.id,
        resultText,
      },
      message: "Summary generated and saved to Study Copilot.",
    };
  } catch (error: any) {
    console.error("[Study Copilot] Unexpected Error:", error);
    return { success: false, error: { message: "An unexpected error occurred." } };
  }
}

export async function generateSummaryWithDocumentFallback(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: { message: "Unauthorized." } };
    }

    if (!noteId) {
      return { success: false, error: { message: "Note ID is required." } };
    }

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, title, status, file_path")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      return { success: false, error: { message: "Note not found." } };
    }

    if (note.status !== "approved") {
      return { success: false, error: { message: "Only approved notes can be analyzed." } };
    }

    if (!note.file_path) {
      return { success: false, error: { message: "PDF file path is missing for this note." } };
    }

    devLog("------- Document Fallback Summary Start -------");
    
    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("notes")
      .download(note.file_path);

    if (downloadError || !fileData) {
      devLog("Failed to download PDF for fallback:", downloadError);
      return { success: false, error: { message: "Failed to read the PDF document." } };
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: { message: "Gemini API key is not configured." },
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt = `You are Study Copilot. Read the uploaded PDF document. It may be scanned or image-based. Use document understanding/OCR to extract the readable study content. Create a Smart Summary using only the document content. Do not add outside facts.

Formatting Rules:
- Use Markdown headings.
- Use bullet points.
- Wrap inline math in $...$.
- Wrap display equations in $$...$$.
- Do not escape LaTeX unnecessarily.
- Do not output raw JSON unless structured JSON is requested.

Return these sections:
## Quick Summary
## Detailed Summary
## Key Concepts
## Important Exam Points
## Revision Tip

If the document is unreadable, blurry, or does not contain enough study content, say clearly that the document could not be read.`;

    devLog("Calling Gemini with PDF inlineData...");
    let resultText = "";
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          prompt
        ],
      });

      resultText = response.text || "";
      if (!resultText) {
        return { success: false, error: { message: "Gemini returned an empty response." } };
      }
      
      // If model returned the fallback string, throw our own error
      if (resultText.toLowerCase().includes("could not be read")) {
        return {
          success: false,
          error: { message: "This scanned PDF could not be read clearly. Please upload a clearer scan or a text-based PDF." }
        };
      }
      
    } catch (genError: any) {
      console.error("[Study Copilot] Gemini Fallback Error:", genError);
      return {
        success: false,
        error: { message: "Failed to generate summary from AI provider using document reading." },
      };
    }

    // Save success result
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
      return { success: false, error: { message: "Failed to save generation result." } };
    }

    // Increment Usage
    const monthKey = new Date().toISOString().slice(0, 7) + "-01";
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

    devLog("------- Document Fallback Summary End -------");

    return {
      success: true,
      data: {
        id: genRow.id,
        resultText,
      },
      message: "Summary generated and saved to Study Copilot.",
    };
  } catch (error: any) {
    console.error("[Study Copilot] Fallback Error:", error);
    return { success: false, error: { message: "An unexpected error occurred during document reading." } };
  }
}
