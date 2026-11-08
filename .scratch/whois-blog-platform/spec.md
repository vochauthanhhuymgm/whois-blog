# whois-blog — Personal Blog Platform Spec

Status: ready-for-agent

## Problem Statement

The user needs a personal blog platform where they can write and publish posts organized by categories (e.g., "Technical", "Book Review"). They want a clean, Medium-like reading experience for visitors, with the ability for guests to leave comments on posts. Currently, there is no blog infrastructure — this is a greenfield project.

## Solution

Build a full-stack blog application with two audiences:

1. **Admin (the user)** — a single privileged account that can create/manage categories, write/edit/schedule/pin posts using a rich text editor, moderate guest comments, manage uploaded media, and view basic analytics.
2. **Guests** — visitors who can browse published posts, search, filter by category, and sign in via Google/GitHub OAuth to leave comments (which require admin approval before appearing publicly).

The application is a self-hosted Next.js app deployed via Docker Compose alongside a MinIO instance for S3-compatible object storage.

## User Stories

### Admin — Authentication
1. As the admin, I want to sign in with my email and password, so that I can access the admin dashboard securely.
2. As the admin, I want my session to persist across browser refreshes, so that I don't have to log in repeatedly.
3. As the admin, I want to update my password from the settings page, so that I can rotate credentials.

### Admin — Dashboard
4. As the admin, I want to see an overview of total posts, total comments, and total views on the dashboard, so that I can track my blog's activity at a glance.

### Admin — Category Management
5. As the admin, I want to create a new category with a name and optional description, so that I can organize my posts.
6. As the admin, I want each category to have an auto-generated slug based on its name, so that category URLs are SEO-friendly.
7. As the admin, I want to edit a category's name and description, so that I can refine my taxonomy over time.
8. As the admin, I want to delete a category, so that I can remove unused categories (with a warning if posts still reference it).
9. As the admin, I want to reorder categories via a sort order field, so that they appear in my preferred order in navigation.

### Admin — Post Management
10. As the admin, I want to create a new post with a title, content (rich text), excerpt, cover image, and category, so that I can publish articles.
11. As the admin, I want to write post content using a rich text (WYSIWYG) editor with formatting (bold, italic, headings, lists, links, images, code blocks), so that my posts look professional without writing HTML.
12. As the admin, I want each post to have an auto-generated slug from its title, so that post URLs are readable and SEO-friendly.
13. As the admin, I want to save a post as a draft, so that I can work on it before publishing.
14. As the admin, I want to publish a draft post, so that it becomes visible to guests.
15. As the admin, I want to schedule a post to publish at a future date/time, so that I can prepare content in advance.
16. As the admin, I want to pin a post so it appears at the top of the home page feed, so that I can highlight important content.
17. As the admin, I want to unpin a previously pinned post, so that the home page stays current.
18. As the admin, I want to edit an existing post's content, metadata, and status, so that I can fix mistakes or update information.
19. As the admin, I want to delete a post, so that I can remove content I no longer want published.
20. As the admin, I want to see a list of all my posts with filtering by status (draft/scheduled/published) and category, so that I can manage my content.
21. As the admin, I want to search my posts by title, so that I can quickly find a specific post.
22. As the admin, I want to set SEO fields (meta title, meta description, OG image) per post, so that my posts appear well in search engines and social shares.

### Admin — Media Library
23. As the admin, I want to upload images to the media library, so that I can use them in posts and as cover images.
24. As the admin, I want to browse all uploaded images in a grid view, so that I can find and reuse images.
25. As the admin, I want to delete images from the media library, so that I can free up storage.
26. As the admin, I want to copy an image's URL from the media library, so that I can embed it in posts.

### Admin — Comment Moderation
27. As the admin, I want to see a list of all pending comments, so that I can review what guests have written.
28. As the admin, I want to approve a pending comment, so that it becomes visible on the post page.
29. As the admin, I want to reject a pending comment, so that inappropriate content never appears.
30. As the admin, I want to delete any comment (pending, approved, or rejected), so that I have full control over discussion.

