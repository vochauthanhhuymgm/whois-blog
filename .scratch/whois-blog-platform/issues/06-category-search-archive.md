# 06: Category page + search + archive

**What to build:** Three public discovery pages that share the same layout and post card component. (1) Category page at /category/[slug] showing all published posts in that category, with the category name and description as a header. (2) Search page at /search with a search input that queries published posts by keyword (matched against title and content stripped of HTML tags), showing results as post cards. (3) Archive page at /archive showing all published posts grouped by month/year in reverse chronological order, with collapsible sections.

**Blocked by:** 05 (Public blog — home page + post detail)

**Status:** closed

- [x] Category page at /category/[slug] with category header (name, description) and paginated post list filtered by category
- [x] Category page returns 404 for non-existent category slugs
- [x] Search page at /search with search input, results displayed as post cards
- [x] Search API: GET /api/search?q=keyword queries Post.title and stripped Post.content using SQLite LIKE, returns only published posts
- [x] HTML-to-text utility for stripping tags from post content before search matching
- [x] Empty state shown when search returns no results
- [x] Archive page at /archive with posts grouped by month/year (e.g., "November 2026"), reverse chronological
- [x] Each archive group shows post titles with links and published dates
- [x] All three pages share the public layout and reuse the post card component
- [x] API test: search by keyword -> returns matching published posts only
- [x] API test: search with no matches -> returns empty array
- [x] API test: get posts by category slug -> returns correct posts
- [x] API test: get posts for non-existent category -> 404
- [x] Unit test: HTML-to-text stripping removes tags and returns plain text

## Comments

Completed in feat/06-category-search-archive and merged to integration/whois-blog-platform.
