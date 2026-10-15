import { IParticipantRepository } from "../../Domain/Repositories/IParticipantRepository";

export class CreateParticipant {
  constructor(private participantRepo: IParticipantRepository) {}

  async execute(input: {
    name: string;
    birthDate: string;
    age: number;
    ageGroup: string;
    cpf: string;
    phone: string;
    eventId?: string;
  }) {
    return await this.participantRepo.create(input);
  }
}
