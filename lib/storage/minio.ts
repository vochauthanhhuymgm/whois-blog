import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { StorageAdapter, StorageFile } from "./index";

export class MinIOStorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;
  private bucketInitialized: boolean = false;

  constructor() {
    this.endpoint =
      process.env.S3_ENDPOINT ||
      process.env.MINIO_ENDPOINT ||
      "http://localhost:9000";

    this.bucket =
      process.env.S3_BUCKET ||
      process.env.MINIO_BUCKET ||
      "whois-blog-media";

    const accessKeyId =
      process.env.S3_ACCESS_KEY_ID ||
      process.env.MINIO_ACCESS_KEY ||
      "minioadmin";

    const secretAccessKey =
      process.env.S3_SECRET_ACCESS_KEY ||
      process.env.MINIO_SECRET_KEY ||
      "minioadmin";

    const region =
      process.env.S3_REGION ||
      (this.endpoint.includes("r2.cloudflarestorage.com") ? "auto" : "us-east-1");

    const forcePathStyle =
      process.env.S3_FORCE_PATH_STYLE !== undefined
        ? process.env.S3_FORCE_PATH_STYLE === "true"
        : true;

    this.client = new S3Client({
      endpoint: this.endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  async ensureBucket(): Promise<void> {
    if (this.bucketInitialized) return;

    if (process.env.STORAGE_SKIP_ENSURE_BUCKET === "true") {
      this.bucketInitialized = true;
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketInitialized = true;
    } catch (error: any) {
      if (
        error.$metadata?.httpStatusCode === 404 ||
        error.name === "NotFound" ||
        error.name === "NoSuchBucket"
      ) {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          const policy = {
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "PublicRead",
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
              },
            ],
          };
          await this.client.send(
            new PutBucketPolicyCommand({
              Bucket: this.bucket,
              Policy: JSON.stringify(policy),
            })
          );
          this.bucketInitialized = true;
        } catch (createErr) {
          // Cloud storage (e.g. Cloudflare R2) does not support PutBucketPolicy via API
          // Buckets are managed via dashboard, so we catch gracefully
          console.warn("Could not auto-create or configure bucket policy (expected for Cloudflare R2 / Cloud S3):", createErr);
          this.bucketInitialized = true;
        }
      } else {
        // In case of 403 or permission boundary on HeadBucket, continue anyway
        this.bucketInitialized = true;
      }
    }
  }

  async upload(file: StorageFile): Promise<{ key: string; url: string }> {
    await this.ensureBucket();

    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${timestamp}-${cleanName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: Buffer.from(file.buffer),
        ContentType: file.contentType,
      })
    );

    return {
      key,
      url: this.getUrl(key),
    };
  }

  async delete(key: string): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  getUrl(key: string): string {
    const publicUrl = process.env.S3_PUBLIC_URL || process.env.MEDIA_PUBLIC_URL;
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, "")}/${key}`;
    }
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}
