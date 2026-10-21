import bcrypt from "bcryptjs";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { generateRandomPassword } from "../../Infrastructure/Security/PasswordGenerator";
import { RequesterContext } from "./GetAllUsers";

export interface CreateUserInput {
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: "admin" | "group_manager" | "pharmacy_user" | "client" | string;
  groupId?: string | null;
  pharmacyId?: string | null;
}

export class CreateUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: CreateUserInput, requester: RequesterContext) {
    if (!input.name || !input.name.trim()) {
      throw new Error("O nome do usuário é obrigatório.");
    }
    if (!input.email || !input.email.trim()) {
      throw new Error("O e-mail do usuário é obrigatório.");
    }

    // Regras de acesso e autorização para criação:
    const requesterRole = requester.role?.toLowerCase();
    if (requesterRole !== "admin" && requesterRole !== "administrador" && requesterRole !== "group_manager") {
      throw new Error("Permissão negada. Apenas Administradores e Gestores de Grupo podem cadastrar usuários.");
    }

    let finalRole = input.role || "pharmacy_user";
    let finalGroupId = input.groupId || null;
    let finalPharmacyId = input.pharmacyId || null;

    if (requesterRole === "group_manager") {
      // Gestor de grupo NUNCA pode criar administrador
      if (finalRole === "admin") {
        throw new Error("Gestores de grupo não possuem permissão para criar administradores gerais.");
      }
      // Gestor de grupo só pode criar usuários associados ao SEU grupo
      if (!requester.groupId) {
        throw new Error("Seu perfil de gestor não possui um grupo de farmácias associado.");
      }
      finalGroupId = requester.groupId;
    }

    // Verifica se e-mail já existe
    const existingEmail = await this.userRepo.findByEmail(input.email);
    if (existingEmail) {
      throw new Error("Este e-mail já está cadastrado no sistema.");
    }

    if (input.username) {
      const existingUser = await this.userRepo.findByUsername(input.username);
      if (existingUser) {
        throw new Error("Este nome de usuário já está em uso.");
      }
    }

    // Geração de senha randômica obrigatória
    const rawPassword = input.password && input.password.trim().length >= 4
      ? input.password.trim()
      : generateRandomPassword(10);

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Obriga alteração de senha no primeiro login
    const created = await this.userRepo.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      username: input.username?.trim().toLowerCase(),
      passwordHash,
      role: finalRole,
      groupId: finalGroupId,
      pharmacyId: finalPharmacyId,
      mustChangePassword: true,
    });

    return {
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        username: created.username,
        role: created.role,
        groupId: created.groupId,
        pharmacyId: created.pharmacyId,
        mustChangePassword: created.mustChangePassword,
      },
      temporaryPassword: rawPassword,
    };
  }
}