### Admin — Profile Settings
31. As the admin, I want to update my display name and bio, so that the "About" page and post bylines reflect who I am.
32. As the admin, I want to upload or change my avatar image, so that my profile photo appears on the blog.

### Guest — Browsing
33. As a guest, I want to see the home page with the latest published posts (pinned posts first), so that I can discover recent content.
34. As a guest, I want to see each post's title, excerpt, cover image, category, date, and reading time on the home page, so that I can decide what to read.
35. As a guest, I want to click on a post to read the full article, so that I can consume the content.
36. As a guest, I want to see an auto-generated table of contents on the post page (from headings), so that I can navigate long articles.
37. As a guest, I want to see the estimated reading time on each post, so that I can decide if I have time to read it.
38. As a guest, I want to see related posts (from the same category) at the bottom of a post page, so that I can discover more content.
39. As a guest, I want to filter posts by category, so that I can focus on topics I'm interested in.
40. As a guest, I want to search all published posts by keyword, so that I can find specific content.
41. As a guest, I want to browse an archive of all posts organized by month/year, so that I can explore historical content.
42. As a guest, I want to read the "About" page to learn about the blog author, so that I understand whose perspective I'm reading.
43. As a guest, I want to toggle between light and dark mode, so that I can read comfortably in any lighting.

### Guest — Commenting
44. As a guest, I want to sign in with my Google or GitHub account, so that I can leave comments.
45. As a guest, I want to write a comment on a published post, so that I can share my thoughts.
46. As a guest, I want to see approved comments on a post, so that I can read what others have said.
47. As a guest, I want to see a notice that my comment is pending moderation after submitting, so that I know it wasn't lost.

### General
48. As any visitor, I want the blog to be responsive on mobile and desktop, so that I can read from any device.
49. As any visitor, I want posts to have proper Open Graph and meta tags, so that shared links look good on social media.

## Implementation Decisions

### Framework & Language
- **Next.js 14+** with the **App Router** and **TypeScript**.
- React Server Components for data-fetching pages; Client Components only for interactive elements (editor, theme toggle, forms).

### Database
- **SQLite** via **Prisma ORM**. The database file lives at `prisma/dev.db`.
- Schema includes six models: `User`, `Category`, `Post`, `Comment`, `Media`, and the NextAuth-managed `Account`/`Session`/`VerificationToken` models.
- `Post.content` stores rich text as HTML (Tiptap output).
- `Post.status` is an enum: `DRAFT | SCHEDULED | PUBLISHED`.
- `Comment.status` is an enum: `PENDING | APPROVED | REJECTED`.
- `User.role` is an enum: `ADMIN | GUEST`.
- Unique constraints on `Category.slug` and `Post.slug`.

### Authentication
- **NextAuth.js (Auth.js v5)** with two providers:
  - **Credentials** provider for the admin (email + bcrypt-hashed password).
  - **Google** and **GitHub** OAuth providers for guest commenters.
