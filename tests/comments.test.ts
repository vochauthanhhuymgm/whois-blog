import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as createComment, GET as getComments } from "@/app/api/comments/route";
import { GET as getAdminComments } from "@/app/api/admin/comments/route";
import { PUT as approveComment } from "@/app/api/admin/comments/[id]/approve/route";
import { PUT as rejectComment } from "@/app/api/admin/comments/[id]/reject/route";
import { DELETE as deleteComment } from "@/app/api/admin/comments/[id]/route";
import { NextRequest } from "next/server";

let mockSession: any = null;

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => mockSession),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("Guest Comments and Moderation API", () => {
  let adminId: string;
  let guestId: string;
  let postId: string;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();

    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
        },
      });
    }
    adminId = admin.id;

    let guest = await prisma.user.findUnique({ where: { email: "guest@example.com" } });
    if (!guest) {
      guest = await prisma.user.create({
        data: {
          name: "Guest User",
          email: "guest@example.com",
          role: "GUEST",
          image: "https://example.com/guest.png",
        },
      });
    }
    guestId = guest.id;

    const post = await prisma.post.create({
      data: {
        title: "Test Post for Comments",
        slug: "test-post-for-comments",
        content: "<p>Hello world</p>",
        status: "PUBLISHED",
        authorId: adminId,
      },
    });
    postId = post.id;
  });

  it("unauthenticated comment submission is rejected with 401", async () => {
    mockSession = null;
    const req = new NextRequest("http://localhost:3000/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId, content: "Great post!" }),
    });

    const res = await createComment(req);
    expect(res.status).toBe(401);
  });

  it("comment on non-existent post is rejected with 404", async () => {
    mockSession = {
      user: { id: guestId, name: "Guest User", email: "guest@example.com", role: "GUEST" },
    };

    const req = new NextRequest("http://localhost:3000/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: "non-existent-id", content: "Great post!" }),
    });

    const res = await createComment(req);
    expect(res.status).toBe(404);
  });

  it("guest creates comment → saved as PENDING, not returned in public comment list", async () => {
    mockSession = {
      user: { id: guestId, name: "Guest User", email: "guest@example.com", role: "GUEST" },
    };

    const createReq = new NextRequest("http://localhost:3000/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId, content: "This is pending moderation." }),
    });

    const createRes = await createComment(createReq);
    expect(createRes.status).toBe(201);
    const createdData = await createRes.json();
    expect(createdData.status).toBe("PENDING");
    expect(createdData.content).toBe("This is pending moderation.");
    expect(createdData.author.name).toBe("Guest User");

    // Public GET comments
    const getReq = new NextRequest(`http://localhost:3000/api/comments?postId=${postId}`);
    const getRes = await getComments(getReq);
    expect(getRes.status).toBe(200);
    const comments = await getRes.json();
    expect(comments).toHaveLength(0);
  });

  it("admin approves comment → status changes to APPROVED, now returned in public list", async () => {
    // 1. Guest creates comment
    const comment = await prisma.comment.create({
      data: {
        content: "Awesome read!",
        status: "PENDING",
        postId,
        authorId: guestId,
      },
    });

    // 2. Admin approves comment
    mockSession = {
      user: { id: adminId, name: "Admin", email: "admin@example.com", role: "ADMIN" },
    };

    const approveReq = new NextRequest(`http://localhost:3000/api/admin/comments/${comment.id}/approve`, {
      method: "PUT",
    });
    const approveRes = await approveComment(approveReq, { params: { id: comment.id } });
    expect(approveRes.status).toBe(200);
    const approvedData = await approveRes.json();
    expect(approvedData.status).toBe("APPROVED");

    // 3. Public GET comments returns the approved comment
    const getReq = new NextRequest(`http://localhost:3000/api/comments?postId=${postId}`);
    const getRes = await getComments(getReq);
    expect(getRes.status).toBe(200);
    const comments = await getRes.json();
    expect(comments).toHaveLength(1);
    expect(comments[0].id).toBe(comment.id);
    expect(comments[0].author.name).toBe("Guest User");
  });

  it("admin rejects comment → status changes to REJECTED, not in public list", async () => {
    const comment = await prisma.comment.create({
      data: {
        content: "Spam comment!",
        status: "PENDING",
        postId,
        authorId: guestId,
      },
    });

    mockSession = {
      user: { id: adminId, name: "Admin", email: "admin@example.com", role: "ADMIN" },
    };

    const rejectReq = new NextRequest(`http://localhost:3000/api/admin/comments/${comment.id}/reject`, {
      method: "PUT",
    });
    const rejectRes = await rejectComment(rejectReq, { params: { id: comment.id } });
    expect(rejectRes.status).toBe(200);
    const rejectedData = await rejectRes.json();
    expect(rejectedData.status).toBe("REJECTED");

    // Public list should still be empty
    const getReq = new NextRequest(`http://localhost:3000/api/comments?postId=${postId}`);
    const getRes = await getComments(getReq);
    expect(getRes.status).toBe(200);
    const comments = await getRes.json();
    expect(comments).toHaveLength(0);
  });

  it("admin deletes comment → record removed", async () => {
    const comment = await prisma.comment.create({
      data: {
        content: "Delete me please",
        status: "APPROVED",
        postId,
        authorId: guestId,
      },
    });

    mockSession = {
      user: { id: adminId, name: "Admin", email: "admin@example.com", role: "ADMIN" },
    };

    const deleteReq = new NextRequest(`http://localhost:3000/api/admin/comments/${comment.id}`, {
      method: "DELETE",
    });
    const deleteRes = await deleteComment(deleteReq, { params: { id: comment.id } });
    expect(deleteRes.status).toBe(200);

    const check = await prisma.comment.findUnique({
      where: { id: comment.id },
    });
    expect(check).toBeNull();
  });

  it("admin can filter comments by status", async () => {
    await prisma.comment.createMany({
      data: [
        { content: "Pending comment", status: "PENDING", postId, authorId: guestId },
        { content: "Approved comment", status: "APPROVED", postId, authorId: guestId },
        { content: "Rejected comment", status: "REJECTED", postId, authorId: guestId },
      ],
    });

    mockSession = {
      user: { id: adminId, name: "Admin", email: "admin@example.com", role: "ADMIN" },
    };

    const pendingReq = new NextRequest("http://localhost:3000/api/admin/comments?status=PENDING");
    const pendingRes = await getAdminComments(pendingReq);
    const pendingList = await pendingRes.json();
    expect(pendingList).toHaveLength(1);
    expect(pendingList[0].status).toBe("PENDING");

    const allReq = new NextRequest("http://localhost:3000/api/admin/comments");
    const allRes = await getAdminComments(allReq);
    const allList = await allRes.json();
    expect(allList).toHaveLength(3);
  });
});
