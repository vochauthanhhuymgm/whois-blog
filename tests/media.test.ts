import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getMediaList, POST as uploadMedia } from "@/app/api/media/route";
import { DELETE as deleteMedia } from "@/app/api/media/[id]/route";
import { getStorage } from "@/lib/storage";
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

describe("Media Library & Storage API", () => {
  beforeEach(async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    mockSession = {
      user: {
        id: admin?.id || "admin-user",
        email: admin?.email || "admin@example.com",
        role: "ADMIN",
      },
    };
    await prisma.media.deleteMany();
  });

  it("uploads an image and creates a Media record accessible via URL", async () => {
    const fileContent = "fake-image-bytes";
    const file = new File([fileContent], "test-avatar.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    const req = new NextRequest("http://localhost:3000/api/media", {
      method: "POST",
      body: formData,
    });

    const res = await uploadMedia(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.fileName).toBe("test-avatar.png");
    expect(data.mimeType).toBe("image/png");
    expect(data.url).toBeDefined();

    // Verify database record
    const record = await prisma.media.findUnique({ where: { id: data.id } });
    expect(record).not.toBeNull();
    expect(record?.key).toBe(data.key);

    // Verify storage has the file
    const storage = getStorage();
    expect(storage.getUrl(data.key)).toBe(data.url);
  });

  it("lists all uploaded media files", async () => {
    await prisma.media.create({
      data: {
        fileName: "image1.jpg",
        key: "key-1",
        url: "http://localhost:3000/image1.jpg",
        mimeType: "image/jpeg",
        size: 1024,
      },
    });
    await prisma.media.create({
      data: {
        fileName: "image2.png",
        key: "key-2",
        url: "http://localhost:3000/image2.png",
        mimeType: "image/png",
        size: 2048,
      },
    });

    const res = await getMediaList();
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.length).toBe(2);
    expect(list.map((m: any) => m.fileName)).toContain("image1.jpg");
    expect(list.map((m: any) => m.fileName)).toContain("image2.png");
  });

  it("deletes media record and removes it from storage", async () => {
    const media = await prisma.media.create({
      data: {
        fileName: "to-delete.png",
        key: "delete-key",
        url: "http://localhost:3000/to-delete.png",
        mimeType: "image/png",
        size: 512,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/media/${media.id}`, {
      method: "DELETE",
    });

    const res = await deleteMedia(req, { params: { id: media.id } });
    expect(res.status).toBe(200);

    const check = await prisma.media.findUnique({ where: { id: media.id } });
    expect(check).toBeNull();
  });

  it("rejects unauthenticated upload attempts with 401", async () => {
    mockSession = null;

    const file = new File(["bytes"], "unauth.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    const req = new NextRequest("http://localhost:3000/api/media", {
      method: "POST",
      body: formData,
    });

    const res = await uploadMedia(req);
    expect(res.status).toBe(401);
  });

  it("rejects guest-role upload attempts with 403", async () => {
    mockSession = {
      user: { id: "guest-user", email: "guest@example.com", role: "GUEST" },
    };

    const file = new File(["bytes"], "guest.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    const req = new NextRequest("http://localhost:3000/api/media", {
      method: "POST",
      body: formData,
    });

    const res = await uploadMedia(req);
    expect(res.status).toBe(403);
  });
});
