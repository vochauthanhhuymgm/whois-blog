import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const now = new Date();

  // Find post that is either PUBLISHED or past its SCHEDULED date
  const post = await prisma.post.findFirst({
    where: {
      slug: params.slug,
      OR: [
        { status: "PUBLISHED" },
        {
          status: "SCHEDULED",
          scheduledAt: { lte: now },
        },
      ],
    },
    include: {
      category: true,
      author: {
        select: { id: true, name: true, image: true, bio: true },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Increment view count asynchronously
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  // Fetch up to 3 related posts from same category
  let relatedPosts: any[] = [];
  if (post.categoryId) {
    relatedPosts = await prisma.post.findMany({
      where: {
        categoryId: post.categoryId,
        id: { not: post.id },
        OR: [
          { status: "PUBLISHED" },
          { status: "SCHEDULED", scheduledAt: { lte: now } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        readingTime: true,
        publishedAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  return NextResponse.json({
    post: {
      ...post,
      viewCount: post.viewCount + 1,
    },
    relatedPosts,
  });
}
