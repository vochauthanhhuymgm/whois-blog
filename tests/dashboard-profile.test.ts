import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getStats } from "@/app/api/admin/stats/route";
import { GET as getProfile, PUT as updateProfile } from "@/app/api/admin/profile/route";
import { PUT as changePassword } from "@/app/api/admin/password/route";
import { GET as getAbout } from "@/app/api/public/about/route";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

let mockSession: any = null;

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => mockSession),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("Admin Dashboard, Profile & Password API", () => {
  let adminId: string;
  let guestId: string;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();

    const hashedPassword = await bcrypt.hash("adminpassword123", 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {
        name: "Admin User",
        role: "ADMIN",
        password: hashedPassword,
        bio: "Default bio for admin",
      },
      create: {
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
        password: hashedPassword,
        bio: "Default bio for admin",
      },
    });
    adminId = admin.id;

    const guest = await prisma.user.upsert({
      where: { email: "guest-test@example.com" },
      update: { role: "GUEST" },
      create: {
        name: "Guest User",
        email: "guest-test@example.com",
        role: "GUEST",
      },
    });
    guestId = guest.id;
  });

  it("get dashboard stats → returns correct counts for posts, comments, views", async () => {
    mockSession = {
      user: { id: adminId, role: "ADMIN", email: "admin@example.com" },
    };

    // Create 2 published posts with views
    const post1 = await prisma.post.create({
      data: {
        title: "Post 1",
        slug: "post-1",
        status: "PUBLISHED",
        viewCount: 42,
        authorId: adminId,
      },
    });

    const post2 = await prisma.post.create({
      data: {
        title: "Post 2",
        slug: "post-2",
        status: "PUBLISHED",
        viewCount: 18,
        authorId: adminId,
      },
    });

    // Create 1 draft post (should not count as published)
    await prisma.post.create({
      data: {
        title: "Post 3 Draft",
        slug: "post-3-draft",
        status: "DRAFT",
        viewCount: 5,
        authorId: adminId,
      },
    });

    // Create comments (2 approved, 1 pending)
    await prisma.comment.createMany({
      data: [
        { content: "Comment 1", status: "APPROVED", postId: post1.id, authorId: guestId },
        { content: "Comment 2", status: "APPROVED", postId: post2.id, authorId: guestId },
        { content: "Comment 3", status: "PENDING", postId: post1.id, authorId: guestId },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/admin/stats");
    const res = await getStats(req);
    expect(res.status).toBe(200);

    const stats = await res.json();
    expect(stats.totalPublishedPosts).toBe(2);
    expect(stats.totalApprovedComments).toBe(2);
    // Total views across all posts = 42 + 18 + 5 = 65
    expect(stats.totalViews).toBe(65);
  });

  it("update profile → verify name, bio, avatar persisted", async () => {
    mockSession = {
      user: { id: adminId, role: "ADMIN", email: "admin@example.com" },
    };

    const updateReq = new NextRequest("http://localhost:3000/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: "Updated Admin Name",
        bio: "Senior engineer and technical writer.",
        image: "https://example.com/avatar.jpg",
      }),
    });

    const updateRes = await updateProfile(updateReq);
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Updated Admin Name");
    expect(updated.bio).toBe("Senior engineer and technical writer.");
    expect(updated.image).toBe("https://example.com/avatar.jpg");

    // Verify in database
    const dbUser = await prisma.user.findUnique({ where: { id: adminId } });
    expect(dbUser?.name).toBe("Updated Admin Name");
    expect(dbUser?.bio).toBe("Senior engineer and technical writer.");
    expect(dbUser?.image).toBe("https://example.com/avatar.jpg");

    // Verify public about endpoint returns updated data
    const aboutReq = new NextRequest("http://localhost:3000/api/public/about");
    const aboutRes = await getAbout(aboutReq);
    expect(aboutRes.status).toBe(200);
    const aboutData = await aboutRes.json();
    expect(aboutData.name).toBe("Updated Admin Name");
    expect(aboutData.bio).toBe("Senior engineer and technical writer.");
  });

  it("change password with correct current password → success", async () => {
    mockSession = {
      user: { id: adminId, role: "ADMIN", email: "admin@example.com" },
    };

    const req = new NextRequest("http://localhost:3000/api/admin/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: "adminpassword123",
        newPassword: "newsecurepassword456",
        confirmPassword: "newsecurepassword456",
      }),
    });

    const res = await changePassword(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify new password hashes correctly
    const dbUser = await prisma.user.findUnique({ where: { id: adminId } });
    const isNewValid = await bcrypt.compare("newsecurepassword456", dbUser!.password!);
    expect(isNewValid).toBe(true);
  });

  it("change password with wrong current password → rejected", async () => {
    mockSession = {
      user: { id: adminId, role: "ADMIN", email: "admin@example.com" },
    };

    const req = new NextRequest("http://localhost:3000/api/admin/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: "wrongpassword!",
        newPassword: "newpassword789",
        confirmPassword: "newpassword789",
      }),
    });

    const res = await changePassword(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Incorrect current password");
  });

  it("unauthenticated / guest access to profile and password endpoints → rejected", async () => {
    // 1. Unauthenticated
    mockSession = null;

    const unauthProfileReq = new NextRequest("http://localhost:3000/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify({ name: "Hacker" }),
    });
    expect((await updateProfile(unauthProfileReq)).status).toBe(401);

    const unauthPasswordReq = new NextRequest("http://localhost:3000/api/admin/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: "foo", newPassword: "bar" }),
    });
    expect((await changePassword(unauthPasswordReq)).status).toBe(401);

    // 2. Guest user
    mockSession = {
      user: { id: guestId, role: "GUEST", email: "guest-test@example.com" },
    };

    const guestProfileReq = new NextRequest("http://localhost:3000/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify({ name: "Hacker" }),
    });
    expect((await updateProfile(guestProfileReq)).status).toBe(403);

    const guestPasswordReq = new NextRequest("http://localhost:3000/api/admin/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: "foo", newPassword: "bar" }),
    });
    expect((await changePassword(guestPasswordReq)).status).toBe(403);

    const guestStatsReq = new NextRequest("http://localhost:3000/api/admin/stats");
    expect((await getStats(guestStatsReq)).status).toBe(403);
  });
});
