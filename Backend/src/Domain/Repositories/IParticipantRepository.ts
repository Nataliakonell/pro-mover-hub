import { ParticipantEntity } from "../Entities/Participant";

export interface IParticipantRepository {
  findAll(): Promise<ParticipantEntity[]>;
  findById(id: string): Promise<ParticipantEntity | null>;
  create(data: Omit<ParticipantEntity, "id" | "createdAt" | "attendances">): Promise<ParticipantEntity>;
  addAttendance(data: {
    participantId: string;
    date: string;
    eventName: string;
    type: string;
    responsible: string;
    status: string;
    summary: string;
    medicalRecordId?: string;
  }): Promise<any>;
}
