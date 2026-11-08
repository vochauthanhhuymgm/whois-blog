import { describe, it, expect } from "vitest";
import middleware from "@/middleware";
import { NextRequest } from "next/server";

describe("Middleware auth guard", () => {
  it("redirects unauthenticated users from /admin to /auth/signin", async () => {
    const req = new NextRequest("http://localhost:3000/admin");
    const res = await (middleware as any)(req, {});
    expect(res).toBeDefined();
    expect(res?.status).toBe(307);
    const location = res?.headers.get("location");
    expect(location).toContain("/auth/signin");
  });

  it("allows access to public pages", async () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = await (middleware as any)(req, {});
    // When allowed, NextAuth returns either undefined or next() response without redirect location
    const location = res?.headers?.get("location");
    expect(location).toBeNull();
  });
});
