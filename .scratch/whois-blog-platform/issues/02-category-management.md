# 02: Category management (admin CRUD + public listing)

**What to build:** The full category lifecycle. Admin can create a new category (name + optional description), edit existing categories, reorder them via a sort order field, and delete them (with a warning if posts still reference the category). Each category gets an auto-generated slug from its name. Categories appear in the public-facing navigation sidebar or header for visitors to browse. API route tests cover all CRUD operations and verify that unauthenticated or guest users cannot access admin category endpoints.

**Blocked by:** 01 (Project bootstrap + admin auth)

**Status:** closed

- [x] Prisma schema updated with Category model (id, name, slug, description, sortOrder, createdAt) with unique constraints on name and slug
- [x] Migration generated and applied
- [x] API routes for category CRUD: GET /api/categories, POST /api/categories, PUT /api/categories/[id], DELETE /api/categories/[id]
- [x] Slug auto-generated from name on create/edit, with collision detection (append numeric suffix)
- [x] Delete endpoint returns a warning/error if category has associated posts, requires confirmation
- [x] Admin categories page at /admin/categories with list view, create form, edit inline or modal, delete with confirmation, drag-to-reorder or sort-order input
- [x] Public-facing category list rendered in the site navigation (header or sidebar)
- [x] API test: create category -> verify slug generation
- [x] API test: create duplicate slug -> verify collision handling
- [x] API test: edit category -> verify name/slug/description update
- [x] API test: delete empty category -> verify deletion
- [x] API test: delete category with posts -> verify warning/rejection
- [x] API test: reorder categories -> verify sort order persists
- [x] API test: unauthenticated request to admin category endpoints -> 401
- [x] API test: guest-role request to admin category endpoints -> 403

## Comments

Completed in feat/02-category-management and merged to integration/whois-blog-platform.
