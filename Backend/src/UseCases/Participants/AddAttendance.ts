import { IParticipantRepository } from "../../Domain/Repositories/IParticipantRepository";

export class AddAttendance {
  constructor(private participantRepo: IParticipantRepository) {}

  async execute(input: {
    participantId: string;
    date: string;
    eventName: string;
    type: string;
    responsible: string;
    status: string;
    summary: string;
    medicalRecordId?: string;
  }) {
    return await this.participantRepo.addAttendance(input);
  }
}
