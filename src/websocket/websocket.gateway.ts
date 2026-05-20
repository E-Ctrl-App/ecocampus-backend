import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DeviceStatus, DeviceType, Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';

type DeviceUpdatedPayload = {
  deviceId: number;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  classroomId: number;
};

type QrScannedPayload = {
  classroomId: number;
  classroomName: string;
  userRole: Role;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`client disconnected: ${client.id}`);
  }

  emitDeviceUpdated(payload: DeviceUpdatedPayload) {
    this.server.emit('device.updated', payload);
  }

  emitQrScanned(payload: QrScannedPayload) {
    this.server.emit('qr.scanned', payload);
  }
}
