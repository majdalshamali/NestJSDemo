import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateMaratonDto } from './dto/create-maraton.dto.js';
import type { UpdateMaratonDto } from './dto/update-maraton.dto.js';

@Injectable()
export class MaratonService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMaratonDto, authorId: string) {
    return this.prisma.maraton.create({ data: { ...dto, authorId } });
  }

  findAll() {
    return this.prisma.maraton.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const maraton = await this.prisma.maraton.findUnique({ where: { id } });
    if (!maraton) {
      throw new HttpException('Maraton not found', HttpStatus.NOT_FOUND);
    }
    return maraton;
  }

  async update(id: string, dto: UpdateMaratonDto) {
    await this.findOne(id);
    return this.prisma.maraton.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.maraton.delete({ where: { id } });
  }

  async join(maratonId: string, userId: string) {
    const maraton = await this.findOne(maratonId);

    if (!maraton.isActive) {
      throw new HttpException('Maraton is not active', HttpStatus.BAD_REQUEST);
    }
    if (maraton.endDate.getTime() <= Date.now()) {
      throw new HttpException(
        'Maraton has already ended',
        HttpStatus.BAD_REQUEST,
      );
    }

    const alreadyJoined = await this.prisma.maratonParticipate.findUnique({
      where: { maratonId_userId: { maratonId, userId } },
    });
    if (alreadyJoined) {
      throw new HttpException(
        'Already joined this Maraton',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.maratonParticipate.create({
      data: { maratonId, userId },
    });
  }
}
