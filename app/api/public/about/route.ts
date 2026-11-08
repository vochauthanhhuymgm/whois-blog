import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("GET /api/public/about error:", error);
    return NextResponse.json({ error: "Failed to fetch about data" }, { status: 500 });
  }
}
