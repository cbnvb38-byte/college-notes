"use server";

import { auth } from "@clerk/nextjs/server";
import { GenerationType } from "@/lib/ai/types";
import { createClient } from "@supabase/supabase-js";
import { getStudyContentForNote } from "@/lib/ai/document-content";
import { GoogleGenAI } from "@google/genai";
import { parseMCQResult, parseFlashcardsResult, parseImportantQuestionsResult, parseDoubtAnswerResult } from "@/lib/ai/result-formatting";

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

    if (generationType !== "summary" && generationType !== "mcq" && generationType !== "flashcards" && generationType !== "important_questions" && generationType !== "doubt_answer") {
      return {
        success: false,
        error: { message: "This tool will be enabled in a later Phase 8 step." },
      };
    }

    if (generationType === "doubt_answer" && (!question || !question.trim())) {
      return { success: false, error: { message: "A question is required for Ask Doubt." } };
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

    let prompt = "";

    if (generationType === "summary") {
      prompt = `You are an expert AI Study Assistant.
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
    } else if (generationType === "mcq") {
      prompt = `You are an expert AI Study Assistant.
Your task is to generate 10 high-quality multiple choice questions (MCQs) from the provided text.
Use ONLY the information in the provided text. Do not add outside facts.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add explanation outside JSON.
Generate exactly 10 MCQs unless content is too short.
Include mathematical expressions using LaTeX syntax (use $...$ for inline).
Keep LaTeX valid. Escape LaTeX backslashes correctly for JSON strings (e.g., use \\\\frac instead of \\frac).
Do not output raw markdown code fences.
Do not output prose before or after JSON.

Required format:
{
"questions": [
{
"question": "Question text. Use $...$ for inline math.",
"options": ["Option A", "Option B", "Option C", "Option D"],
"answer": "Correct option text",
"explanation": "Why this answer is correct.",
"difficulty": "easy|medium|hard",
"topic": "Topic name"
}
]
}

Provided Text:
"""
${extractedText}
"""`;
    } else if (generationType === "flashcards") {
      prompt = `You are an expert AI Study Assistant.
Your task is to create quick revision flashcards from the provided text.
Use ONLY the information in the provided text. Do not add outside facts.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add explanation outside JSON.
Generate up to 15 flashcards if the content allows.
Keep the front side short and clear. The back side should be exam-useful but not too long.
Include mathematical expressions using LaTeX syntax (use $...$ for inline).
Keep LaTeX valid. Escape LaTeX backslashes correctly for JSON strings (e.g., use \\\\frac instead of \\frac).
Do not output raw markdown code fences.
Do not output prose before or after JSON.

Required format:
{
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or explanation",
      "topic": "Topic name",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Provided Text:
"""
${extractedText}
"""`;
    } else if (generationType === "important_questions") {
      prompt = `You are an expert AI Study Assistant.
Your task is to generate exam-focused important questions from the provided text.
Use ONLY the information in the provided text. Do not add outside facts.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add prose outside JSON.
Use only the uploaded note/PDF content.
Do not hallucinate outside topics.
Generate around:
  - 5 very short answer questions
  - 7 short answer questions
  - 5 long answer/derivation/concept questions
If content is small, generate fewer but keep quality high.
Prefer exam-focused questions.
Include formulas in LaTeX where needed.
Include answer_hint, not full long answer.
Include why_important for each question.
Make questions useful for university exam preparation.

Required JSON format:
{
  "sections": [
    {
      "title": "Very Short Answer Questions",
      "questions": [
        {
          "question": "Question text",
          "answer_hint": "Short hint or key point",
          "marks": 2,
          "topic": "Topic name",
          "difficulty": "easy|medium|hard",
          "why_important": "Why this is likely important for exams"
        }
      ]
    },
    {
      "title": "Short Answer Questions",
      "questions": [
        {
          "question": "Question text",
          "answer_hint": "Short hint or key point",
          "marks": 5,
          "topic": "Topic name",
          "difficulty": "easy|medium|hard",
          "why_important": "Why this is likely important for exams"
        }
      ]
    },
    {
      "title": "Long Answer / Derivation Questions",
      "questions": [
        {
          "question": "Question text",
          "answer_hint": "Short hint or key point",
          "marks": 10,
          "topic": "Topic name",
          "difficulty": "easy|medium|hard",
          "why_important": "Why this is likely important for exams"
        }
      ]
    }
  ]
}

Provided Text:
"""
${extractedText}
"""`;
    } else if (generationType === "doubt_answer") {
      prompt = `You are an expert AI Study Assistant.
Your task is to answer the user's doubt.
First, check if the exact answer is in the provided text.
If the answer is clearly present in the provided text:
- answer mainly from the provided text.
- explain clearly and exam-usefully.

If the answer is only partially present (e.g. mentions the topic but lacks details):
- first say: "The note mentions this topic but does not fully explain it."
- then provide a helpful standard academic explanation in general_explanation.

If the answer is not present at all:
- say: "This exact answer is not clearly available in the note."
- then, if it is a standard academic concept, still provide a general explanation in general_explanation.

Do not hallucinate that the provided text contains something it does not contain.

Explain like a helpful college tutor. Use simple but strong explanation.
Use headings and bullet points where useful. Use LaTeX for formulas where needed.
Make the answer exam-useful and include related concepts from the note.
Include confidence (high, medium, low) based on how clearly the note supports the answer.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add prose outside JSON.

Required JSON format:
{
  "question": "${question?.replace(/"/g, '\\"')}",
  "note_based_answer": "What can be answered from the note/PDF. If missing, say it clearly.",
  "general_explanation": "Helpful standard academic explanation if the note is incomplete.",
  "simple_explanation": "Very simple explanation for quick understanding",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "related_topics": ["Topic 1", "Topic 2"],
  "exam_tip": "How to write this in exam or what to remember",
  "confidence": "high|medium|low",
  "source_status": "fully_answered_from_note|partially_available_in_note|not_available_in_note"
}

User's Doubt: "${question}"

Provided Text:
"""
${extractedText}
"""`;
    }

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

    const saveResponse = await saveAIGenerationResult({
      userId,
      noteId,
      generationType,
      rawOutput: resultText,
    });

    if (!saveResponse.success) {
      return saveResponse;
    }

    devLog("------- Smart Summary End -------");

    return {
      success: true,
      data: {
        id: saveResponse.data!.id,
        resultText: saveResponse.data!.resultText,
        resultJson: saveResponse.data!.resultJson,
      },
      message: generationType === "mcq" ? "Practice Quiz generated and saved to Study Copilot." : generationType === "flashcards" ? "Flashcards generated and saved to Study Copilot." : generationType === "important_questions" ? "Important Questions generated and saved to Study Copilot." : generationType === "doubt_answer" ? "Doubt Answer generated and saved to Study Copilot." : "Summary generated and saved to Study Copilot.",
      error: undefined,
    };
  } catch (error: any) {
    console.error("[Study Copilot] Unexpected Error:", error);
    return { success: false, error: { message: "An unexpected error occurred." } };
  }
}

export async function generateWithDocumentFallback(noteId: string, generationType: GenerationType, question?: string) {
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

    let prompt = "";

    if (generationType === "summary") {
      prompt = `You are Study Copilot. Read the uploaded PDF document. It may be scanned or image-based. Use document understanding/OCR to extract the readable study content. Create a Smart Summary using only the document content. Do not add outside facts.

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
    } else if (generationType === "mcq") {
      prompt = `You are Study Copilot. Read the uploaded PDF document. It may be scanned or image-based. Use document understanding/OCR to extract the readable study content.
Generate 10 high-quality multiple choice questions (MCQs) from the document content.
Use ONLY the information in the provided document. Do not add outside facts. If the document is unreadable, blurry, or does not contain enough study content, say clearly that the document could not be read.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add explanation outside JSON.
Generate exactly 10 MCQs unless content is too short.
Include mathematical expressions using LaTeX syntax (use $...$ for inline).
Keep LaTeX valid. Escape LaTeX backslashes correctly for JSON strings (e.g., use \\\\frac instead of \\frac).
Do not output raw markdown code fences.
Do not output prose before or after JSON.

Required format:
{
"questions": [
{
"question": "Question text. Use $...$ for inline math.",
"options": ["Option A", "Option B", "Option C", "Option D"],
"answer": "Correct option text",
"explanation": "Why this answer is correct.",
"difficulty": "easy|medium|hard",
"topic": "Topic name"
}
]
}`;
    } else if (generationType === "flashcards") {
      prompt = `You are Study Copilot. Read the uploaded PDF document. It may be scanned or image-based. Use document understanding/OCR to extract the readable study content.
Create quick revision flashcards from the document content.
Use ONLY the information in the provided document. Do not add outside facts. If the document is unreadable, blurry, or does not contain enough study content, say clearly that the document could not be read.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add explanation outside JSON.
Generate up to 15 flashcards if the content allows.
Keep the front side short and clear. The back side should be exam-useful but not too long.
Include mathematical expressions using LaTeX syntax (use $...$ for inline).
Keep LaTeX valid. Escape LaTeX backslashes correctly for JSON strings (e.g., use \\\\frac instead of \\frac).
Do not output raw markdown code fences.
Do not output prose before or after JSON.

Required format:
{
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or explanation",
      "topic": "Topic name",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;
    } else if (generationType === "important_questions") {
      prompt = `You are Study Copilot. Read the uploaded PDF document. It may be scanned or image-based. Use document understanding/OCR to extract the readable study content.
Generate exam-focused important questions from the document content.
Use ONLY the information in the provided document. Do not add outside facts. If the document is unreadable, blurry, or does not contain enough study content, say clearly that the document could not be read.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add prose outside JSON.
Generate around:
  - 5 very short answer questions
  - 7 short answer questions
  - 5 long answer/derivation/concept questions
If content is small, generate fewer but keep quality high.
Prefer exam-focused questions.
Include formulas in LaTeX where needed.
Include answer_hint, not full long answer.
Include why_important for each question.
Make questions useful for university exam preparation.

Required JSON format:
{
  "sections": [
    {
      "title": "Very Short Answer Questions",
      "questions": [
        {
          "question": "Question text",
          "answer_hint": "Short hint or key point",
          "marks": 2,
          "topic": "Topic name",
          "difficulty": "easy|medium|hard",
          "why_important": "Why this is likely important for exams"
        }
      ]
    },
    {
      "title": "Short Answer Questions",
      "questions": [
        {
          "question": "Question text",
          "answer_hint": "Short hint or key point",
          "marks": 5,
          "topic": "Topic name",
          "difficulty": "easy|medium|hard",
          "why_important": "Why this is likely important for exams"
        }
      ]
    },
    {
      "title": "Long Answer / Derivation Questions",
      "questions": [
        {
          "question": "Question text",
          "answer_hint": "Short hint or key point",
          "marks": 10,
          "topic": "Topic name",
          "difficulty": "easy|medium|hard",
          "why_important": "Why this is likely important for exams"
        }
      ]
    }
  ]
}`;
    } else if (generationType === "doubt_answer") {
      prompt = `You are Study Copilot. Read the uploaded PDF document. It may be scanned or image-based. Use document understanding/OCR to extract the readable study content.
Your task is to answer the user's doubt.
First, check if the exact answer is in the provided document.
If the answer is clearly present in the provided document:
- answer mainly from the provided document.
- explain clearly and exam-usefully.

If the answer is only partially present (e.g. mentions the topic but lacks details):
- first say: "The note mentions this topic but does not fully explain it."
- then provide a helpful standard academic explanation in general_explanation.

If the answer is not present at all:
- say: "This exact answer is not clearly available in the note."
- then, if it is a standard academic concept, still provide a general explanation in general_explanation.

Do not hallucinate that the provided document contains something it does not contain.

Explain like a helpful college tutor. Use simple but strong explanation.
Use headings and bullet points where useful. Use LaTeX for formulas where needed.
Make the answer exam-useful and include related concepts from the note.
Include confidence (high, medium, low) based on how clearly the note supports the answer.
If the document is unreadable, blurry, or does not contain enough study content, say clearly that the document could not be read.

Return ONLY valid JSON.
Do not wrap in markdown.
Do not add prose outside JSON.

Required JSON format:
{
  "question": "${question?.replace(/"/g, '\\"')}",
  "note_based_answer": "What can be answered from the note/PDF. If missing, say it clearly.",
  "general_explanation": "Helpful standard academic explanation if the note is incomplete.",
  "simple_explanation": "Very simple explanation for quick understanding",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "related_topics": ["Topic 1", "Topic 2"],
  "exam_tip": "How to write this in exam or what to remember",
  "confidence": "high|medium|low",
  "source_status": "fully_answered_from_note|partially_available_in_note|not_available_in_note"
}

