import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { RequesterContext } from "./GetAllUsers";

export class DeleteUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(targetUserId: number, requester: RequesterContext) {
    const targetUser = await this.userRepo.findById(targetUserId);
    if (!targetUser) {
      throw new Error("Usuário não encontrado.");
    }

    if (requester.id === targetUserId) {
      throw new Error("Você não pode excluir sua própria conta de usuário.");
    }

    const requesterRole = requester.role?.toLowerCase();
    if (requesterRole === "admin" || requesterRole === "administrador") {
      // Admin pode deletar qualquer usuário
      await this.userRepo.delete(targetUserId);
      return;
    }

    if (requesterRole === "group_manager") {
      // Gestor do grupo só pode deletar se o usuário for do seu grupo e não for admin
      if (targetUser.role === "admin") {
        throw new Error("Permissão negada. Você não pode excluir um administrador.");
      }
      if (targetUser.groupId !== requester.groupId) {
        throw new Error("Permissão negada. O usuário não pertence ao seu grupo de farmácias.");
      }
      await this.userRepo.delete(targetUserId);
      return;
    }

    throw new Error("Permissão negada para excluir usuários.");
  }
}
