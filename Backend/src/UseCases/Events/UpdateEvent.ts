import { IEventRepository } from "../../Domain/Repositories/IEventRepository";

export class UpdateEvent {
  constructor(private eventRepo: IEventRepository) {}

  async execute(
    id: string,
    data: Partial<{
      name: string;
      date: string;
      startDate?: string;
      endDate?: string;
      location: string;
      pharmacyId?: string;
    }>
  ) {
    const existing = await this.eventRepo.findById(id);
    if (!existing) {
      throw new Error("Campanha não encontrada.");
    }
    return await this.eventRepo.update(id, data);
  }
}
