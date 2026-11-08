# 04: Post editor + draft/publish workflow

**What to build:** The core blog post authoring experience. Admin creates a post with a title, rich text content (Tiptap WYSIWYG editor), excerpt, category (dropdown from existing categories), and optional cover image (selected from media library or uploaded inline). Posts start as drafts and can be published. The editor auto-generates a URL slug from the title (with collision handling) and calculates reading time from word count. Admin sees a post list page with filtering by status (draft/scheduled/published) and category, plus title search. Posts can be edited and deleted.

**Blocked by:** 02 (Category management), 03 (Media library + MinIO)

**Status:** ready-for-agent

- [ ] Prisma schema updated with Post model (id, title, slug, excerpt, content, coverImage, status enum DRAFT|SCHEDULED|PUBLISHED, isPinned, scheduledAt, publishedAt, metaTitle, metaDescription, ogImage, viewCount, readingTime, authorId, categoryId, createdAt, updatedAt)
- [ ] Migration generated and applied
- [ ] Slug utility: generate slug from title with collision detection (append -2, -3, etc.)
- [ ] Reading time utility: calculate minutes from HTML content word count (200 WPM average)
- [ ] API routes: POST /api/posts, GET /api/posts (with status/category/search query params), GET /api/posts/[id], PUT /api/posts/[id], DELETE /api/posts/[id]
- [ ] Create post: auto-generates slug and reading time, sets status to DRAFT or PUBLISHED based on user choice, sets publishedAt when publishing
- [ ] Edit post: allows updating all fields, recalculates slug (if title changed) and reading time (if content changed)
- [ ] Tiptap editor component with extensions: StarterKit, Image, CodeBlockLowlight, Link, Placeholder
- [ ] Image insertion in editor uploads to media API and embeds the returned URL
- [ ] Admin post creation page at /admin/posts/new with editor, metadata form, category dropdown, cover image picker
- [ ] Admin post edit page at /admin/posts/[id]/edit pre-populated with existing data
- [ ] Admin post list page at /admin/posts with status filter, category filter, title search, and post cards showing title/status/category/date
- [ ] Delete post with confirmation dialog
- [ ] Unit test: slug generation produces correct slugs, handles collisions
- [ ] Unit test: reading time calculation returns expected minutes for various content lengths
- [ ] API test: create draft post → verify record with DRAFT status, slug, readingTime
- [ ] API test: create and publish post → verify PUBLISHED status and publishedAt set
- [ ] API test: edit post title → verify slug regenerated
- [ ] API test: delete post → verify record removed
- [ ] API test: list posts with status filter → verify correct filtering
- [ ] API test: list posts with category filter → verify correct filtering
- [ ] API test: unauthenticated/guest access to post admin endpoints → rejected
