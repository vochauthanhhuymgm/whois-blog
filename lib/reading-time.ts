export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  if (!content) return 1;
  const text = stripHtml(content);
  if (!text) return 1;

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) return 1;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
