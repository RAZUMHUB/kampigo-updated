import { Module } from '@nestjs/common';
import { LostItemsService } from './lost-items.service';
import { LostItemsController } from './lost-items.controller';
import { FoundItemsService } from './found-items.service';
import { FoundItemsController } from './found-items.controller';
import { ItemImagesController } from './item-images.controller';
import { MatchingModule } from '../matching/matching.module';
import { StorageModule } from '../storage/storage.module';

import { EncryptionModule } from '../common/encryption/encryption.module';
@Module({
  imports: [MatchingModule, StorageModule, EncryptionModule],
  providers: [LostItemsService, FoundItemsService],
  controllers: [LostItemsController, FoundItemsController, ItemImagesController],
  exports: [LostItemsService, FoundItemsService],
})
export class ItemsModule {}
