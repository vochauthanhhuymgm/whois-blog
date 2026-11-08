import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { generateUniqueSlug } from "@/lib/slug";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { name, description, sortOrder } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const slug = await generateUniqueSlug(trimmedName, async (candidate) => {
      const existing = await prisma.category.findUnique({
        where: { slug: candidate },
      });
      return !!existing;
    });

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug,
        description: description ? description.trim() : null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category with this name or slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
