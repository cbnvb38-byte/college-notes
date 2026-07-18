import { SavedGeneration } from "@/app/actions/copilot-history";

export interface ParsedSection {
  heading: string;
  content: string;
}

/**
 * Handle old saved rows that may have plain text only, result_text with JSON string,
 * or proper result_json.
 */
function safelyExtractText(resultText: string | null, resultJson: Record<string, unknown> | null): string {
  if (resultJson) {
    // If it's proper JSON, try to format it nicely
    try {
      return JSON.stringify(resultJson, null, 2);
    } catch {
      return "Invalid JSON result";
    }
  }

  if (!resultText) {
    return "";
  }

  // Check if resultText is secretly a JSON string
  if (resultText.trim().startsWith("{") && resultText.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(resultText);
      // It was JSON, but we are asked for text.
      // If it's a known format, we could parse it, otherwise stringify.
      // For now, if we can't extract meaningful text, just stringify.
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Not JSON, just normal text
      return resultText;
    }
  }

  return resultText;
}

export function parseSummarySections(resultText: string | null, resultJson: Record<string, unknown> | null): ParsedSection[] {
  const text = safelyExtractText(resultText, resultJson);

  if (!text) {
    return [{ heading: "Summary", content: "This saved result has no readable content." }];
  }

  // If the extracted text is JSON-like stringified (due to fallback), we'll just return it as a single section
  if (text.trim().startsWith("{") && text.trim().endsWith("}")) {
    return [{ heading: "Raw Data", content: text }];
  }

  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const headingRegex =
    /^(?:#{1,3}\s*|[*]{2})?(Quick Summary|Detailed Summary|Key Concepts|Important Exam Points|Revision Tip)[*]*:?\s*$/gim;

  const matches: { index: number; heading: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(normalised)) !== null) {
    matches.push({ index: m.index, heading: m[1] });
  }

  if (matches.length === 0) {
    return [{ heading: "Summary", content: normalised.trim() }];
  }

  const sections: ParsedSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].heading.length + (text[matches[i].index] === "#" ? 3 : 0);
    const end = i + 1 < matches.length ? matches[i + 1].index : normalised.length;
    const rawContent = normalised.slice(start, end).trim();
    sections.push({ heading: matches[i].heading, content: rawContent });
  }
  return sections;
}

