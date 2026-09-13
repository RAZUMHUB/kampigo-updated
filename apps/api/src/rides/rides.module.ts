import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { RidesGateway } from './gateway/rides.gateway';
import { RidesChatGateway } from './chat/rides-chat.gateway';

@Module({
  imports: [AuthModule],
  controllers: [RidesController],
  providers: [RidesService, RidesGateway, RidesChatGateway],
})
export class RidesModule {}
