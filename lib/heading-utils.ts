export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// h2/h3 are the only levels shown in the table of contents and given anchors.
const HEADING_REGEX = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
};

function headingText(innerHtml: string): string {
  return innerHtml
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|nbsp|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

// Built with the constructor: tsconfig has no `target`, so tsc rejects the `u` flag in literals.
const COMBINING_MARKS = new RegExp("\\p{M}+", "gu");
const NON_LETTER_OR_DIGIT = new RegExp("[^\\p{L}\\p{N}]+", "gu");

/**
 * Turns heading text into a URL-fragment-safe id.
 * Latin diacritics are folded ("Giới thiệu" -> "gioi-thieu"); other scripts are kept as-is.
 */
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(NON_LETTER_OR_DIGIT, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

/** Returns a function that hands out ids, suffixing repeats: intro, intro-1, intro-2. */
function createIdAllocator() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugifyHeading(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

/**
 * The post title is the page's only <h1>, so any h1 inside post content is rendered as h2.
 */
export function demoteH1(html: string): string {
  if (!html) return "";
  return html.replace(/<(\/?)h1(?=[\s>])/gi, "<$1h2");
}

export function extractHeadings(html: string): TocItem[] {
  if (!html) return [];
  const allocateId = createIdAllocator();
  const items: TocItem[] = [];

  demoteH1(html).replace(HEADING_REGEX, (fullMatch, level: string, _attrs, inner: string) => {
    const text = headingText(inner);
    if (text) items.push({ id: allocateId(text), text, level: parseInt(level, 10) });
    return fullMatch;
  });

  return items;
}

export function injectHeadingIds(html: string): string {
  if (!html) return "";
  const allocateId = createIdAllocator();

  return demoteH1(html).replace(HEADING_REGEX, (fullMatch, level, attrs: string, inner: string) => {
    const text = headingText(inner);
    if (!text) return fullMatch;
    const attrsWithoutId = attrs.replace(/\s+id\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, "");
    return `<h${level}${attrsWithoutId} id="${allocateId(text)}">${inner}</h${level}>`;
  });
}
