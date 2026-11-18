import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { UserEntity } from "../../Domain/Entities/User";
import bcrypt from "bcryptjs";

export class UpdateUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    id: number,
    data: Partial<{
      name: string;
      email: string;
      username: string;
      password?: string;
      role?: string;
      groupId?: string | null;
      pharmacyId?: string | null;
      mustChangePassword?: boolean;
    }>,
    currentUser: { id: number; role: string }
  ) {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new Error("Usuário não encontrado.");
    }

    const isGlobalAdmin = ["admin", "administrador"].includes(currentUser.role.toLowerCase());
    if (!isGlobalAdmin && currentUser.id !== id) {
      throw new Error("Apenas administradores podem alterar outros usuários.");
    }

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.username !== undefined) updatePayload.username = data.username;
    if (data.role !== undefined && isGlobalAdmin) updatePayload.role = data.role;
    if (data.groupId !== undefined && isGlobalAdmin) updatePayload.groupId = data.groupId;
    if (data.pharmacyId !== undefined && isGlobalAdmin) updatePayload.pharmacyId = data.pharmacyId;
    if (data.mustChangePassword !== undefined) updatePayload.mustChangePassword = data.mustChangePassword;

    if (data.password && data.password.trim().length >= 4) {
      updatePayload.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }

    return await this.userRepo.update(id, updatePayload);
  }
}
