import { CourtesyRecordEntity, CourtesyUtilizationEntity } from "../Entities/Courtesy";

export interface ICourtesyRepository {
  findAll(): Promise<any[]>;
  createConcession(data: {
    participantId: string;
    triageId?: string;
    sessions: number;
    reason: string;
  }): Promise<CourtesyRecordEntity>;
  createUtilization(data: {
    courtesyRecordId: string;
    date: string;
    type: string;
    professional: string;
    status: "Realizado" | "Agendado" | "Cancelado";
  }): Promise<CourtesyUtilizationEntity>;
}
