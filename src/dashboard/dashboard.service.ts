import { Injectable } from '@nestjs/common';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEVICE_CONSUMPTION_KWH: Record<DeviceType, number> = {
  [DeviceType.LIGHT]: 0.3,
  [DeviceType.FAN]: 0.5,
  [DeviceType.PROJECTOR]: 0.8,
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [classrooms, totalDevices, devicesOn, activeSessions] =
      await Promise.all([
        this.prisma.classroom.findMany({
          include: {
            devices: true,
          },
        }),
        this.prisma.device.count(),
        this.prisma.device.findMany({
          where: { status: DeviceStatus.ON },
        }),
        this.prisma.qRSession.count({
          where: {
            entryTime: {
              gte: this.getActiveSessionStartDate(),
            },
          },
        }),
      ]);

    const activeClassrooms = classrooms.filter((classroom) =>
      classroom.devices.some((device) => device.status === DeviceStatus.ON),
    ).length;

    const inactiveClassrooms = classrooms.length - activeClassrooms;

    return {
      activeClassrooms,
      devicesOn: devicesOn.length,
      totalDevices,
      activeSessions,
      estimatedConsumption: this.round(this.calculateConsumption(devicesOn)),
      estimatedSavings: this.round(
        this.calculateSavings(
          classrooms.flatMap((classroom) => classroom.devices),
          inactiveClassrooms,
        ),
      ),
    };
  }

  async getClassrooms() {
    const classrooms = await this.prisma.classroom.findMany({
      orderBy: { id: 'asc' },
      include: {
        devices: true,
      },
    });

    return classrooms.map((classroom) => {
      const devicesOn = classroom.devices.filter(
        (device) => device.status === DeviceStatus.ON,
      ).length;

      return {
        id: classroom.id,
        name: classroom.name,
        devicesOn,
        totalDevices: classroom.devices.length,
        status: devicesOn > 0 ? 'ACTIVE' : 'INACTIVE',
      };
    });
  }

  async getDevicesByClassroom() {
    const classrooms = await this.prisma.classroom.findMany({
      orderBy: { id: 'asc' },
      include: {
        devices: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return classrooms.map((classroom) => ({
      classroom: {
        id: classroom.id,
        name: classroom.name,
        qrCode: classroom.qrCode,
      },
      devices: classroom.devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        estimatedConsumption:
          device.status === DeviceStatus.ON
            ? DEVICE_CONSUMPTION_KWH[device.type]
            : 0,
      })),
    }));
  }

  async getActivity() {
    const [latestQrSessions, latestDevicesModified] = await Promise.all([
      this.prisma.qRSession.findMany({
        take: 10,
        orderBy: { entryTime: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          classroom: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.device.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        include: {
          classroom: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      latestQrSessions: latestQrSessions.map((session) => ({
        id: session.id,
        entryTime: session.entryTime,
        user: session.user,
        classroom: session.classroom,
      })),
      latestDevicesModified: latestDevicesModified.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        classroom: device.classroom,
      })),
    };
  }

  private calculateConsumption(devices: { type: DeviceType }[]) {
    return devices.reduce(
      (total, device) => total + DEVICE_CONSUMPTION_KWH[device.type],
      0,
    );
  }

  private calculateSavings(
    devices: { type: DeviceType; status: DeviceStatus }[],
    inactiveClassrooms: number,
  ) {
    const offDevicesSavings = devices
      .filter((device) => device.status === DeviceStatus.OFF)
      .reduce(
        (total, device) => total + DEVICE_CONSUMPTION_KWH[device.type],
        0,
      );

    const inactiveClassroomsSavings = inactiveClassrooms * 1;

    return offDevicesSavings + inactiveClassroomsSavings;
  }

  private getActiveSessionStartDate() {
    const date = new Date();
    date.setHours(date.getHours() - 1);

    return date;
  }

  private round(value: number) {
    return Number(value.toFixed(1));
  }
}
