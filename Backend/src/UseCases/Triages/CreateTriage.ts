import { ITriageRepository } from "../../Domain/Repositories/ITriageRepository";
import { TriageEntity } from "../../Domain/Entities/Triage";

export class CreateTriage {
  constructor(private triageRepo: ITriageRepository) {}

  async execute(input: Omit<TriageEntity, "id" | "createdAt">) {
    return await this.triageRepo.create(input);
  }
}
