import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { getStorage } from "@/lib/storage";

export async function GET() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();

    const { key, url } = await storage.upload({
      name: file.name,
      buffer,
      contentType: file.type || "application/octet-stream",
    });

    const mediaRecord = await prisma.media.create({
      data: {
        fileName: file.name,
        key,
        url,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        uploadedById: auth.user.id,
      },
    });

    return NextResponse.json(mediaRecord, { status: 201 });
  } catch (error) {
    console.error("Failed to upload media:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
