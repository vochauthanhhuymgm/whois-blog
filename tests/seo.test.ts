import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateMetadata } from "@/app/post/[slug]/page";

describe("SEO Metadata Generation", () => {
  let adminId: string;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();

    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: { email: "admin@example.com", role: "ADMIN" },
      });
    }
    adminId = admin.id;
  });

  it("uses custom SEO fields (metaTitle, metaDescription, ogImage) when provided", async () => {
    await prisma.post.create({
      data: {
        title: "Default Post Title",
        slug: "seo-custom-test",
        excerpt: "Default excerpt here",
        content: "<p>Content</p>",
        coverImage: "https://example.com/cover.jpg",
        status: "PUBLISHED",
        metaTitle: "Custom Meta Title For SEO",
        metaDescription: "Custom Meta Description For Google Search Snippets",
        ogImage: "https://example.com/custom-og.jpg",
        authorId: adminId,
      },
    });

    const metadata = await generateMetadata({ params: { slug: "seo-custom-test" } });

    expect(metadata.title).toBe("Custom Meta Title For SEO | whois-blog");
    expect(metadata.description).toBe("Custom Meta Description For Google Search Snippets");
    expect(metadata.openGraph?.title).toBe("Custom Meta Title For SEO");
    expect(metadata.openGraph?.description).toBe("Custom Meta Description For Google Search Snippets");
    expect(metadata.openGraph?.type).toBe("article");
    expect(metadata.openGraph?.url).toBe("/post/seo-custom-test");
    expect(metadata.openGraph?.images).toEqual([{ url: "https://example.com/custom-og.jpg" }]);
  });

  it("falls back to title, excerpt, and coverImage when SEO fields are empty", async () => {
    await prisma.post.create({
      data: {
        title: "Standard Post Title",
        slug: "seo-fallback-test",
        excerpt: "This is a fallback excerpt for post summary.",
        content: "<p>Content</p>",
        coverImage: "https://example.com/standard-cover.jpg",
        status: "PUBLISHED",
        authorId: adminId,
      },
    });

    const metadata = await generateMetadata({ params: { slug: "seo-fallback-test" } });

    expect(metadata.title).toBe("Standard Post Title | whois-blog");
    expect(metadata.description).toBe("This is a fallback excerpt for post summary.");
    expect(metadata.openGraph?.title).toBe("Standard Post Title");
    expect(metadata.openGraph?.description).toBe("This is a fallback excerpt for post summary.");
    expect(metadata.openGraph?.type).toBe("article");
    expect(metadata.openGraph?.url).toBe("/post/seo-fallback-test");
    expect(metadata.openGraph?.images).toEqual([{ url: "https://example.com/standard-cover.jpg" }]);
  });
});
