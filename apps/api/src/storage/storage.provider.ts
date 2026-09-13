/**
 * Provider-agnostic object storage interface. Backing implementations:
 * Cloudflare R2 or AWS S3 (both speak the S3 API, so a single S3-compatible
 * client implementation covers both - just point endpoint/credentials at
 * whichever provider is configured).
 */
export interface StorageProvider {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
