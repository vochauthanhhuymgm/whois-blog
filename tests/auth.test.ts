import { describe, it, expect } from "vitest";
import { handlers } from "@/auth";
import { NextRequest } from "next/server";

describe("NextAuth Credentials API", () => {
  it("authenticates admin with correct credentials", async () => {
    const params = new URLSearchParams();
    params.append("email", "admin@example.com");
    params.append("password", "adminpassword123");

    const req = new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
      method: "POST",
      body: params.toString(),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const res = await handlers.POST(req);
    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).not.toContain("error=CredentialsSignin");
  });

  it("fails authentication with invalid credentials", async () => {
    const params = new URLSearchParams();
    params.append("email", "admin@example.com");
    params.append("password", "wrong-password");

    const req = new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
      method: "POST",
      body: params.toString(),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const res = await handlers.POST(req);
    const location = res.headers.get("location");
    expect(location).toContain("error=CredentialsSignin");
  });
});
