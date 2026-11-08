# 03: Media library + MinIO storage

**What to build:** Image storage infrastructure and an admin media library. Set up MinIO as an S3-compatible object storage service in Docker Compose. Create a storage adapter interface (upload, delete, getUrl) with a MinIO implementation using @aws-sdk/client-s3. The adapter auto-creates the whois-blog-media bucket on first use. Admin can upload images, browse them in a grid view, delete them, and copy an image's URL. The media API is used by the post editor later to embed images.

**Blocked by:** 01 (Project bootstrap + admin auth)

**Status:** closed

- [x] Docker Compose file with MinIO service (port 9000 for API, 9001 for console) and persistent volume
- [x] Storage adapter interface defined: upload(file) -> url, delete(key) -> void, getUrl(key) -> string
- [x] MinIO storage adapter implementation using @aws-sdk/client-s3
- [x] Auto-create whois-blog-media bucket if it doesn't exist on adapter initialization
- [x] Prisma schema updated with Media model (id, fileName, url, mimeType, size, uploadedById, createdAt)
- [x] Migration generated and applied
- [x] API routes: POST /api/media (multipart upload), GET /api/media (list all), DELETE /api/media/[id]
- [x] Admin media library page at /admin/media with image grid, upload button, delete with confirmation, click-to-copy URL
- [x] API test: upload an image -> verify Media record created and file accessible via URL
- [x] API test: list media -> verify all uploaded files returned
- [x] API test: delete media -> verify record removed and file deleted from MinIO
- [x] API test: unauthenticated/guest upload attempt -> rejected
- [x] Environment variables for MinIO connection (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET) in .env.example

## Comments

Completed in feat/03-media-library-minio and merged to integration/whois-blog-platform.
