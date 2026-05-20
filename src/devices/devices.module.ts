import { Module } from '@nestjs/common';
import { WebsocketModule } from '../websocket/websocket.module';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [WebsocketModule],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
