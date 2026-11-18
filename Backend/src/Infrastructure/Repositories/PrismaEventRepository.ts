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

  async update(id: string, data: Partial<{ name: string; date: string; startDate?: string; endDate?: string; location: string; pharmacyId?: string }>): Promise<EventEntity> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.pharmacyId !== undefined) {
      if (data.pharmacyId) {
        const pExists = await prisma.pharmacy.findUnique({ where: { id: data.pharmacyId } });
        updateData.pharmacyId = pExists ? data.pharmacyId : null;
      } else {
        updateData.pharmacyId = null;
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        pharmacy: true,
        participants: true,
        triages: true,
      },
    });
    return updated as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.triage.deleteMany({ where: { eventId: id } });
    await prisma.participant.updateMany({ where: { eventId: id }, data: { eventId: null } });
    await prisma.event.delete({ where: { id } });
  }
}

