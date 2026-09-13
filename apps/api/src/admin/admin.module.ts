import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UniversityAdminController, PlatformAdminController } from './admin.controller';

@Module({
  providers: [AdminService],
  controllers: [UniversityAdminController, PlatformAdminController],
})
export class AdminModule {}
