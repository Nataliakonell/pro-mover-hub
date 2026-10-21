import { IUserRepository, UserFilter } from "../../Domain/Repositories/IUserRepository";
import { UserEntity } from "../../Domain/Entities/User";
import { prisma } from "../Database/PrismaClient";

export function generateUsername(fullName: string): string {
  if (!fullName) return "user";
  const parts = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "user";
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName}.${lastName}`;
}

export class PrismaUserRepository implements IUserRepository {
  async findAll(filter?: UserFilter): Promise<UserEntity[]> {
    const where: any = {};
    if (filter?.groupId) {
      where.groupId = filter.groupId;
    }
    if (filter?.pharmacyId) {
      where.pharmacyId = filter.pharmacyId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        group: {
          select: { id: true, name: true },
        },
        pharmacy: {
          select: { id: true, name: true },
        },
      },
    });

    return users as any;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        group: {
          select: { id: true, name: true },
        },
        pharmacy: {
          select: { id: true, name: true },
        },
      },
    });
    return user as any;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        group: {
          select: { id: true, name: true },
        },
        pharmacy: {
          select: { id: true, name: true },
        },
      },
    });
    return user as any;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
      include: {
        group: {
          select: { id: true, name: true },
        },
        pharmacy: {
          select: { id: true, name: true },
        },
      },
    });
    return user as any;
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const clean = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: clean },
          { email: clean },
        ],
      },
      include: {
        group: {
          select: { id: true, name: true },
        },
        pharmacy: {
          select: { id: true, name: true },
        },
      },
    });
    return user as any;
  }

  async create(data: Omit<UserEntity, "id" | "createdAt" | "group" | "pharmacy">): Promise<UserEntity> {
    const username = data.username || generateUsername(data.name);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role || "pharmacy_user",
        groupId: data.groupId || null,
        pharmacyId: data.pharmacyId || null,
        mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true,
      },
      include: {
        group: {
          select: { id: true, name: true },
        },
        pharmacy: {
          select: { id: true, name: true },
        },
      },
    });
    return user as any;
  }

  async update(id: number, data: Partial<Omit<UserEntity, "id" | "createdAt" | "group" | "pharmacy">>): Promise<UserEntity> {
    const updateData: any = { ...data };
    if (data.email) updateData.email = data.email.trim().toLowerCase();
    if (data.username) updateData.username = data.username.trim().toLowerCase();

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        group: {
          select: { id: true, name: true },
        },
        pharmacy: {
          select: { id: true, name: true },
        },
      },
    });
    return user as any;
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
