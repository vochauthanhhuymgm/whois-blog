import { describe, it, expect } from "vitest";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

describe("Slug generator", () => {
  it("generates a clean URL slug from a title/name", () => {
    expect(generateSlug("Hello World!")).toBe("hello-world");
    expect(generateSlug("Technical Posts & Guides")).toBe("technical-posts-and-guides");
  });

  it("handles slug collisions by appending numbers", async () => {
    const existing = new Set(["tech", "tech-2", "tech-3"]);
    const isTaken = async (slug: string) => existing.has(slug);

    const slug = await generateUniqueSlug("Tech", isTaken);
    expect(slug).toBe("tech-4");
  });
});
