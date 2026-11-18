import { IParticipantRepository } from "../../Domain/Repositories/IParticipantRepository";
import { ParticipantEntity } from "../../Domain/Entities/Participant";

export class UpdateParticipant {
  constructor(private participantRepo: IParticipantRepository) {}

  async execute(
    id: string,
    data: Partial<Omit<ParticipantEntity, "id" | "createdAt" | "attendances">>
  ) {
    const existing = await this.participantRepo.findById(id);
    if (!existing) {
      throw new Error("Participante não encontrado.");
    }
    return await this.participantRepo.update(id, data);
  }
}
