import { IPharmacyGroupRepository } from "../../Domain/Repositories/IPharmacyGroupRepository";

export class DeletePharmacyGroup {
  constructor(private groupRepo: IPharmacyGroupRepository) {}

  async execute(id: string) {
    const existing = await this.groupRepo.findById(id);
    if (!existing) {
      throw new Error("Grupo de farmácias não encontrado.");
    }

    return this.groupRepo.delete(id);
  }
}
