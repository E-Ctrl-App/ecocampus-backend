import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ScanQrDto } from './dto/scan-qr.dto';
import { QRService } from './qr.service';

@Controller('qr')
export class QRController {
  constructor(private readonly qrService: QRService) {}

  @UseGuards(JwtAuthGuard)
  @Post('scan')
  scan(@Body() scanQrDto: ScanQrDto, @CurrentUser() user: AuthUser) {
    return this.qrService.scan(scanQrDto, user);
  }
}
