import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { UserEntity } from "../../Domain/Entities/User";
import { prisma } from "../Database/PrismaClient";

/**
 * Converte o nome completo no padrão: primeironome.ultimonome
 * Exemplo: "Natalia Konell Afonso Toffoli" -> "natalia.toffoli"
 */
export function generateUsername(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s]/g, "") // remove caracteres especiais
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "user";
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName}.${lastName}`;
}

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return user as any;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
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
    });
    return user as any;
  }

  async create(data: Omit<UserEntity, "id" | "createdAt">): Promise<UserEntity> {
    const username = data.username || generateUsername(data.name);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role || "user",
      },
    });
    return user as any;
  }
}
