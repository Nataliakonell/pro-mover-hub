import { IEventRepository } from "../../Domain/Repositories/IEventRepository";
import { EventEntity } from "../../Domain/Entities/Event";
import { prisma } from "../Database/PrismaClient";

export class PrismaEventRepository implements IEventRepository {
  async findAll(): Promise<EventEntity[]> {
    const list = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list as any;
  }

  async findById(id: string): Promise<EventEntity | null> {
    const event = await prisma.event.findUnique({
      where: { id },
    });
    return event as any;
  }

  async create(data: { id: string; name: string; date: string; location: string }): Promise<EventEntity> {
    const created = await prisma.event.create({
      data: {
        id: data.id,
        name: data.name,
        date: data.date,
        location: data.location,
      },
    });
    return created as any;
  }
}

