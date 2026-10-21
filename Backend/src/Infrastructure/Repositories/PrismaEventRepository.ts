import { IEventRepository } from "../../Domain/Repositories/IEventRepository";
import { EventEntity } from "../../Domain/Entities/Event";
import { prisma } from "../Database/PrismaClient";

export class PrismaEventRepository implements IEventRepository {
  async findAll(): Promise<EventEntity[]> {
    const list = await prisma.event.findMany({
      include: {
        pharmacy: true,
        participants: true,
        triages: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return list as any;
  }

  async findById(id: string): Promise<EventEntity | null> {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        pharmacy: true,
        participants: true,
        triages: true,
      },
    });
    return event as any;
  }

  async create(data: {
    id: string;
    name: string;
    date: string;
    startDate?: string;
    endDate?: string;
    location: string;
    pharmacyId?: string;
  }): Promise<EventEntity> {
    // Valida se pharmacyId realmente existe no banco antes de relacionar
    let validPharmacyId = null;
    if (data.pharmacyId) {
      const pExists = await prisma.pharmacy.findUnique({ where: { id: data.pharmacyId } });
      if (pExists) {
        validPharmacyId = data.pharmacyId;
      }
    }

    const created = await prisma.event.create({
      data: {
        id: data.id,
        name: data.name,
        date: data.date,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        pharmacyId: validPharmacyId,
      },
      include: {
        pharmacy: true,
        participants: true,
        triages: true,
      },
    });
    return created as any;
  }
}

