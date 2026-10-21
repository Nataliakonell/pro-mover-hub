import { IPharmacyRepository } from "../../Domain/Repositories/IPharmacyRepository";
import { PharmacyEntity } from "../../Domain/Entities/Pharmacy";
import { prisma } from "../Database/PrismaClient";

export class PrismaPharmacyRepository implements IPharmacyRepository {
  async findAll(filter?: { groupId?: string }): Promise<PharmacyEntity[]> {
    const where: any = {};
    if (filter?.groupId) {
      where.groupId = filter.groupId;
    }

    const list = await prisma.pharmacy.findMany({
      where,
      include: {
        events: true,
        group: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return list as any;
  }

  async findById(id: string): Promise<PharmacyEntity | null> {
    const p = await prisma.pharmacy.findUnique({
      where: { id },
      include: {
        events: true,
        group: {
          select: { id: true, name: true },
        },
      },
    });
    return p as any;
  }

  async create(data: Omit<PharmacyEntity, "id" | "createdAt" | "events" | "group">): Promise<PharmacyEntity> {
    const count = await prisma.pharmacy.count();
    const newId = `FARM-${String(count + 1).padStart(3, "0")}`;

    const created = await prisma.pharmacy.create({
      data: {
        id: newId,
        name: data.name,
        cnpj: data.cnpj,
        phone: data.phone,
        email: data.email || null,
        responsible: data.responsible,
        crf: data.crf || null,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        status: data.status || "Ativa",
        notes: data.notes || null,
        groupId: data.groupId || null,
      },
      include: {
        events: true,
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return created as any;
  }

  async update(id: string, data: Partial<PharmacyEntity>): Promise<PharmacyEntity> {
    const updated = await prisma.pharmacy.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.cnpj ? { cnpj: data.cnpj } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.responsible ? { responsible: data.responsible } : {}),
        ...(data.crf !== undefined ? { crf: data.crf } : {}),
        ...(data.address ? { address: data.address } : {}),
        ...(data.neighborhood ? { neighborhood: data.neighborhood } : {}),
        ...(data.city ? { city: data.city } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.groupId !== undefined ? { groupId: data.groupId } : {}),
      },
      include: {
        events: true,
        group: {
          select: { id: true, name: true },
        },
      },
    });
    return updated as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.pharmacy.delete({
      where: { id },
    });
  }
}
