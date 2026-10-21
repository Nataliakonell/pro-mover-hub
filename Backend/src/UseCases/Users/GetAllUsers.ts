import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export interface RequesterContext {
  id: number;
  role: string;
  groupId?: string | null;
  pharmacyId?: string | null;
}

export class GetAllUsers {
  constructor(private userRepo: IUserRepository) {}

  async execute(requester: RequesterContext) {
    const role = requester.role?.toLowerCase();
    if (role === "admin" || role === "administrador") {
      // Administrador geral tem visão de tudo
      return this.userRepo.findAll();
    }

    if (role === "group_manager" && requester.groupId) {
      // Gestor do grupo tem visão dos usuários vinculados ao seu grupo
      return this.userRepo.findAll({ groupId: requester.groupId });
    }

    if (role === "pharmacy_user" && requester.pharmacyId) {
      // Usuário da farmácia vê apenas da sua farmácia
      return this.userRepo.findAll({ pharmacyId: requester.pharmacyId });
    }

    return [];
  }
}
