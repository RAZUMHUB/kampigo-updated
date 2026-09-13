import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from '../storage.provider';

@Injectable()
export class S3CompatibleStorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3CompatibleStorageProvider.name);

  private readonly bucket = process.env.STORAGE_BUCKET ?? 'lostfound-dev';
  private readonly accessKeyId = process.env.STORAGE_ACCESS_KEY;
  private readonly secretAccessKey = process.env.STORAGE_SECRET_KEY;
  private readonly region = process.env.STORAGE_REGION ?? 'auto';
  private readonly endpoint = process.env.STORAGE_ENDPOINT;

  private readonly configured = Boolean(
    this.accessKeyId &&
      this.secretAccessKey &&
      this.bucket,
  );

  private readonly client: S3Client | null;

  constructor() {
    if (!this.configured) {
      this.client = null;

      this.logger.warn(
        'Object storage credentials are not configured. Real storage operations are disabled.',
      );

      return;
    }

    this.client = new S3Client({
      region: this.region,
      endpoint: this.endpoint || undefined,
      forcePathStyle: Boolean(this.endpoint),
      credentials: {
        accessKeyId: this.accessKeyId!,
        secretAccessKey: this.secretAccessKey!,
      },
    });
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        `Storage not configured - skipping real upload for key=${key}`,
      );

      return;
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    this.logger.log(
      `Uploaded object bucket=${this.bucket} key=${key}`,
    );
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    if (!this.client) {
      return `https://storage.local.dev/${this.bucket}/${encodeURIComponent(
        key,
      )}?mock=true&ttl=${expiresInSeconds}`;
    }

    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      {
        expiresIn: expiresInSeconds,
      },
    );
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        `Storage not configured - skipping delete for key=${key}`,
      );

      return;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    this.logger.log(
      `Deleted object bucket=${this.bucket} key=${key}`,
    );
  }
}
