# 09: Admin dashboard + profile settings + about page

**What to build:** Three features that round out the admin experience. (1) Dashboard at /admin showing stats cards: total published posts, total approved comments, and total cumulative view count across all posts. (2) Profile settings at /admin/settings where the admin can update their display name, bio, and avatar (uploaded to media library), and change their password (requires current password verification). (3) Public about page at /about pulling the admin's name, bio, and avatar from the database and displaying it in a clean layout.

**Blocked by:** 04 (Post editor + draft/publish), 08 (Guest OAuth + commenting)

**Status:** ready-for-agent

- [ ] Prisma schema update: add bio field to User model (if not already present)
- [ ] Migration generated and applied
- [ ] Dashboard page at /admin (the index page) with stats cards: total published posts, total approved comments, total views
- [ ] Stats fetched via aggregation queries (Prisma count/sum)
- [ ] Profile settings page at /admin/settings with form fields: display name, bio (textarea), avatar (image upload via media library)
- [ ] Password change form: current password, new password, confirm new password, with server-side bcrypt verification of current password
- [ ] API route: PUT /api/admin/profile (update name, bio, avatar)
- [ ] API route: PUT /api/admin/password (change password with current password verification)
- [ ] Public about page at /about showing admin's name, bio, avatar, and any links, styled with the public layout
- [ ] About page data fetched from the User record with role = ADMIN
- [ ] API test: get dashboard stats → returns correct counts for posts, comments, views
- [ ] API test: update profile → verify name, bio, avatar persisted
- [ ] API test: change password with correct current password → success
- [ ] API test: change password with wrong current password → rejected
- [ ] API test: unauthenticated/guest access to profile/password endpoints → rejected