- Admin account is seeded from `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables during first migration/seed.
- Role-based middleware: `/admin/*` routes require `role === ADMIN`.
- Guest OAuth users are auto-created with `role === GUEST` on first sign-in.

### Rich Text Editor
- **Tiptap** with extensions: StarterKit, Image, CodeBlockLowlight, Link, Placeholder, Table.
- Editor outputs HTML stored in `Post.content`.
- Image insertion in the editor uploads to MinIO via the media API and embeds the returned URL.

### File Storage
- **MinIO** for S3-compatible object storage, running alongside the app in Docker Compose.
- A single bucket (`whois-blog-media`) holds all uploaded files.
- The `@aws-sdk/client-s3` package interfaces with MinIO.
- Storage adapter is abstracted behind an interface so switching to AWS S3 or Cloudinary later requires only changing the adapter implementation and env vars.

### UI & Styling
- **Tailwind CSS v3** + **shadcn/ui** for the component library.
- `next-themes` for light/dark mode toggle with system preference detection.
- Clean, minimal, Medium-inspired design: generous whitespace, serif font for body text, sans-serif for headings.

### Computed Fields & Utilities
- **Reading time**: calculated from word count at save time (average 200 WPM), stored as an integer (minutes).
- **Slug generation**: derived from title via `slugify`, with collision detection (append numeric suffix if needed).
- **Table of contents**: parsed client-side from rendered HTML headings (h2, h3).
- **Related posts**: query posts in the same category, excluding the current post, limited to 3, ordered by recency.
- **Full-text search**: SQLite `LIKE` queries on `Post.title` and `Post.content` (stripped of HTML tags).

### Routing Architecture
- `(public)` route group for guest-facing pages (home, post, category, search, archive, about).
- `admin` route group for protected admin pages, with a shared admin layout (sidebar navigation).
- `api` routes for CRUD operations, auth, media upload, and search.
- Middleware checks auth on `/admin/*` and `/api/admin/*` routes.

### Docker Compose
- Two services: `app` (Next.js, exposed on port 3000) and `minio` (MinIO, exposed on port 9000 with console on 9001).
- SQLite database persisted via a Docker volume.
- MinIO data persisted via a Docker volume.
- Environment variables configured via `.env` file.

### Post Scheduling
- Posts with `status: SCHEDULED` and a `scheduledAt` in the past are treated as published when queried.
- A lightweight approach: the public queries filter by `(status = PUBLISHED) OR (status = SCHEDULED AND scheduledAt <= now)`.

## Testing Decisions

### What makes a good test
- Tests assert **external behavior**, not implementation details. A test should break only if the feature is broken, not if the internal code is refactored.
- Tests use a real SQLite database (in-memory or temp file) with Prisma migrations applied, not mocked queries.

### Primary seam: API Routes
- All core features (post CRUD, category CRUD, comment moderation, media upload, auth) are tested by sending HTTP requests to the `/api/*` endpoints and asserting:
  - Response status codes and body shapes.
  - Database state via direct Prisma queries after the request.
  - Auth enforcement (unauthorized requests are rejected).
- This is the highest seam and covers the most surface area with the fewest tests.

### Secondary seam: Data layer utilities
- Unit tests for pure logic: reading time calculation, slug generation with collision handling, HTML-to-text stripping for search, table of contents parsing.

### Optional seam: React components
- Integration tests with React Testing Library only for complex interactive components (Tiptap editor wrapper, theme toggle) if their behavior is hard to cover at the API level.

### Test runner
- **Vitest** as the test runner (fast, native TypeScript/ESM support, compatible with Next.js).

## Out of Scope

- **Multi-user admin**: only one admin account exists; no admin invitation or role management UI.
- **Email notifications**: no email when comments are posted or approved.
- **Analytics integration**: no Google Analytics, Plausible, or similar; only basic view counts stored in the database.
- **Internationalization (i18n)**: the blog is single-language.
- **RSS feed**: not included in the initial build (can be added later as a simple API route).
- **Newsletter / subscription**: no email subscription for new posts.
- **Social sharing buttons**: not included; OG tags handle social previews when URLs are shared manually.
- **Rate limiting**: not included in the initial build.
- **Image optimization / CDN**: MinIO serves images directly; no transformation pipeline.
- **Infinite scroll / pagination**: initial build uses simple offset pagination.
- **Export / import**: no data export or import from other blog platforms.

## Further Notes

- The admin account is created during `prisma db seed`. The seed script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment, hashes the password with bcrypt, and upserts the user with `role: ADMIN`.
- MinIO bucket creation is handled on app startup: the storage adapter checks if the bucket exists and creates it if not.
- The storage adapter interface should be designed with migration in mind: `upload(file): Promise<url>`, `delete(key): Promise<void>`, `getUrl(key): string`. Swapping MinIO for S3 or Cloudinary means implementing this interface with a different SDK.
- Post scheduling uses a query-time approach (no cron job). This means a scheduled post becomes visible the moment a visitor loads a page after the scheduled time — no exact-second precision, but perfectly adequate for a personal blog.
- The `about` page content could be stored in the database (editable from admin settings) or as a static MDX file. Recommend starting with database storage so it's editable from the admin UI alongside the profile settings.
