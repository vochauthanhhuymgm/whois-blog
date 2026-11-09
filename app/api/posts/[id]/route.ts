import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { calculateReadingTime } from "@/lib/reading-time";
import { hasBeenPublic } from "@/lib/post-status";

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
      slug,
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

    const newStatus = status !== undefined ? status : existing.status;

    if (newStatus === "SCHEDULED") {
      const dateVal = scheduledAt !== undefined ? scheduledAt : existing.scheduledAt;
      if (!dateVal) {
        return NextResponse.json(
          { error: "scheduledAt is required when status is SCHEDULED" },
          { status: 400 }
        );
      }
      const scheduledDate = new Date(dateVal);
      // Only a new or changed schedule must be in the future; editing a scheduled post
      // whose time has already passed (it is live) must still be allowed.
      const scheduleChanged =
        existing.status !== "SCHEDULED" ||
        existing.scheduledAt?.getTime() !== scheduledDate.getTime();
      if (isNaN(scheduledDate.getTime()) || (scheduleChanged && scheduledDate.getTime() <= Date.now())) {
        return NextResponse.json(
          { error: "scheduledAt must be a future date/time" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    const slugTakenByOtherPost = async (candidate: string) => {
      const match = await prisma.post.findUnique({ where: { slug: candidate } });
      return !!match && match.id !== params.id;
    };

    if (title && typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    if (typeof slug === "string" && slug.trim()) {
      // Explicit slug from the editor (auto-derived from the title or typed by the admin).
      if (!generateSlug(slug)) {
        return NextResponse.json(
          { error: "URL slug must contain letters or numbers" },
          { status: 400 }
        );
      }
      const nextSlug = await generateUniqueSlug(slug, slugTakenByOtherPost);
      if (nextSlug !== existing.slug) updateData.slug = nextSlug;
    } else if (
      updateData.title &&
      updateData.title !== existing.title &&
      !hasBeenPublic(existing)
    ) {
      // Drafts follow their title; once a post has been public its URL stays stable.
      updateData.slug = await generateUniqueSlug(updateData.title, slugTakenByOtherPost);
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
