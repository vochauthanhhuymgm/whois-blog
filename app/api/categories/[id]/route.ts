import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { generateUniqueSlug } from "@/lib/slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, sortOrder } = body;

    const data: any = {};
    if (name && typeof name === "string" && name.trim()) {
      const trimmedName = name.trim();
      data.name = trimmedName;
      if (trimmedName !== existing.name) {
        data.slug = await generateUniqueSlug(trimmedName, async (candidate) => {
          const match = await prisma.category.findUnique({
            where: { slug: candidate },
          });
          return !!match && match.id !== params.id;
        });
      }
    }

    if (description !== undefined) {
      data.description = description ? description.trim() : null;
    }

    if (sortOrder !== undefined && typeof sortOrder === "number") {
      data.sortOrder = sortOrder;
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    if (category._count.posts > 0 && !force) {
      return NextResponse.json(
        {
          error: "Category has associated posts. Confirmation required to delete.",
          postCount: category._count.posts,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
