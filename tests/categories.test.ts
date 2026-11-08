import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getCategories, POST as createCategory } from "@/app/api/categories/route";
import {
  GET as getCategory,
  PUT as updateCategory,
  DELETE as deleteCategory,
} from "@/app/api/categories/[id]/route";
import { PUT as reorderCategories } from "@/app/api/categories/reorder/route";
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

describe("Category Management API", () => {
  beforeEach(async () => {
    mockSession = {
      user: { id: "admin-user", email: "admin@example.com", role: "ADMIN" },
    };
    // Clean up posts and categories
    await prisma.post.deleteMany();
    await prisma.category.deleteMany();
  });

  it("creates category and generates proper slug", async () => {
    const req = new NextRequest("http://localhost:3000/api/categories", {
      method: "POST",
      body: JSON.stringify({
        name: "Technology Trends",
        description: "Articles about modern tech",
      }),
    });

    const res = await createCategory(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Technology Trends");
    expect(data.slug).toBe("technology-trends");
    expect(data.description).toBe("Articles about modern tech");
  });

  it("handles duplicate name/slug collisions by appending number", async () => {
    // Create first category
    await prisma.category.create({
      data: { name: "Design", slug: "design" },
    });

    // Second category has unique name but yields the same base slug ("design")
    const req = new NextRequest("http://localhost:3000/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Design!" }),
    });

    const res = await createCategory(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.slug).toBe("design-2");
  });

  it("edits category name, slug, and description", async () => {
    const cat = await prisma.category.create({
      data: { name: "Old Name", slug: "old-name", description: "Old desc" },
    });

    const req = new NextRequest(`http://localhost:3000/api/categories/${cat.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: "New Name",
        description: "New desc",
        sortOrder: 5,
      }),
    });

    const res = await updateCategory(req, { params: { id: cat.id } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("New Name");
    expect(data.slug).toBe("new-name");
    expect(data.description).toBe("New desc");
    expect(data.sortOrder).toBe(5);
  });

  it("deletes empty category successfully", async () => {
    const cat = await prisma.category.create({
      data: { name: "Empty Category", slug: "empty-category" },
    });

    const req = new NextRequest(`http://localhost:3000/api/categories/${cat.id}`, {
      method: "DELETE",
    });

    const res = await deleteCategory(req, { params: { id: cat.id } });
    expect(res.status).toBe(200);

    const check = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(check).toBeNull();
  });

  it("rejects deletion of category with associated posts without force flag", async () => {
    const cat = await prisma.category.create({
      data: { name: "Has Posts", slug: "has-posts" },
    });
    await prisma.post.create({
      data: {
        title: "Test Post",
        slug: "test-post",
        categoryId: cat.id,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/categories/${cat.id}`, {
      method: "DELETE",
    });

    const res = await deleteCategory(req, { params: { id: cat.id } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Category has associated posts");
    expect(data.postCount).toBe(1);

    // Now test with force=true
    const forceReq = new NextRequest(
      `http://localhost:3000/api/categories/${cat.id}?force=true`,
      { method: "DELETE" }
    );
    const forceRes = await deleteCategory(forceReq, { params: { id: cat.id } });
    expect(forceRes.status).toBe(200);
  });

  it("reorders categories and persists sortOrder", async () => {
    const cat1 = await prisma.category.create({
      data: { name: "Cat 1", slug: "cat-1", sortOrder: 0 },
    });
    const cat2 = await prisma.category.create({
      data: { name: "Cat 2", slug: "cat-2", sortOrder: 1 },
    });

    const req = new NextRequest("http://localhost:3000/api/categories/reorder", {
      method: "PUT",
      body: JSON.stringify({
        items: [
          { id: cat1.id, sortOrder: 10 },
          { id: cat2.id, sortOrder: 2 },
        ],
      }),
    });

    const res = await reorderCategories(req);
    expect(res.status).toBe(200);

    const updated1 = await prisma.category.findUnique({ where: { id: cat1.id } });
    const updated2 = await prisma.category.findUnique({ where: { id: cat2.id } });
    expect(updated1?.sortOrder).toBe(10);
    expect(updated2?.sortOrder).toBe(2);
  });

  it("rejects unauthenticated requests to admin category endpoints with 401", async () => {
    mockSession = null; // Unauthenticated

    const req = new NextRequest("http://localhost:3000/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Unauth Category" }),
    });

    const res = await createCategory(req);
    expect(res.status).toBe(401);
  });

  it("rejects guest-role requests to admin category endpoints with 403", async () => {
    mockSession = {
      user: { id: "guest-user", email: "guest@example.com", role: "GUEST" },
    };

    const req = new NextRequest("http://localhost:3000/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Guest Category" }),
    });

    const res = await createCategory(req);
    expect(res.status).toBe(403);
  });
});
