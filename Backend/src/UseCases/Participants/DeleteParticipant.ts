import { IParticipantRepository } from "../../Domain/Repositories/IParticipantRepository";

export class DeleteParticipant {
  constructor(private participantRepo: IParticipantRepository) {}

  async execute(id: string) {
    const existing = await this.participantRepo.findById(id);
    if (!existing) {
      throw new Error("Participante não encontrado.");
    }
    await this.participantRepo.delete(id);
  }
}
