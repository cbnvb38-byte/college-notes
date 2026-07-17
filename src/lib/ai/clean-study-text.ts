export function cleanStudyText(rawText: string, maxLength: number = 30000): string {
  if (!rawText) return "";

  // 1. Remove carriage returns
  let cleaned = rawText.replace(/\r/g, "");

  // 2. Collapse excessive newlines (3 or more newlines become exactly 2 newlines,
  //    which preserves paragraph breaks and list structures but prevents massive empty gaps)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // 3. Collapse excessive horizontal whitespace (tabs or 2+ spaces become 1 space)
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

  // 4. Trim leading and trailing whitespace
  cleaned = cleaned.trim();

  // 5. Slice to safe maximum length to prevent token overflow in Gemini
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}
