import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { generateUniqueSlug } from "@/lib/slug";
import { calculateReadingTime } from "@/lib/reading-time";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
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

  return NextResponse.json(post);
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
    const existing = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      content,
      excerpt,
      coverImage,
      status,
      categoryId,
      isPinned,
      scheduledAt,
      metaTitle,
      metaDescription,
      ogImage,
    } = body;

    const updateData: any = {};

    if (title && typeof title === "string" && title.trim()) {
      const trimmedTitle = title.trim();
      updateData.title = trimmedTitle;
      if (trimmedTitle !== existing.title) {
        updateData.slug = await generateUniqueSlug(trimmedTitle, async (candidate) => {
          const match = await prisma.post.findUnique({
            where: { slug: candidate },
          });
          return !!match && match.id !== params.id;
        });
      }
    }

    if (content !== undefined) {
      updateData.content = content;
      updateData.readingTime = calculateReadingTime(content);
    }

    if (excerpt !== undefined) {
      updateData.excerpt = excerpt ? excerpt.trim() : null;
    }

    if (coverImage !== undefined) {
      updateData.coverImage = coverImage || null;
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === "PUBLISHED" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId || null;
    }

    if (isPinned !== undefined) {
      updateData.isPinned = Boolean(isPinned);
    }

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }

    if (metaTitle !== undefined) {
      updateData.metaTitle = metaTitle || null;
    }

    if (metaDescription !== undefined) {
      updateData.metaDescription = metaDescription || null;
    }

    if (ogImage !== undefined) {
      updateData.ogImage = ogImage || null;
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const existing = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
