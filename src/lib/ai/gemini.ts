import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

// Initialize the Google Gen AI SDK only if the API key is present
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Helper to check if AI is configured and ready to use
 */
export function isAIConfigured() {
  return !!ai;
}

export type GenerationType = 
  | 'summary' 
  | 'mcq' 
  | 'flashcards' 
  | 'important_questions' 
  | 'short_notes' 
  | 'revision_plan' 
  | 'doubt_answer' 
  | 'key_concepts' 
  | 'weak_topic_practice';

/**
 * Returns a system instruction / prompt template tailored for the requested generation type.
 * All prompts strictly enforce source-grounded answering.
 */
export function getPromptForGenerationType(type: GenerationType, optionalQuestion?: string): string {
  const baseInstruction = `You are a helpful, premium AI study assistant. 
IMPORTANT RULE: You MUST answer using ONLY the provided note text. 
If the answer or information is not clearly available in the provided note text, you MUST reply with: "This is not clearly available in the uploaded note."
Do NOT invent facts. Keep your explanations student-friendly and use simple language.`;

  switch (type) {
    case "summary":
      return `${baseInstruction}
Generate a structured summary of the note text provided. 
Format your response in Markdown with:
1. A brief 'Overview' paragraph.
2. A '5-Bullet Quick Summary'.
3. A 'Key Terms' section listing important definitions found in the text.`;

    case "mcq":
      return `${baseInstruction}
Generate 5 high-quality Multiple Choice Questions (MCQs) based on the note text.
Return the result strictly as a JSON array of objects (no markdown blocks, just raw JSON) matching this exact format:
[
  {
    "question": "The question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "A short explanation of why this is correct based on the text."
  }
]`;

    case "flashcards":
      return `${baseInstruction}
Generate 5-10 study flashcards from the most important concepts in the note text.
Return the result strictly as a JSON array of objects matching this exact format:
[
  {
    "front": "Concept or Question",
    "back": "Detailed definition or Answer",
    "difficulty": "easy" // or "medium", "hard"
  }
]`;

    case "important_questions":
      return `${baseInstruction}
Generate important exam-style questions from the note text.
Format your response in Markdown with:
### Short Answer Questions
(List 3-5 short questions with brief hints on how to answer them from the text)
### Long Answer / Essay Questions
(List 2-3 detailed questions that require comprehensive answers based on the text)`;

    case "short_notes":
      return `${baseInstruction}
Create crisp, last-minute revision short notes from the provided text.
Use bullet points, bold text for key terms, and keep sentences very short and easy to skim.`;

    case "revision_plan":
      return `${baseInstruction}
Create a structured revision plan to master the content provided in the note text.
Format your response in Markdown with:
### 3-Day Crash Course
(Break down the topics into 3 days of study)
### 7-Day Mastery Plan
(Break down the topics into 7 days of paced study)`;

    case "key_concepts":
      return `${baseInstruction}
Extract the core key concepts from the note text.
Format your response in Markdown as a list. For each concept, provide the name in bold, followed by its formula (if any) and a clear definition.`;

    case "weak_topic_practice":
      return `${baseInstruction}
Identify 2-3 topics from the note text that are typically complex or confusing for students. 
Explain them in extremely simple terms, and then provide a small practice scenario or conceptual question to test understanding of each.`;

    case "doubt_answer":
      return `${baseInstruction}
The student has asked a specific doubt: "${optionalQuestion}"
Answer this doubt directly and simply, using ONLY the provided note text.
If the text does not contain the answer, say "This is not clearly available in the uploaded note."`;

    default:
      return baseInstruction;
  }
}

/**
 * Core function to generate content from Gemini
 */
export async function generateContent(noteText: string, type: GenerationType, optionalQuestion?: string) {
  if (!ai) {
    throw new Error("AI provider is not configured yet.");
  }

  const systemInstruction = getPromptForGenerationType(type, optionalQuestion);
  const prompt = `Here is the note text to analyze:\n\n${noteText}`;

  // Use JSON schema for formats that expect JSON
  const isJsonExpected = type === "mcq" || type === "flashcards";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: isJsonExpected ? "application/json" : "text/plain",
        temperature: 0.2, // Low temperature for factual grounding
      }
    });

    return {
      text: response.text,
      isJson: isJsonExpected
    };
  } catch (error: any) {
    console.error("[generateContent] Gemini API Error:", error);
    throw new Error(`Failed to generate study material: ${error.message}`);
  }
}
