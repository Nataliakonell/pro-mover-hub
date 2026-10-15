import { ITriageRepository } from "../../Domain/Repositories/ITriageRepository";

export class GetAllTriages {
  constructor(private triageRepo: ITriageRepository) {}

  async execute(eventId?: string) {
    return await this.triageRepo.findAll(eventId);
  }
}
