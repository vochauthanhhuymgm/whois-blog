import slugify from "slugify";

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export async function generateUniqueSlug(
  baseText: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = generateSlug(baseText);
  let slug = baseSlug;
  let counter = 2;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
