export interface CourtesyUtilizationEntity {
  id: string;
  courtesyRecordId: string;
  date: string;
  type: string;
  professional: string;
  status: "Realizado" | "Agendado" | "Cancelado";
  createdAt?: Date;
}

export interface CourtesyRecordEntity {
  id: string;
  participantId: string;
  triageId?: string | null;
  date: string;
  sessions: number;
  reason: string;
  createdAt?: Date;
  utilizations?: CourtesyUtilizationEntity[];
}
