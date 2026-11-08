export function injectHeadingIds(html: string): string {
  if (!html) return "";
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (_match, level, attrs, text) => {
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    const id = plainText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}
