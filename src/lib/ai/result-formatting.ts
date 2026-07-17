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
  const text = safelyExtractText(generation.result_text, generation.result_json);
  
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

export function getCopyableResultText(generation: SavedGeneration): string {
  const text = safelyExtractText(generation.result_text, generation.result_json);
  
  if (!text || (text.trim().startsWith("{") && text.trim().endsWith("}"))) {
    return "This saved result has no readable content.";
  }

  const sections = parseSummarySections(generation.result_text, generation.result_json);
  const lines: string[] = [];
  
  const typeLabel = getGenerationTypeLabel(generation.generation_type);
  if (generation.note_title) {
    lines.push(`${typeLabel} — ${generation.note_title}`);
    lines.push("=".repeat(60));
    lines.push("");
  }
  
  for (const s of sections) {
    lines.push(s.heading.toUpperCase());
    lines.push(s.content);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function getGenerationTypeLabel(type: string): string {
  if (type === "summary") return "Smart Summary";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
