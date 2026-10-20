import { IEventRepository } from "../../Domain/Repositories/IEventRepository";

export class CreateEvent {
  constructor(private eventRepo: IEventRepository) {}

  async execute(data: { name: string; date?: string; startDate?: string; endDate?: string; location: string }) {
    const id = `evt-${Date.now().toString().slice(-6)}`;
    const startDate = data.startDate?.trim();
    const endDate = data.endDate?.trim();
    const computedDate = data.date?.trim() || (startDate ? (endDate && endDate !== startDate ? `${startDate} a ${endDate}` : startDate) : "");

    return this.eventRepo.create({
      id,
      name: data.name.trim(),
      date: computedDate,
      startDate: startDate || computedDate,
      endDate: endDate || startDate || computedDate,
      location: data.location.trim(),
    });
  }
}
