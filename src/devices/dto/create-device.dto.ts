import { DeviceType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsInt()
  classroomId: number;
}
