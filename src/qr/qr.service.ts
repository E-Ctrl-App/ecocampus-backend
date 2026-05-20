import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceType, Role } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { ScanQrDto } from './dto/scan-qr.dto';

@Injectable()
export class QRService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async scan(scanQrDto: ScanQrDto, user: AuthUser) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { qrCode: scanQrDto.qrCode },
      include: {
        devices: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('QR inválido o salón no encontrado');
    }

    await this.prisma.qRSession.create({
      data: {
        userId: user.id,
        classroomId: classroom.id,
      },
    });

    this.websocketGateway.emitQrScanned({
      classroomId: classroom.id,
      classroomName: classroom.name,
      userRole: user.role,
    });

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
      },
      devices: classroom.devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        allowed: this.isDeviceAllowed(device.type, user.role),
      })),
    };
  }

  private isDeviceAllowed(deviceType: DeviceType, role: Role) {
    if (role === Role.TEACHER) {
      return true;
    }

    return deviceType === DeviceType.LIGHT;
  }
}
