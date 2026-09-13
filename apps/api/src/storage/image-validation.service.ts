import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp';

const MAGIC_BYTES: Record<SupportedImageFormat, Buffer> = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  webp: Buffer.from([0x52, 0x49, 0x46, 0x46]),
};

@Injectable()
export class ImageValidationService {
  validateMagicBytes(buffer: Buffer): SupportedImageFormat {
    if (
      buffer.length >= 3 &&
      buffer.subarray(0, 3).equals(MAGIC_BYTES.jpeg)
    ) {
      return 'jpeg';
    }

    if (
      buffer.length >= 4 &&
      buffer.subarray(0, 4).equals(MAGIC_BYTES.png)
    ) {
      return 'png';
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).equals(MAGIC_BYTES.webp) &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'webp';
    }

    throw new BadRequestException(
      'Unsupported or invalid image file',
    );
  }

  async stripExif(
    buffer: Buffer,
    format: SupportedImageFormat,
  ): Promise<Buffer> {
    try {
      const image = sharp(buffer, {
        failOn: 'error',
        limitInputPixels: 40_000_000,
      }).rotate();

      if (format === 'jpeg') {
        return await image
          .jpeg({
            quality: 90,
            mozjpeg: true,
          })
          .toBuffer();
      }

      if (format === 'png') {
        return await image
          .png({
            compressionLevel: 9,
          })
          .toBuffer();
      }

      return await image
        .webp({
          quality: 90,
        })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Image could not be safely processed',
      );
    }
  }

  contentTypeFor(format: SupportedImageFormat): string {
    if (format === 'jpeg') {
      return 'image/jpeg';
    }

    if (format === 'png') {
      return 'image/png';
    }

    return 'image/webp';
  }
}
