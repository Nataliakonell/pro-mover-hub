import { IPharmacyGroupRepository } from "../../Domain/Repositories/IPharmacyGroupRepository";

export class UpdatePharmacyGroup {
  constructor(private groupRepo: IPharmacyGroupRepository) {}

  async execute(id: string, input: {
    name?: string;
    cnpj?: string | null;
    responsible?: string | null;
    phone?: string | null;
    email?: string | null;
  }) {
    const existing = await this.groupRepo.findById(id);
    if (!existing) {
      throw new Error("Grupo de farmácias não encontrado.");
    }

    return this.groupRepo.update(id, input);
  }
}
