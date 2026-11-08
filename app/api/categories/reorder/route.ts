import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items array" }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
  }
}
