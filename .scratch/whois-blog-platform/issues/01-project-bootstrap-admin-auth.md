# 01: Project bootstrap + admin auth

**What to build:** Initialize the Next.js project with TypeScript, Tailwind CSS, and shadcn/ui. Set up Prisma with SQLite and define the User model (with ADMIN/GUEST role enum). Configure NextAuth.js with a credentials provider for admin login. Create a database seed script that reads ADMIN_EMAIL and ADMIN_PASSWORD from environment variables, hashes the password with bcrypt, and upserts the admin user. Build an admin login page and a protected /admin layout with sidebar navigation (empty placeholder pages for now). Configure Vitest as the test runner. When this ticket is done, you can run the app, log in as admin, see the admin shell with sidebar, and be redirected to login if you visit /admin unauthenticated.

**Blocked by:** None (can start immediately).

**Status:** closed

- [x] Next.js 14+ project created with App Router, TypeScript, Tailwind CSS, pnpm
- [x] shadcn/ui initialized with base components (Button, Input, Card, etc.)
- [x] Prisma schema with User model, role enum (ADMIN | GUEST), and NextAuth models (Account, Session, VerificationToken)
- [x] SQLite database configured, initial migration generated
- [x] Seed script creates admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars (bcrypt hashed)
- [x] NextAuth.js configured with credentials provider (email + password, validates against User table)
- [x] Admin login page at /auth/signin with email/password form
- [x] Protected /admin route group with shared layout (sidebar nav with placeholder links for Posts, Categories, Comments, Media, Settings, Dashboard)
- [x] Middleware redirects unauthenticated users from /admin/* to /auth/signin
- [x] Middleware redirects non-ADMIN users from /admin/* to home page
- [x] Vitest configured with a test that verifies the Prisma client can connect and the seed script creates the admin user
- [x] API test: POST to NextAuth sign-in endpoint succeeds with correct admin credentials
- [x] API test: POST to NextAuth sign-in endpoint fails with wrong credentials
- [x] .env.example file with all required environment variables documented
- [x] next-themes configured with light/dark mode toggle in the admin layout

## Comments

Completed in feat/01-project-bootstrap and merged to integration/whois-blog-platform.
