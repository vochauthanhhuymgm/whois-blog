# 10: SEO fields + Docker production build

**What to build:** Two finishing touches. (1) SEO fields on the post editor: metaTitle, metaDescription, and ogImage fields (collapsible "SEO" section in the post form). These render as HTML meta tags and Open Graph tags on the post detail page, falling back to the post title/excerpt/coverImage when SEO fields are empty. (2) Production-ready Docker setup: a multi-stage Dockerfile that builds the Next.js app for production, a complete docker-compose.yml with app + MinIO services, persistent volumes for SQLite and MinIO data, health checks, and an .env.example documenting all required variables. Verify the containerized app starts and serves the home page.

**Blocked by:** 09 (Admin dashboard + profile settings + about page)

**Status:** ready-for-agent

- [ ] Post editor form gains a collapsible "SEO Settings" section with metaTitle, metaDescription, and ogImage fields
- [ ] SEO fields saved to Post model (fields already exist from ticket 04 schema)
- [ ] Post detail page meta tags use SEO fields when present, falling back to title/excerpt/coverImage
- [ ] Open Graph tags (og:title, og:description, og:image, og:type, og:url) rendered using Next.js metadata API
- [ ] Multi-stage Dockerfile: build stage (pnpm install, prisma generate, next build) and runtime stage (minimal Node.js image, copy build output)
- [ ] docker-compose.yml with two services: app (port 3000) and minio (ports 9000/9001), persistent volumes for SQLite DB and MinIO data
- [ ] Health check on the app service (curl localhost:3000)
- [ ] .env.example updated with ALL environment variables needed to run the stack
- [ ] README.md with setup instructions: clone, copy .env.example, docker compose up, seed the database
- [ ] Smoke test: docker compose up builds and starts successfully, home page returns 200
- [ ] Verify SEO meta tags render correctly on a post detail page (check page source)
