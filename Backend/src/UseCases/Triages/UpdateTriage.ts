import { ITriageRepository } from "../../Domain/Repositories/ITriageRepository";
import { TriageEntity } from "../../Domain/Entities/Triage";

export class UpdateTriage {
  constructor(private triageRepo: ITriageRepository) {}

  async execute(id: string, data: Partial<Omit<TriageEntity, "id" | "createdAt">>) {
    const existing = await this.triageRepo.findById(id);
    if (!existing) {
      throw new Error("Triagem não encontrada.");
    }
    return await this.triageRepo.update(id, data);
  }
}
