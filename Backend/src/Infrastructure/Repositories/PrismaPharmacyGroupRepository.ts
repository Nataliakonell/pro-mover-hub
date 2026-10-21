import { IPharmacyGroupRepository } from "../../Domain/Repositories/IPharmacyGroupRepository";
import { PharmacyGroupEntity } from "../../Domain/Entities/PharmacyGroup";
import { prisma } from "../Database/PrismaClient";

export class PrismaPharmacyGroupRepository implements IPharmacyGroupRepository {
  async findAll(): Promise<PharmacyGroupEntity[]> {
    const groups = await prisma.pharmacyGroup.findMany({
      orderBy: { name: "asc" },
      include: {
        pharmacies: {
          select: { id: true, name: true, cnpj: true },
        },
      },
    });
    return groups as any;
  }

  async findById(id: string): Promise<PharmacyGroupEntity | null> {
    const group = await prisma.pharmacyGroup.findUnique({
      where: { id },
      include: {
        pharmacies: true,
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    return group as any;
  }

  async findByCnpj(cnpj: string): Promise<PharmacyGroupEntity | null> {
    const group = await prisma.pharmacyGroup.findUnique({
      where: { cnpj },
    });
    return group as any;
  }

  async create(data: Omit<PharmacyGroupEntity, "createdAt">): Promise<PharmacyGroupEntity> {
    const group = await prisma.pharmacyGroup.create({
      data: {
        id: data.id,
        name: data.name,
        cnpj: data.cnpj || null,
        responsible: data.responsible || null,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
    return group as any;
  }

  async update(id: string, data: Partial<Omit<PharmacyGroupEntity, "id" | "createdAt">>): Promise<PharmacyGroupEntity> {
    const group = await prisma.pharmacyGroup.update({
      where: { id },
      data: {
        name: data.name,
        cnpj: data.cnpj,
        responsible: data.responsible,
        phone: data.phone,
        email: data.email,
      },
    });
    return group as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.pharmacyGroup.delete({
      where: { id },
    });
  }
}
