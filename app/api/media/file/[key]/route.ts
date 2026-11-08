import { NextRequest, NextResponse } from "next/server";
import { getStorage, MemoryStorageAdapter } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  const storage = getStorage();
  if (storage instanceof MemoryStorageAdapter) {
    const file = storage.getFile(params.key);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return new NextResponse(Buffer.from(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.redirect(storage.getUrl(params.key));
}
