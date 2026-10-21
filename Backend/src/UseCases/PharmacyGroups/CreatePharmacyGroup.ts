import { IPharmacyGroupRepository } from "../../Domain/Repositories/IPharmacyGroupRepository";

export class CreatePharmacyGroup {
  constructor(private groupRepo: IPharmacyGroupRepository) {}

  async execute(input: {
    id?: string;
    name: string;
    cnpj?: string | null;
    responsible?: string | null;
    phone?: string | null;
    email?: string | null;
  }) {
    if (!input.name || !input.name.trim()) {
      throw new Error("O nome do grupo de farmácias é obrigatório.");
    }

    if (input.cnpj) {
      const existing = await this.groupRepo.findByCnpj(input.cnpj.trim());
      if (existing) {
        throw new Error("CNPJ do grupo já está cadastrado.");
      }
    }

    const count = (await this.groupRepo.findAll()).length;
    const groupId = input.id || `GRP-${String(count + 1).padStart(3, "0")}`;

    return this.groupRepo.create({
      id: groupId,
      name: input.name.trim(),
      cnpj: input.cnpj?.trim() || null,
      responsible: input.responsible?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    });
  }
}
