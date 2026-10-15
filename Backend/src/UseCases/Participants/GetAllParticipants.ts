import { IParticipantRepository } from "../../Domain/Repositories/IParticipantRepository";

export class GetAllParticipants {
  constructor(private participantRepo: IParticipantRepository) {}

  async execute() {
    return await this.participantRepo.findAll();
  }
}
