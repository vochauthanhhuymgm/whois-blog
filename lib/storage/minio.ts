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
    this.endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
    this.bucket = process.env.MINIO_BUCKET || "whois-blog-media";

    this.client = new S3Client({
      endpoint: this.endpoint,
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
      },
      forcePathStyle: true,
    });
  }

  async ensureBucket(): Promise<void> {
    if (this.bucketInitialized) return;

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
          console.warn("Could not create MinIO bucket:", createErr);
        }
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
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}
