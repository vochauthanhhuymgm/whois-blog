import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { htmlToText } from "@/lib/text-utils";
import { GET as searchPosts } from "@/app/api/search/route";
import { GET as getCategoryPosts } from "@/app/api/public/categories/[slug]/posts/route";
import { NextRequest } from "next/server";

describe("Search, Category & Archive", () => {
  let adminId: string;
  let testCategory: any;

  beforeEach(async () => {
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: { email: "admin@example.com", role: "ADMIN" },
      });
    }
    adminId = admin.id;

    await prisma.post.deleteMany();
    await prisma.category.deleteMany();

    testCategory = await prisma.category.create({
      data: {
        name: "Engineering",
        slug: "engineering",
        description: "Deep technical articles",
      },
    });
  });

  it("htmlToText utility strips HTML tags cleanly", () => {
    const html = "<h1>Title</h1><p>Paragraph with <b>bold</b> text.</p>";
    expect(htmlToText(html)).toBe("Title Paragraph with bold text.");
  });

  it("searches published posts by keyword matching title or content", async () => {
    await prisma.post.create({
      data: {
        title: "Docker Production Deployment",
        slug: "docker-prod",
        content: "<p>Learn how to deploy containers safely.</p>",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: adminId,
        categoryId: testCategory.id,
      },
    });

    await prisma.post.create({
      data: {
        title: "React Server Components",
        slug: "rsc-guide",
        content: "<p>All about streaming and SSR in Next.js.</p>",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: adminId,
        categoryId: testCategory.id,
      },
    });

    // Draft post should never appear in search
    await prisma.post.create({
      data: {
        title: "Secret Docker internals",
        slug: "secret-docker",
        content: "<p>Hidden draft about docker.</p>",
        status: "DRAFT",
        authorId: adminId,
        categoryId: testCategory.id,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/search?q=docker");
    const res = await searchPosts(req);
    expect(res.status).toBe(200);
    const results = await res.json();
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Docker Production Deployment");
  });

  it("returns empty array when search yields no matches", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=nonexistentkeyword");
    const res = await searchPosts(req);
    expect(res.status).toBe(200);
    const results = await res.json();
    expect(results).toEqual([]);
  });

  it("gets posts for a category slug", async () => {
    await prisma.post.create({
      data: {
        title: "Category Post 1",
        slug: "cat-post-1",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: adminId,
        categoryId: testCategory.id,
      },
    });

    const req = new NextRequest(
      `http://localhost:3000/api/public/categories/${testCategory.slug}/posts`
    );
    const res = await getCategoryPosts(req, {
      params: { slug: testCategory.slug },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.category.name).toBe("Engineering");
    expect(data.posts.length).toBe(1);
    expect(data.posts[0].title).toBe("Category Post 1");
  });

  it("returns 404 for non-existent category slug", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/public/categories/does-not-exist/posts"
    );
    const res = await getCategoryPosts(req, {
      params: { slug: "does-not-exist" },
    });
    expect(res.status).toBe(404);
  });
});
