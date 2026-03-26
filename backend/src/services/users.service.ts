import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface ListUsersParams {
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class UsersService {
  async list(params: ListUsersParams) {
    const { role, status, search, sortBy = 'id', sortOrder = 'asc' } = params;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role as any;
    }
    if (status) {
      where.status = status as any;
    }
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
    });

    return users;
  }

  async create(data: { username: string; name: string; email?: string; password: string; role?: string }) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      throw new Error('Username já existe');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        email: data.email || null,
        passwordHash,
        role: (data.role as any) || 'user',
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: number, data: { name?: string; email?: string; role?: string; password?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role as any;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async toggleStatus(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: user.status === 'active' ? 'inactive' : 'active',
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return updated;
  }

  async softDelete(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: 'Utilizador desativado com sucesso', id: updated.id };
  }
}
