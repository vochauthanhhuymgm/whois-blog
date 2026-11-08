import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const totalPublishedPosts = await prisma.post.count({
      where: {
        OR: [
          { status: "PUBLISHED" },
          { status: "SCHEDULED", scheduledAt: { lte: now } },
        ],
      },
    });

    const totalApprovedComments = await prisma.comment.count({
      where: { status: "APPROVED" },
    });

    const viewsAggregate = await prisma.post.aggregate({
      _sum: { viewCount: true },
    });
    const totalViews = viewsAggregate._sum.viewCount || 0;

    return NextResponse.json({
      totalPublishedPosts,
      totalApprovedComments,
      totalViews,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
