import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      categoryId: category.id,
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", scheduledAt: { lte: now } },
      ],
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      category: true,
      author: true,
    },
  });

  return NextResponse.json({
    category,
    posts,
  });
}
