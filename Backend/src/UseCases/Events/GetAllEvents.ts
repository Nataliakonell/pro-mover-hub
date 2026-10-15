import { IEventRepository } from "../../Domain/Repositories/IEventRepository";

export class GetAllEvents {
  constructor(private eventRepo: IEventRepository) {}

  async execute() {
    return await this.eventRepo.findAll();
  }
}
