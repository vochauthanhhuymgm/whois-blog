import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { calculateReadingTime } from "@/lib/reading-time";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");

  const where: any = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q } },
      { excerpt: { contains: q } },
      { content: { contains: q } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
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

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const {
      title,
      slug: requestedSlug,
      content = "",
      excerpt,
      coverImage,
      status = "DRAFT",
      categoryId,
      isPinned = false,
      scheduledAt,
      metaTitle,
      metaDescription,
      ogImage,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (status === "SCHEDULED") {
      if (!scheduledAt) {
        return NextResponse.json(
          { error: "scheduledAt is required when status is SCHEDULED" },
          { status: 400 }
        );
      }
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "scheduledAt must be a future date/time" },
          { status: 400 }
        );
      }
    }

    const trimmedTitle = title.trim();
    const slugSource =
      typeof requestedSlug === "string" && generateSlug(requestedSlug) ? requestedSlug : trimmedTitle;
    const slug = await generateUniqueSlug(slugSource, async (candidate) => {
      const match = await prisma.post.findUnique({
        where: { slug: candidate },
      });
      return !!match;
    });

    const readingTime = calculateReadingTime(content);
    const publishedAt = status === "PUBLISHED" ? new Date() : null;

    const post = await prisma.post.create({
      data: {
        title: trimmedTitle,
        slug,
        content,
        excerpt: excerpt ? excerpt.trim() : null,
        coverImage: coverImage || null,
        status,
        isPinned: Boolean(isPinned),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt,
        readingTime,
        authorId: auth.user.id,
        categoryId: categoryId || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
