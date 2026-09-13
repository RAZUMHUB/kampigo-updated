import { Module } from '@nestjs/common';
import { S3CompatibleStorageProvider } from './providers/s3-compatible.provider';
import { ImageValidationService } from './image-validation.service';

@Module({
  providers: [S3CompatibleStorageProvider, ImageValidationService],
  exports: [S3CompatibleStorageProvider, ImageValidationService],
})
export class StorageModule {}
