export interface TriageEntity {
  id: string;
  participantId?: string | null;
  participantName: string;
  eventId: string;
  time: string;
  responsible: string;
  status: "Normal" | "Atenção" | "Alterado";
  systolic: number;
  diastolic: number;
  glucose: number;
  spo2: number;
  heartRate: number;
  result: string;
  createdAt?: Date;
}
