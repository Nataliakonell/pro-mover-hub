import { IEventRepository } from "../../Domain/Repositories/IEventRepository";

export class CreateEvent {
  constructor(private eventRepo: IEventRepository) {}

  async execute(data: { name: string; date: string; location: string }) {
    const id = `evt-${Date.now().toString().slice(-6)}`;
    return this.eventRepo.create({
      id,
      name: data.name.trim(),
      date: data.date.trim(),
      location: data.location.trim(),
    });
  }
}