User's Doubt: "${question}"`;
    }

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

    // Shared Save
    const saveResponse = await saveAIGenerationResult({
      userId,
      noteId,
      generationType,
      rawOutput: resultText,
    });

    if (!saveResponse.success) {
      return saveResponse;
    }

    devLog("------- Document Fallback Summary End -------");

    return {
      success: true,
      data: {
        id: saveResponse.data!.id,
        resultText: saveResponse.data!.resultText,
        resultJson: saveResponse.data!.resultJson,
      },
      message: generationType === "mcq" ? "Practice Quiz generated and saved to Study Copilot." : generationType === "flashcards" ? "Flashcards generated and saved to Study Copilot." : generationType === "important_questions" ? "Important Questions generated and saved to Study Copilot." : generationType === "doubt_answer" ? "Doubt Answer generated and saved to Study Copilot." : "Summary generated and saved to Study Copilot.",
      error: undefined,
    };
  } catch (error: any) {
    console.error("[Study Copilot] Fallback Error:", error);
    return { success: false, error: { message: "An unexpected error occurred during document reading." } };
  }
}

async function saveAIGenerationResult({
  userId,
  noteId,
  generationType,
  rawOutput,
}: {
  userId: string;
  noteId: string;
  generationType: GenerationType;
  rawOutput: string;
}) {
  let resultJson = null;
  let finalResultText: string | null = rawOutput.trim();

  if (!finalResultText) {
    return { success: false, error: { message: "Generation returned no readable result. Please try again." } };
  }

  if (generationType === "mcq") {
    const parsed = parseMCQResult(finalResultText, null);
    devLog("[MCQ Save] raw output length:", finalResultText?.length ?? 0);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      resultJson = { questions: parsed };
      finalResultText = null; // result_json is the source of truth; no need to duplicate
      devLog("[MCQ Save] parse succeeded, questions:", parsed.length);
    } else {
      // Parse failed — keep raw text so client-side tolerant parser can try
      devLog("[MCQ Save] MCQ JSON parse completely failed, storing raw fallback in result_text");
      resultJson = null;
    }
  } else if (generationType === "flashcards") {
    const parsed = parseFlashcardsResult(finalResultText, null);
    devLog("[Flashcards Save] raw output length:", finalResultText?.length ?? 0);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      resultJson = { flashcards: parsed };
      finalResultText = null;
      devLog("[Flashcards Save] parse succeeded, flashcards:", parsed.length);
    } else {
      devLog("[Flashcards Save] Flashcards JSON parse completely failed, storing raw fallback in result_text");
      resultJson = null;
    }
  } else if (generationType === "important_questions") {
    const parsed = parseImportantQuestionsResult(finalResultText, null);
    devLog("[Important Questions Save] raw output length:", finalResultText?.length ?? 0);
    if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
      resultJson = parsed;
      finalResultText = null;
      devLog("[Important Questions Save] parse succeeded, sections:", parsed.sections.length);
    } else {
      devLog("[Important Questions Save] JSON parse completely failed, storing raw fallback in result_text");
      resultJson = null;
    }
  } else if (generationType === "doubt_answer") {
    const parsed = parseDoubtAnswerResult(finalResultText, null);
    devLog("[Doubt Answer Save] raw output length:", finalResultText?.length ?? 0);
    if (parsed && parsed.answer) {
      resultJson = parsed;
      finalResultText = null;
      devLog("[Doubt Answer Save] parse succeeded");
    } else {
      devLog("[Doubt Answer Save] JSON parse completely failed, storing raw fallback in result_text");
      resultJson = null;
    }
  }

  if (!resultJson && !finalResultText) {
    return { success: false, error: { message: "Generation returned empty results. Please try again." } };
  }

  // 1. Database Save
  const { data: genRow, error: genError } = await supabase
    .from("ai_generations")
    .insert({
      user_id: userId,
      note_id: noteId,
      generation_type: generationType,
      status: "completed",
      result_text: finalResultText || null,
      result_json: resultJson,
    })
    .select("id")
    .single();

  if (genError) {
    console.error("[Study Copilot] DB Save Error:", genError);
    return { success: false, error: { message: "Failed to save generation result." } };
  }

  devLog("[Study Copilot Generate] generationType:", generationType, "noteId:", noteId, "generationId:", genRow.id, "hasResultJson:", !!resultJson, "hasResultText:", !!finalResultText, "questionCount:", resultJson && (resultJson as any).questions ? (resultJson as any).questions.length : "N/A");

  // 2. Increment Usage
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

  return {
    success: true,
    data: {
      id: genRow.id,
      resultText: finalResultText,
      resultJson
    },
    message: undefined
  };
}