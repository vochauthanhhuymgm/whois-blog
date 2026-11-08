import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    user: session.user,
  };
}
