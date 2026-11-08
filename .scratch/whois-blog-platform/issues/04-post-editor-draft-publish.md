# 04: Post editor + draft/publish workflow

**What to build:** The core blog post authoring experience. Admin creates a post with a title, rich text content (Tiptap WYSIWYG editor), excerpt, category (dropdown from existing categories), and optional cover image (selected from media library or uploaded inline). Posts start as drafts and can be published. The editor auto-generates a URL slug from the title (with collision handling) and calculates reading time from word count. Admin sees a post list page with filtering by status (draft/scheduled/published) and category, plus title search. Posts can be edited and deleted.

**Blocked by:** 02 (Category management), 03 (Media library + MinIO)

**Status:** closed

- [x] Prisma schema updated with Post model (id, title, slug, excerpt, content, coverImage, status enum DRAFT|SCHEDULED|PUBLISHED, isPinned, scheduledAt, publishedAt, metaTitle, metaDescription, ogImage, viewCount, readingTime, authorId, categoryId, createdAt, updatedAt)
- [x] Migration generated and applied
- [x] Slug utility: generate slug from title with collision detection (append -2, -3, etc.)
- [x] Reading time utility: calculate minutes from HTML content word count (200 WPM average)
- [x] API routes: POST /api/posts, GET /api/posts (with status/category/search query params), GET /api/posts/[id], PUT /api/posts/[id], DELETE /api/posts/[id]
- [x] Create post: auto-generates slug and reading time, sets status to DRAFT or PUBLISHED based on user choice, sets publishedAt when publishing
- [x] Edit post: allows updating all fields, recalculates slug (if title changed) and reading time (if content changed)
- [x] Tiptap editor component with extensions: StarterKit, Image, Link, Placeholder
- [x] Image insertion in editor uploads to media API and embeds the returned URL
- [x] Admin post creation page at /admin/posts/new with editor, metadata form, category dropdown, cover image picker
- [x] Admin post edit page at /admin/posts/[id]/edit pre-populated with existing data
- [x] Admin post list page at /admin/posts with status filter, category filter, title search, and post cards showing title/status/category/date
- [x] Delete post with confirmation dialog
- [x] Unit test: slug generation produces correct slugs, handles collisions
- [x] Unit test: reading time calculation returns expected minutes for various content lengths
- [x] API test: create draft post -> verify record with DRAFT status, slug, readingTime
- [x] API test: create and publish post -> verify PUBLISHED status and publishedAt set
- [x] API test: edit post title -> verify slug regenerated
- [x] API test: delete post -> verify record removed
- [x] API test: list posts with status filter -> verify correct filtering
- [x] API test: list posts with category filter -> verify correct filtering
- [x] API test: unauthenticated/guest access to post admin endpoints -> rejected

## Comments

Completed in feat/04-post-editor-draft-publish and merged to integration/whois-blog-platform.
