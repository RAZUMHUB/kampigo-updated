import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * AES-256-GCM field-level encryption for sensitive data at rest, e.g. private
 * ownership verification answers and private item details, so that a raw DB
 * dump/leak does not expose them in plaintext.
 *
 * FIELD_ENCRYPTION_KEY must be a 32+ char secret set via environment config.
 */
@Injectable()
export class FieldEncryptionService {
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.FIELD_ENCRYPTION_KEY!;
    this.key = scryptSync(secret, 'lostfound-static-salt', 32);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(
      '.',
    );
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
