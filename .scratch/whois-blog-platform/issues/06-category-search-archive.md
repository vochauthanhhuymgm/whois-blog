# 06: Category page + search + archive

**What to build:** Three public discovery pages that share the same layout and post card component. (1) Category page at /category/[slug] showing all published posts in that category, with the category name and description as a header. (2) Search page at /search with a search input that queries published posts by keyword (matched against title and content stripped of HTML tags), showing results as post cards. (3) Archive page at /archive showing all published posts grouped by month/year in reverse chronological order, with collapsible sections.

**Blocked by:** 05 (Public blog — home page + post detail)

**Status:** ready-for-agent

- [ ] Category page at /category/[slug] with category header (name, description) and paginated post list filtered by category
- [ ] Category page returns 404 for non-existent category slugs
- [ ] Search page at /search with search input, results displayed as post cards
- [ ] Search API: GET /api/search?q=keyword queries Post.title and stripped Post.content using SQLite LIKE, returns only published posts
- [ ] HTML-to-text utility for stripping tags from post content before search matching
- [ ] Empty state shown when search returns no results
- [ ] Archive page at /archive with posts grouped by month/year (e.g., "November 2026"), reverse chronological
- [ ] Each archive group shows post titles with links and published dates
- [ ] All three pages share the public layout and reuse the post card component
- [ ] API test: search by keyword → returns matching published posts only
- [ ] API test: search with no matches → returns empty array
- [ ] API test: get posts by category slug → returns correct posts
- [ ] API test: get posts for non-existent category → returns 404
- [ ] Unit test: HTML-to-text stripping removes tags and returns plain text
