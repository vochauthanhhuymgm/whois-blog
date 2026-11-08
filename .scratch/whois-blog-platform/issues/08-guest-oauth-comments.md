# 08: Guest OAuth + commenting with moderation

**What to build:** The guest interaction layer. Guests can sign in via Google or GitHub OAuth (NextAuth providers added alongside the existing credentials provider). Signed-in guests can write comments on published post detail pages. Comments are saved with PENDING status and are not visible until the admin approves them. The guest sees a "your comment is pending moderation" notice after submitting. The admin gets a comment moderation page at /admin/comments showing all pending comments with approve, reject, and delete actions. Approved comments appear on the post detail page with the commenter's name and avatar. The admin can also delete previously approved or rejected comments.

**Blocked by:** 05 (Public blog — home page + post detail)

**Status:** ready-for-agent

- [ ] NextAuth configuration updated with Google and GitHub OAuth providers
- [ ] OAuth users auto-created with role: GUEST on first sign-in
- [ ] Prisma schema updated with Comment model (id, content, status enum PENDING|APPROVED|REJECTED, postId, authorId, createdAt)
- [ ] Migration generated and applied
- [ ] Guest sign-in button/link on the public layout header (shows avatar/name when signed in)
- [ ] Sign-in page at /auth/signin with Google and GitHub OAuth buttons (plus existing admin credentials form)
- [ ] Comment form on post detail page, visible only to signed-in users (guests and admin)
- [ ] API route: POST /api/comments (requires auth, creates comment with PENDING status)
- [ ] After submitting, guest sees "Your comment is pending moderation" notice
- [ ] API route: GET /api/comments?postId=X returns only APPROVED comments for public display
- [ ] Approved comments rendered on post detail page with commenter name, avatar, and date
- [ ] Admin moderation page at /admin/comments showing pending comments with post title context
- [ ] API routes: PUT /api/admin/comments/[id]/approve, PUT /api/admin/comments/[id]/reject, DELETE /api/admin/comments/[id]
- [ ] Admin can filter comments by status (pending, approved, rejected)
- [ ] API test: guest creates comment → saved as PENDING, not returned in public comment list
- [ ] API test: admin approves comment → status changes to APPROVED, now returned in public list
- [ ] API test: admin rejects comment → status changes to REJECTED, not in public list
- [ ] API test: admin deletes comment → record removed
- [ ] API test: unauthenticated comment submission → rejected with 401
- [ ] API test: comment on non-existent post → rejected with 404
- [ ] Environment variables for Google and GitHub OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET) in .env.example
