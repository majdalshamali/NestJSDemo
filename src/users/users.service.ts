import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// User creation now happens through Better Auth's own sign up endpoint
// (POST /api/auth/sign-up/email), not here; this service only reads.
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
