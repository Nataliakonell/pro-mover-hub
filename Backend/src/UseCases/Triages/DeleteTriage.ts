import { ITriageRepository } from "../../Domain/Repositories/ITriageRepository";

export class DeleteTriage {
  constructor(private triageRepo: ITriageRepository) {}

  async execute(id: string) {
    const existing = await this.triageRepo.findById(id);
    if (!existing) {
      throw new Error("Triagem não encontrada.");
    }
    await this.triageRepo.delete(id);
  }
}
