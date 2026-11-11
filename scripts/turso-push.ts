import { execSync } from "child_process";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env and .env.local
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    (process.env.DATABASE_URL?.startsWith("libsql://") ||
    process.env.DATABASE_URL?.startsWith("https://")
      ? process.env.DATABASE_URL
      : undefined);

  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl) {
    console.error("\n❌ Error: TURSO_DATABASE_URL is not set.");
    console.error("Please set TURSO_DATABASE_URL (e.g. libsql://your-db.turso.io) in your .env or command line.\n");
    process.exit(1);
  }

  console.log(`\n📦 Generating SQL from Prisma schema...`);
  const rawSql = execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf-8" }
  );

  // Make DDL idempotent so existing tables/indexes don't cause fatal errors
  const idempotentSql = rawSql
    .replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ")
    .replace(/CREATE UNIQUE INDEX /g, "CREATE UNIQUE INDEX IF NOT EXISTS ")
    .replace(/CREATE INDEX /g, "CREATE INDEX IF NOT EXISTS ");

  console.log(`🚀 Connecting to Turso database: ${tursoUrl}`);
  const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });

  console.log(`⚡ Applying schema to Turso...`);
  await client.executeMultiple(idempotentSql);

  console.log(`\n✅ Database schema successfully pushed to Turso!`);
  console.log(`Tip: You can now seed the admin user with:`);
  console.log(`  pnpm db:turso:seed\n`);
}

main().catch((err) => {
  console.error("\n❌ Failed to push schema to Turso:", err.message || err);
  process.exit(1);
});
