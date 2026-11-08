import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Database & Seed", () => {
  it("can connect to SQLite and find the seeded admin user", async () => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    expect(admin).not.toBeNull();
    expect(admin?.role).toBe("ADMIN");
    expect(admin?.password).toBeDefined();

    // Verify password matches hashed value
    const isPasswordValid = await bcrypt.compare(
      process.env.ADMIN_PASSWORD || "adminpassword123",
      admin!.password!
    );
    expect(isPasswordValid).toBe(true);
  });
});
