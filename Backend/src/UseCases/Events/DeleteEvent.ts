import { IEventRepository } from "../../Domain/Repositories/IEventRepository";

export class DeleteEvent {
  constructor(private eventRepo: IEventRepository) {}

  async execute(id: string) {
    const existing = await this.eventRepo.findById(id);
    if (!existing) {
      throw new Error("Campanha não encontrada.");
    }
    await this.eventRepo.delete(id);
  }
}