export function getResultPreview(generation: SavedGeneration): string {
  if (generation.generation_type === "mcq") {
    const questions = parseMCQResult(generation.result_text, generation.result_json as Record<string, unknown> | null);
    if (questions && questions.length > 0) {
      const topics = Array.from(new Set(questions.map((q: any) => q.topic).filter(Boolean)));
      let topicStr = "";
      if (topics.length > 0) {
        topicStr = ` • ${topics.slice(0, 3).join(", ")}`;
      }
      return `${questions.length} questions generated${topicStr}`;
    }
  }

  if (generation.generation_type === "flashcards") {
    const cards = parseFlashcardsResult(generation.result_text, generation.result_json as Record<string, unknown> | null);
    if (cards && cards.length > 0) {
      const topics = Array.from(new Set(cards.map((c: any) => c.topic).filter(Boolean)));
      let topicStr = "";
      if (topics.length > 0) {
        topicStr = ` • ${topics.slice(0, 3).join(", ")}`;
      }
      return `${cards.length} flashcards generated${topicStr}`;
    }
  }

  const text = safelyExtractText(generation.result_text, generation.result_json as Record<string, unknown> | null);
  
  if (!text || (text.trim().startsWith("{") && text.trim().endsWith("}"))) {
    return "This saved result has no readable content.";
  }

  const preview = text
    .replace(/##\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 180);

  return preview || "No content.";
}

export function parseMCQResult(resultText: string | null, resultJson: Record<string, unknown> | null): any[] | null {
  let parsed: any = null;

  // 1. Check result_json
  if (resultJson) {
    if (resultJson.questions) parsed = resultJson;
    else if (resultJson.mcqs) parsed = { questions: resultJson.mcqs };
    else if (resultJson.quiz) parsed = { questions: resultJson.quiz };
    else if (resultJson.items) parsed = { questions: resultJson.items };
    else parsed = resultJson; // might be just array of questions? handled later
  }

  // 2. Check resultText
  if (!parsed && resultText) {
    let textToParse = resultText.trim();
    
    // Check for markdown code fences
    const jsonFenceMatch = /```json\s*([\s\S]*?)\s*```/i.exec(textToParse);
    if (jsonFenceMatch && jsonFenceMatch[1]) {
      textToParse = jsonFenceMatch[1].trim();
    } else if (textToParse.startsWith("{") && textToParse.endsWith("}")) {
      // It's just a JSON string
    } else {
      // Find the first { and last }
      const firstBrace = textToParse.indexOf("{");
      const lastBrace = textToParse.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        textToParse = textToParse.slice(firstBrace, lastBrace + 1);
      }
    }
    // Tolerant LaTeX repair: replace single unescaped backslashes with double backslashes
    textToParse = textToParse.replace(/(?<!\\)\\([a-zA-Z])/g, "\\\\$1");

    try {
      parsed = JSON.parse(textToParse);
      if (parsed.mcqs) parsed.questions = parsed.mcqs;
      else if (parsed.quiz) parsed.questions = parsed.quiz;
      else if (parsed.items) parsed.questions = parsed.items;
    } catch {
      // Parsing failed. Attempt regex extraction as a last resort.
      try {
        const questionsMatch = textToParse.match(/"questions"\s*:\s*(\[[^]*\])/i);
        if (questionsMatch && questionsMatch[1]) {
          parsed = { questions: JSON.parse(questionsMatch[1]) };
        }
      } catch {
        // completely failed
      }
    }
  }

  if (!parsed) return null;

  let rawQuestions: any[] = [];
  if (Array.isArray(parsed)) {
    rawQuestions = parsed;
  } else if (Array.isArray(parsed.questions)) {
    rawQuestions = parsed.questions;
  } else if (Array.isArray(parsed.mcqs)) {
    rawQuestions = parsed.mcqs;
  } else if (Array.isArray(parsed.quiz)) {
    rawQuestions = parsed.quiz;
  } else if (Array.isArray(parsed.items)) {
    rawQuestions = parsed.items;
  } else {
    return null;
  }

  // Normalize each question
  return rawQuestions.map((q: any) => {
    const optionsRaw = q.options || q.choices || [];
    let options: string[] = [];
    
    if (Array.isArray(optionsRaw)) {
      options = optionsRaw.map(String);
    } else if (typeof optionsRaw === "object" && optionsRaw !== null) {
      options = Object.values(optionsRaw).map(String);
    }

    let answer = String(q.answer || q.correctAnswer || q.correct_answer || "");
    
    // If answer is just a letter like "A" or "B" and options exists
    if (/^[A-Z]$/i.test(answer) && options.length > 0) {
      const idx = answer.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) {
        answer = `${answer.toUpperCase()}. ${options[idx]}`;
      }
    }

    return {
      question: String(q.question || ""),
      options,
      answer,
      explanation: String(q.explanation || ""),
      difficulty: q.difficulty || "medium",
      topic: q.topic || "",
    };
  });
}

