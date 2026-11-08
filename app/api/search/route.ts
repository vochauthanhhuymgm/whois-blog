import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json([]);
  }

  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", scheduledAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { content: { contains: q } },
          ],
        },
      ],
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      author: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return NextResponse.json(posts);
}
