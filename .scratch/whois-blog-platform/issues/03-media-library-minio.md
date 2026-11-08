# 03: Media library + MinIO storage

**What to build:** Image storage infrastructure and an admin media library. Set up MinIO as an S3-compatible object storage service in Docker Compose. Create a storage adapter interface (upload, delete, getUrl) with a MinIO implementation using @aws-sdk/client-s3. The adapter auto-creates the whois-blog-media bucket on first use. Admin can upload images, browse them in a grid view, delete them, and copy an image's URL. The media API is used by the post editor later to embed images.

**Blocked by:** 01 (Project bootstrap + admin auth)

**Status:** ready-for-agent

- [ ] Docker Compose file with MinIO service (port 9000 for API, 9001 for console) and persistent volume
- [ ] Storage adapter interface defined: upload(file) → url, delete(key) → void, getUrl(key) → string
- [ ] MinIO storage adapter implementation using @aws-sdk/client-s3
- [ ] Auto-create whois-blog-media bucket if it doesn't exist on adapter initialization
- [ ] Prisma schema updated with Media model (id, fileName, url, mimeType, size, uploadedById, createdAt)
- [ ] Migration generated and applied
- [ ] API routes: POST /api/media (multipart upload), GET /api/media (list all), DELETE /api/media/[id]
- [ ] Admin media library page at /admin/media with image grid, upload button, delete with confirmation, click-to-copy URL
- [ ] API test: upload an image → verify Media record created and file accessible via URL
- [ ] API test: list media → verify all uploaded files returned
- [ ] API test: delete media → verify record removed and file deleted from MinIO
- [ ] API test: unauthenticated/guest upload attempt → rejected
- [ ] Environment variables for MinIO connection (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET) in .env.example
