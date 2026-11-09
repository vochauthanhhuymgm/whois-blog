import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getPosts, POST as createPost } from "@/app/api/posts/route";
import {
  GET as getPost,
  PUT as updatePost,
  DELETE as deletePost,
} from "@/app/api/posts/[id]/route";
import { NextRequest } from "next/server";

let mockSession: any = {
  user: { id: "admin-user", email: "admin@example.com", role: "ADMIN" },
};

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => mockSession),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("Post Editor & Management API", () => {
  let adminId: string;
  let testCategoryId: string;

  beforeEach(async () => {
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: "admin@example.com",
          role: "ADMIN",
        },
      });
    }
    adminId = admin.id;
    mockSession = {
      user: { id: adminId, email: admin.email, role: "ADMIN" },
    };

    await prisma.post.deleteMany();
    await prisma.category.deleteMany();

    const cat = await prisma.category.create({
      data: { name: "Engineering", slug: "engineering" },
    });
    testCategoryId = cat.id;
  });

  it("creates a draft post with auto-generated slug and reading time", async () => {
    const content = "<p>" + Array(400).fill("word").join(" ") + "</p>";
    const req = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: "Understanding Next.js 14 App Router",
        content,
        excerpt: "An architectural guide",
        status: "DRAFT",
        categoryId: testCategoryId,
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(201);
    const post = await res.json();
    expect(post.title).toBe("Understanding Next.js 14 App Router");
    expect(post.slug).toBe("understanding-nextjs-14-app-router");
    expect(post.status).toBe("DRAFT");
    expect(post.readingTime).toBe(2);
    expect(post.publishedAt).toBeNull();
  });

  it("creates and publishes a post with publishedAt set", async () => {
    const req = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: "Publish Right Away",
        content: "<p>Instant post content</p>",
        status: "PUBLISHED",
        categoryId: testCategoryId,
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(201);
    const post = await res.json();
    expect(post.status).toBe("PUBLISHED");
    expect(post.publishedAt).not.toBeNull();
  });

  it("edits post title and regenerates slug", async () => {
    const post = await prisma.post.create({
      data: {
        title: "Initial Title",
        slug: "initial-title",
        content: "<p>Original</p>",
        status: "DRAFT",
        authorId: adminId,
        categoryId: testCategoryId,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/posts/${post.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated Brand New Title",
      }),
    });

    const res = await updatePost(req, { params: { id: post.id } });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.title).toBe("Updated Brand New Title");
    expect(updated.slug).toBe("updated-brand-new-title");
  });

  async function putPost(id: string, body: Record<string, unknown>) {
    const req = new NextRequest(`http://localhost:3000/api/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return updatePost(req, { params: { id } });
  }

  it("keeps the slug of a published post when its title changes", async () => {
    const post = await prisma.post.create({
      data: {
        title: "Live Title",
        slug: "live-title",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: adminId,
      },
    });

    const res = await putPost(post.id, { title: "Renamed Live Title" });
    const updated = await res.json();
    expect(updated.title).toBe("Renamed Live Title");
    expect(updated.slug).toBe("live-title");
  });

  it("keeps the slug of a scheduled post that has gone live", async () => {
    const post = await prisma.post.create({
      data: {
        title: "Went Live",
        slug: "went-live",
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() - 60_000),
        authorId: adminId,
      },
    });

    // Editing a live scheduled post must not be rejected as "schedule in the past".
    const res = await putPost(post.id, { title: "Went Live Renamed" });
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe("went-live");
  });

  it("applies an explicit slug, normalised and made unique", async () => {
    await prisma.post.create({
      data: { title: "Taken", slug: "custom-url", authorId: adminId },
    });
    const post = await prisma.post.create({
      data: { title: "Mine", slug: "mine", status: "PUBLISHED", publishedAt: new Date(), authorId: adminId },
    });

    const res = await putPost(post.id, { slug: "Custom URL" });
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe("custom-url-2");

    // Re-sending the same requested slug is stable and does not bump the suffix.
    const again = await putPost(post.id, { slug: "custom-url" });
    expect((await again.json()).slug).toBe("custom-url-2");
  });

  it("rejects a slug with no letters or numbers", async () => {
    const post = await prisma.post.create({
      data: { title: "Slug Check", slug: "slug-check", authorId: adminId },
    });
    const res = await putPost(post.id, { slug: "!!!" });
    expect(res.status).toBe(400);
  });

  it("uses a requested slug when creating a post", async () => {
    const req = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: "Some Title", slug: "my-own-url" }),
    });
    const res = await createPost(req);
    expect(res.status).toBe(201);
    expect((await res.json()).slug).toBe("my-own-url");
  });

  it("deletes a post and verifies it is removed", async () => {
    const post = await prisma.post.create({
      data: {
        title: "Post to Delete",
        slug: "post-to-delete",
        content: "<p>Delete me</p>",
        status: "DRAFT",
        authorId: adminId,
        categoryId: testCategoryId,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/posts/${post.id}`, {
      method: "DELETE",
    });

    const res = await deletePost(req, { params: { id: post.id } });
    expect(res.status).toBe(200);

    const check = await prisma.post.findUnique({ where: { id: post.id } });
    expect(check).toBeNull();
  });

  it("filters posts by status", async () => {
    await prisma.post.create({
      data: {
        title: "Draft 1",
        slug: "draft-1",
        status: "DRAFT",
        authorId: adminId,
      },
    });
    await prisma.post.create({
      data: {
        title: "Published 1",
        slug: "published-1",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: adminId,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/posts?status=DRAFT");
    const res = await getPosts(req);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe("Draft 1");
  });

  it("filters posts by category", async () => {
    const otherCat = await prisma.category.create({
      data: { name: "Design", slug: "design" },
    });

    await prisma.post.create({
      data: {
        title: "Engineering Post",
        slug: "engineering-post",
        categoryId: testCategoryId,
        authorId: adminId,
      },
    });
    await prisma.post.create({
      data: {
        title: "Design Post",
        slug: "design-post",
        categoryId: otherCat.id,
        authorId: adminId,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/posts?categoryId=${otherCat.id}`);
    const res = await getPosts(req);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe("Design Post");
  });

  it("rejects unauthenticated and guest access to post admin endpoints", async () => {
    mockSession = null;
    const unauthReq = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: "Hack Title" }),
    });
    const unauthRes = await createPost(unauthReq);
    expect(unauthRes.status).toBe(401);

    mockSession = {
      user: { id: "guest", email: "guest@example.com", role: "GUEST" },
    };
    const guestReq = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: "Guest Title" }),
    });
    const guestRes = await createPost(guestReq);
    expect(guestRes.status).toBe(403);
  });
});
