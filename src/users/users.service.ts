import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Business logic lives here. The controller stays thin and just maps HTTP
// to these methods.
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { email: string; name?: string }) {
    try {
      return await this.prisma.user.create({ data });
    } catch (e) {
      // P2002 = unique constraint violation (the @unique on email).
      // Translate it to 409 instead of letting it surface as a 500.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('A user with that email already exists');
      }
      throw e;
    }
  }

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