export function parseFlashcardsResult(resultText: string | null, resultJson: Record<string, unknown> | null): any[] | null {
  let parsed: any = null;

  if (resultJson) {
    if (resultJson.flashcards) parsed = resultJson;
    else if (resultJson.cards) parsed = { flashcards: resultJson.cards };
    else if (resultJson.items) parsed = { flashcards: resultJson.items };
    else parsed = resultJson;
  }

  if (!parsed && resultText) {
    let textToParse = resultText.trim();
    
    const jsonFenceMatch = /```json\s*([\s\S]*?)\s*```/i.exec(textToParse);
    if (jsonFenceMatch && jsonFenceMatch[1]) {
      textToParse = jsonFenceMatch[1].trim();
    } else if (textToParse.startsWith("{") && textToParse.endsWith("}")) {
      // It's a JSON string
    } else {
      const firstBrace = textToParse.indexOf("{");
      const lastBrace = textToParse.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        textToParse = textToParse.slice(firstBrace, lastBrace + 1);
      }
    }
    
    textToParse = textToParse.replace(/(?<!\\)\\([a-zA-Z])/g, "\\\\$1");

    try {
      parsed = JSON.parse(textToParse);
      if (parsed.cards) parsed.flashcards = parsed.cards;
      else if (parsed.items) parsed.flashcards = parsed.items;
    } catch {
      try {
        const cardsMatch = textToParse.match(/"flashcards"\s*:\s*(\[[^]*\])/i);
        if (cardsMatch && cardsMatch[1]) {
          parsed = { flashcards: JSON.parse(cardsMatch[1]) };
        }
      } catch {
        // failed
      }
    }
  }

  if (!parsed) return null;

  let rawCards: any[] = [];
  if (Array.isArray(parsed)) {
    rawCards = parsed;
  } else if (Array.isArray(parsed.flashcards)) {
    rawCards = parsed.flashcards;
  } else if (Array.isArray(parsed.cards)) {
    rawCards = parsed.cards;
  } else if (Array.isArray(parsed.items)) {
    rawCards = parsed.items;
  } else {
    return null;
  }

  return rawCards.map((c: any) => ({
    front: String(c.front || c.question || c.term || ""),
    back: String(c.back || c.answer || c.definition || ""),
    topic: c.topic || "",
    difficulty: c.difficulty || "medium",
  }));
}

export function getCopyableResultText(generation: SavedGeneration): string {
  const lines: string[] = [];
  const typeLabel = getGenerationTypeLabel(generation.generation_type);
  
  if (generation.note_title) {
    lines.push(`${typeLabel} — ${generation.note_title}`);
    lines.push("=".repeat(60));
    lines.push("");
  }

  if (generation.generation_type === "mcq") {
    const questions = parseMCQResult(generation.result_text, generation.result_json as Record<string, unknown> | null);
    if (questions && questions.length > 0) {
      questions.forEach((q: any, i: number) => {
        lines.push(`Q${i + 1}. ${q.question}`);
        const labels = ["A", "B", "C", "D", "E", "F"];
        (q.options || []).forEach((opt: string, optIdx: number) => {
          lines.push(`${labels[optIdx] || "-"}. ${opt}`);
        });
        lines.push(`Answer: ${q.answer}`);
        lines.push(`Explanation: ${q.explanation}`);
        lines.push("");
      });
      return lines.join("\n").trim();
    }
  }

  if (generation.generation_type === "flashcards") {
    const cards = parseFlashcardsResult(generation.result_text, generation.result_json as Record<string, unknown> | null);
    if (cards && cards.length > 0) {
      cards.forEach((c: any, i: number) => {
        lines.push(`${i + 1}. Front: ${c.front}`);
        lines.push(`   Back: ${c.back}`);
        lines.push("");
      });
      return lines.join("\n").trim();
    }
  }

  const text = safelyExtractText(generation.result_text, generation.result_json as Record<string, unknown> | null);
  if (!text || (text.trim().startsWith("{") && text.trim().endsWith("}"))) {
    return "This saved result has no readable content.";
  }

  const sections = parseSummarySections(generation.result_text, generation.result_json as Record<string, unknown> | null);
  
  for (const s of sections) {
    lines.push(s.heading.toUpperCase());
    lines.push(s.content);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function getGenerationTypeLabel(type: string): string {
  if (type === "summary") return "Smart Summary";
  if (type === "mcq") return "Practice Quiz";
  if (type === "flashcards") return "Flashcards";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
