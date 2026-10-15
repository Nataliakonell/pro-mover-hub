import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { UserEntity } from "../../Domain/Entities/User";
import { prisma } from "../Database/PrismaClient";

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user as any;
  }

  async create(data: Omit<UserEntity, "id" | "createdAt">): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || "avaliador",
      },
    });
    return user as any;
  }
}
