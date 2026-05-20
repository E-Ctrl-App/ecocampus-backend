import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: createDeviceDto.classroomId },
    });

    if (!classroom) {
      throw new NotFoundException('Salón no encontrado');
    }

    return this.prisma.device.create({
      data: createDeviceDto,
    });
  }

  findAll() {
    return this.prisma.device.findMany({
      orderBy: { id: 'asc' },
      include: {
        classroom: true,
      },
    });
  }

  async findOne(id: number) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        classroom: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    return device;
  }

  async toggle(id: number) {
    const device = await this.findOne(id);
    const nextStatus =
      device.status === DeviceStatus.ON ? DeviceStatus.OFF : DeviceStatus.ON;

    return this.prisma.device.update({
      where: { id },
      data: { status: nextStatus },
    });
  }
}
