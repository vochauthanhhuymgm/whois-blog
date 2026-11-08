import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getPublicPosts } from "@/app/api/public/posts/route";
import { GET as getPublicPostBySlug } from "@/app/api/public/posts/[slug]/route";
import { NextRequest } from "next/server";

describe("Public Blog Posts API", () => {
  let cat1Id: string;
  let adminId: string;

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

    const cat = await prisma.category.create({
      data: { name: "Science", slug: "science" },
    });
    cat1Id = cat.id;
  });

  it("returns only PUBLISHED posts and past-scheduled posts, never drafts or future-scheduled", async () => {
    // 1. Published post
    await prisma.post.create({
      data: {
        title: "Published Article",
        slug: "published-article",
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 10000),
        authorId: adminId,
        categoryId: cat1Id,
      },
    });

    // 2. Draft post
    await prisma.post.create({
      data: {
        title: "Draft Article",
        slug: "draft-article",
        status: "DRAFT",
        authorId: adminId,
        categoryId: cat1Id,
      },
    });

    // 3. Future scheduled post
    const futureDate = new Date(Date.now() + 86400000); // 1 day in future
    await prisma.post.create({
      data: {
        title: "Future Post",
        slug: "future-post",
        status: "SCHEDULED",
        scheduledAt: futureDate,
        authorId: adminId,
        categoryId: cat1Id,
      },
    });

    // 4. Past scheduled post (should be treated as published)
    const pastDate = new Date(Date.now() - 86400000); // 1 day in past
    await prisma.post.create({
      data: {
        title: "Past Scheduled Post",
        slug: "past-scheduled-post",
        status: "SCHEDULED",
        scheduledAt: pastDate,
        authorId: adminId,
        categoryId: cat1Id,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/public/posts");
    const res = await getPublicPosts(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.total).toBe(2);
    const titles = data.posts.map((p: any) => p.title);
    expect(titles).toContain("Published Article");
    expect(titles).toContain("Past Scheduled Post");
    expect(titles).not.toContain("Draft Article");
    expect(titles).not.toContain("Future Post");
  });

  it("returns full post data and related posts for a valid published slug", async () => {
    const mainPost = await prisma.post.create({
      data: {
        title: "Main Post",
        slug: "main-post",
        content: "<h2>Overview</h2><p>Full content text</p>",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: adminId,
        categoryId: cat1Id,
      },
    });

    const related = await prisma.post.create({
      data: {
        title: "Related Science Post",
        slug: "related-science-post",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: adminId,
        categoryId: cat1Id,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/public/posts/${mainPost.slug}`);
    const res = await getPublicPostBySlug(req, { params: { slug: mainPost.slug } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.post.title).toBe("Main Post");
    expect(data.post.content).toContain("Overview");
    expect(data.relatedPosts.length).toBe(1);
    expect(data.relatedPosts[0].id).toBe(related.id);
  });

  it("returns 404 for non-existent or unpublished slugs", async () => {
    // Draft post should return 404 on public endpoint
    await prisma.post.create({
      data: {
        title: "Secret Draft",
        slug: "secret-draft",
        status: "DRAFT",
        authorId: adminId,
      },
    });

    const reqDraft = new NextRequest("http://localhost:3000/api/public/posts/secret-draft");
    const resDraft = await getPublicPostBySlug(reqDraft, { params: { slug: "secret-draft" } });
    expect(resDraft.status).toBe(404);

    const reqNonExistent = new NextRequest("http://localhost:3000/api/public/posts/does-not-exist");
    const resNonExistent = await getPublicPostBySlug(reqNonExistent, { params: { slug: "does-not-exist" } });
    expect(resNonExistent.status).toBe(404);
  });
});
