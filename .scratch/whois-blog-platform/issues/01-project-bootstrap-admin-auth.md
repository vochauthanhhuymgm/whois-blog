# 01: Project bootstrap + admin auth

**What to build:** Initialize the Next.js project with TypeScript, Tailwind CSS, and shadcn/ui. Set up Prisma with SQLite and define the User model (with ADMIN/GUEST role enum). Configure NextAuth.js with a credentials provider for admin login. Create a database seed script that reads ADMIN_EMAIL and ADMIN_PASSWORD from environment variables, hashes the password with bcrypt, and upserts the admin user. Build an admin login page and a protected /admin layout with sidebar navigation (empty placeholder pages for now). Configure Vitest as the test runner. When this ticket is done, you can run the app, log in as admin, see the admin shell with sidebar, and be redirected to login if you visit /admin unauthenticated.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Next.js 14+ project created with App Router, TypeScript, Tailwind CSS, pnpm
- [ ] shadcn/ui initialized with base components (Button, Input, Card, etc.)
- [ ] Prisma schema with User model, role enum (ADMIN | GUEST), and NextAuth models (Account, Session, VerificationToken)
- [ ] SQLite database configured, initial migration generated
- [ ] Seed script creates admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars (bcrypt hashed)
- [ ] NextAuth.js configured with credentials provider (email + password, validates against User table)
- [ ] Admin login page at /auth/signin with email/password form
- [ ] Protected /admin route group with shared layout (sidebar nav with placeholder links for Posts, Categories, Comments, Media, Settings, Dashboard)
- [ ] Middleware redirects unauthenticated users from /admin/* to /auth/signin
- [ ] Middleware redirects non-ADMIN users from /admin/* to home page
- [ ] Vitest configured with a test that verifies the Prisma client can connect and the seed script creates the admin user
- [ ] API test: POST to NextAuth sign-in endpoint succeeds with correct admin credentials
- [ ] API test: POST to NextAuth sign-in endpoint fails with wrong credentials
- [ ] .env.example file with all required environment variables documented
- [ ] next-themes configured with light/dark mode toggle in the admin layout
