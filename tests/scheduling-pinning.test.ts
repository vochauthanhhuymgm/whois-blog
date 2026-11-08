import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as createPost } from "@/app/api/posts/route";
import { PUT as updatePost } from "@/app/api/posts/[id]/route";
import { GET as getPublicPosts } from "@/app/api/public/posts/route";
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

describe("Post Scheduling & Pinning API", () => {
  let adminId: string;

  beforeEach(async () => {
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: { email: "admin@example.com", role: "ADMIN" },
      });
    }
    adminId = admin.id;
    mockSession = {
      user: { id: adminId, email: admin.email, role: "ADMIN" },
    };

    await prisma.post.deleteMany();
  });

  it("rejects saving post as SCHEDULED if scheduledAt is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: "Missing Date Schedule",
        status: "SCHEDULED",
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("scheduledAt is required");
  });

  it("rejects saving post as SCHEDULED if scheduledAt is in the past", async () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hr ago
    const req = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: "Past Date Schedule",
        status: "SCHEDULED",
        scheduledAt: pastDate,
      }),
    });

    const res = await createPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("future date/time");
  });

  it("excludes future scheduled posts from public posts list", async () => {
    const futureDate = new Date(Date.now() + 86400000); // 1 day in future
    await prisma.post.create({
      data: {
        title: "Tomorrow Article",
        slug: "tomorrow-article",
        status: "SCHEDULED",
        scheduledAt: futureDate,
        authorId: adminId,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/public/posts");
    const res = await getPublicPosts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts.length).toBe(0);
  });

  it("includes scheduled posts with past scheduledAt in public posts list", async () => {
    const pastDate = new Date(Date.now() - 3600000); // 1 hr in past
    await prisma.post.create({
      data: {
        title: "Already Arrived Article",
        slug: "already-arrived",
        status: "SCHEDULED",
        scheduledAt: pastDate,
        authorId: adminId,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/public/posts");
    const res = await getPublicPosts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts.length).toBe(1);
    expect(data.posts[0].title).toBe("Already Arrived Article");
  });

  it("orders pinned posts before newer non-pinned posts", async () => {
    // Newer post without pin
    await prisma.post.create({
      data: {
        title: "Newer Regular Post",
        slug: "newer-post",
        status: "PUBLISHED",
        isPinned: false,
        publishedAt: new Date(Date.now() - 1000),
        authorId: adminId,
      },
    });

    // Older post with pin
    const pinnedPost = await prisma.post.create({
      data: {
        title: "Older Pinned Post",
        slug: "older-pinned",
        status: "PUBLISHED",
        isPinned: true,
        publishedAt: new Date(Date.now() - 100000),
        authorId: adminId,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/public/posts");
    const res = await getPublicPosts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts.length).toBe(2);
    expect(data.posts[0].title).toBe("Older Pinned Post");
    expect(data.posts[1].title).toBe("Newer Regular Post");

    // Now unpin the post via PUT endpoint
    const unpinReq = new NextRequest(`http://localhost:3000/api/posts/${pinnedPost.id}`, {
      method: "PUT",
      body: JSON.stringify({ isPinned: false }),
    });
    const unpinRes = await updatePost(unpinReq, { params: { id: pinnedPost.id } });
    expect(unpinRes.status).toBe(200);

    // Verify chronological order restored
    const recheckRes = await getPublicPosts(new NextRequest("http://localhost:3000/api/public/posts"));
    const recheckData = await recheckRes.json();
    expect(recheckData.posts[0].title).toBe("Newer Regular Post");
    expect(recheckData.posts[1].title).toBe("Older Pinned Post");
  });
});
