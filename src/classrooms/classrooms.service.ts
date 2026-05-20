import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassroomDto: CreateClassroomDto) {
    try {
      return await this.prisma.classroom.create({
        data: createClassroomDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('QR duplicado');
      }

      throw error;
    }
  }

  findAll() {
    return this.prisma.classroom.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        devices: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Salón no encontrado');
    }

    return classroom;
  }
}
