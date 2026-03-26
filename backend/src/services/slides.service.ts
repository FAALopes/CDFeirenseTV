import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface ListSlidesParams {
  type?: string;
  isActive?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SlidesService {
  async list(params: ListSlidesParams) {
    const { type, isActive, search, sortBy = 'ordering', sortOrder = 'asc' } = params;

    const where: Prisma.SlideWhereInput = {};

    if (type) {
      where.type = type as any;
    }
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const slides = await prisma.slide.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    return slides;
  }

  async getById(id: number) {
    const slide = await prisma.slide.findUnique({ where: { id } });
    if (!slide) {
      throw new Error('Slide não encontrado');
    }
    return slide;
  }

  async create(data: {
    type: string;
    title: string;
    content: any;
    duration?: number;
    ordering?: number;
    isActive?: boolean;
    imageUrl?: string;
  }) {
    // Get the max ordering if not provided
    let ordering = data.ordering;
    if (ordering === undefined) {
      const maxSlide = await prisma.slide.findFirst({
        orderBy: { ordering: 'desc' },
        select: { ordering: true },
      });
      ordering = (maxSlide?.ordering ?? 0) + 1;
    }

    const slide = await prisma.slide.create({
      data: {
        type: data.type as any,
        title: data.title,
        content: data.content,
        duration: data.duration ?? 10,
        ordering,
        isActive: data.isActive ?? true,
        imageUrl: data.imageUrl || null,
      },
    });

    return slide;
  }

  async update(id: number, data: {
    type?: string;
    title?: string;
    content?: any;
    duration?: number;
    ordering?: number;
    isActive?: boolean;
    imageUrl?: string | null;
  }) {
    const existing = await prisma.slide.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Slide não encontrado');
    }

    const updateData: Prisma.SlideUpdateInput = {};
    if (data.type !== undefined) updateData.type = data.type as any;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.ordering !== undefined) updateData.ordering = data.ordering;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    const slide = await prisma.slide.update({
      where: { id },
      data: updateData,
    });

    return slide;
  }

  async delete(id: number) {
    const existing = await prisma.slide.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Slide não encontrado');
    }

    await prisma.slide.delete({ where: { id } });
    return { message: 'Slide eliminado com sucesso', id };
  }

  async reorder(items: { id: number; ordering: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.slide.update({
          where: { id: item.id },
          data: { ordering: item.ordering },
        })
      )
    );

    return { message: 'Ordem atualizada com sucesso' };
  }

  async toggleActive(id: number) {
    const slide = await prisma.slide.findUnique({ where: { id } });
    if (!slide) {
      throw new Error('Slide não encontrado');
    }

    const updated = await prisma.slide.update({
      where: { id },
      data: { isActive: !slide.isActive },
    });

    return updated;
  }
}
