# 07: Post scheduling + pinning

**What to build:** Two post management features that enhance what was built in ticket 04. (1) Scheduling: admin can set a post's status to SCHEDULED with a future scheduledAt date/time via a date picker in the post editor. Scheduled posts are invisible on public pages until their scheduledAt time passes, at which point they appear as if published (query-time approach: WHERE status = PUBLISHED OR (status = SCHEDULED AND scheduledAt <= now)). (2) Pinning: admin can toggle a post's isPinned flag from the post list or editor. Pinned published posts appear before non-pinned posts on the home page.

**Blocked by:** 04 (Post editor + draft/publish workflow)

**Status:** closed

- [x] Post editor gains a date/time picker when status is set to SCHEDULED, storing the value in scheduledAt
- [x] Saving a post as SCHEDULED requires a future scheduledAt value (validation)
- [x] Public post queries include scheduled posts whose scheduledAt is in the past: (status = PUBLISHED) OR (status = SCHEDULED AND scheduledAt <= now)
- [x] Scheduled posts with future scheduledAt are excluded from all public pages and APIs
- [x] Admin post list shows SCHEDULED status and scheduledAt date for scheduled posts
- [x] Pin/unpin toggle on admin post list and post editor
- [x] Home page query orders pinned posts first, then by publishedAt descending
- [x] API test: create scheduled post with future date -> not returned in public post list
- [x] API test: create scheduled post with past date -> returned in public post list
- [x] API test: pin a post -> home page returns it before non-pinned posts
- [x] API test: unpin a post -> home page returns it in normal chronological order
- [x] API test: schedule validation -> reject if scheduledAt is in the past or missing when status is SCHEDULED

## Comments

Completed in feat/07-scheduling-pinning and merged to integration/whois-blog-platform.
