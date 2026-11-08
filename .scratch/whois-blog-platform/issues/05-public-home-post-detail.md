# 05: Public blog — home page + post detail

**What to build:** The guest-facing blog experience. The home page shows a feed of published posts with pinned posts appearing first, followed by recent posts. Each post card shows the title, excerpt, cover image, category name, published date, and reading time. Clicking a post navigates to its detail page, which renders the full rich text content, an auto-generated table of contents (from h2/h3 headings), reading time, author info, and up to 3 related posts from the same category. Posts include SEO meta tags and Open Graph tags. The public layout has a header with navigation (home, categories, search, archive, about), a light/dark mode toggle, and a responsive design that works on mobile and desktop.

**Blocked by:** 04 (Post editor + draft/publish workflow)

**Status:** ready-for-agent

- [ ] Public layout with header navigation (Home, category links, Search, Archive, About), light/dark mode toggle via next-themes, responsive hamburger menu on mobile
- [ ] Home page at / showing published posts: pinned posts first, then by publishedAt descending, with offset pagination
- [ ] Post card component showing title, excerpt, cover image, category badge, published date, reading time
- [ ] Post detail page at /post/[slug] rendering full HTML content with typography styles (prose classes)
- [ ] Table of contents component: parses rendered HTML headings (h2, h3), generates anchor links, highlights current section on scroll
- [ ] Related posts section at bottom of post detail: up to 3 posts from same category, excluding current, ordered by recency
- [ ] Author byline on post detail (name, avatar from admin profile)
- [ ] SEO: dynamic meta tags (title, description) and Open Graph tags (og:title, og:description, og:image) on post detail pages using Next.js metadata API
- [ ] View count: increment Post.viewCount on each detail page load
- [ ] Draft and future-scheduled posts are NOT visible on any public page
- [ ] Clean, minimal, Medium-inspired typography: serif body font, generous whitespace, readable line length
- [ ] Responsive layout: mobile-first, works well on phone, tablet, and desktop
- [ ] API test: GET published posts → returns only PUBLISHED posts (not drafts or future-scheduled)
- [ ] API test: GET post by slug → returns full post data with related posts
- [ ] API test: GET non-existent slug → returns 404
