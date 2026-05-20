import { Module } from '@nestjs/common';
import { WebsocketModule } from '../websocket/websocket.module';
import { QRController } from './qr.controller';
import { QRService } from './qr.service';

@Module({
  imports: [WebsocketModule],
  controllers: [QRController],
  providers: [QRService],
})
export class QRModule {}
