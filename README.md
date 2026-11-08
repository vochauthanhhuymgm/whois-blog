# whois-blog

An elegant, editorial personal blog platform for a single administrator to write, organize, and publish articles by category, with guest interaction, rich media storage, and search engine optimization.

## Features

- **Project Bootstrap & Security:** Next.js 14 App Router, NextAuth (Auth.js v5) with credentials and OAuth providers, role-based protection (`ADMIN` and `GUEST`), bcrypt password hashing, and dark/light theme switching.
- **Category Management:** Flat category taxonomy with unique slugs, auto-generation, custom sort ordering, and category navigation.
- **Media Library & S3/MinIO Storage:** S3-compatible object storage via MinIO with abstraction adapter, media upload, grid view, and URL copying.
- **Editorial Post Editor:** Rich WYSIWYG editor using Tiptap (headings, lists, blockquotes, code blocks, links, images), reading time calculation, excerpt, and cover image.
- **Publication Workflow:** Draft, Published, and Scheduled posts with future publishing dates and top-of-feed post pinning.
- **Public Blog:** Responsive layout, article feed, paginated navigation, dynamic table of contents generated from headings, related posts, view counters, and dynamic SEO Open Graph tags.
- **Discovery:** Full-text SQLite search with excerpt matching and reverse-chronological archive grouped by month and year.
- **Guest OAuth & Comments:** GitHub and Google OAuth login for readers, comment submission with moderation queue (`PENDING`, `APPROVED`, `REJECTED`), and administrative moderation dashboard.
- **Admin Dashboard & Settings:** Stat cards for published posts, approved comments, and cumulative view counts; author bio and avatar management; and authenticated password updates.
- **SEO & Production Containerization:** Collapsible SEO controls (`metaTitle`, `metaDescription`, `ogImage`) with fallbacks, multi-stage Dockerfile, and complete Docker Compose stack.

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+
- pnpm 9+
- Docker (optional, for local MinIO service)

### 2. Environment Setup
```bash
# Clone the repository
git clone <repo-url>
cd whois-blog

# Copy example environment configuration
cp .env.example .env
```

### 3. Install Dependencies & Initialize Database
```bash
# Install packages
pnpm install

# Run database migrations
pnpm db:migrate

# Seed the default admin user
pnpm db:seed
```

### 4. Start MinIO (Storage)
```bash
docker compose up -d minio
```

### 5. Run the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin) using the credentials defined in `.env`.

---

## Docker Production Deployment

The project provides a multi-stage Docker build producing an optimized standalone Next.js container, along with MinIO object storage and persistent volumes.

### 1. Configure Environment
```bash
cp .env.example .env
```
Ensure `AUTH_SECRET`, `ADMIN_PASSWORD`, and domain URLs in `.env` are set for your production deployment.

### 2. Build and Start the Stack
```bash
docker compose up -d --build
```

The stack initializes:
- `app`: Production Next.js server running on port `3000` with health check at `http://localhost:3000/` and persistent SQLite volume at `/app/data`.
- `minio`: Object storage running on port `9000` (API) and port `9001` (Web Console) with persistent volume.

Database migrations are automatically applied on container startup via `docker-entrypoint.sh`.

### 3. Seed Admin User in Docker
```bash
docker compose exec app node prisma/seed.js
```

---

## Running Tests

The test suite runs with Vitest against an isolated SQLite test database verifying all business logic and API route seams:

```bash
# Run all unit and integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database & ORM:** SQLite with Prisma ORM
- **Authentication:** NextAuth.js (Auth.js v5)
- **Styling:** Tailwind CSS & Radix UI
- **Rich Text Editor:** Tiptap v2
- **Object Storage:** MinIO S3 SDK (`@aws-sdk/client-s3`)
- **Testing:** Vitest
- **Containerization:** Docker & Docker Compose
