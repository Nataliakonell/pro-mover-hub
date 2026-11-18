export interface TriageEntity {
  id: string;
  participantId?: string | null;
  participantName: string;
  eventId: string;
  eventName?: string;
  pharmacyName?: string;
  time: string;
  date?: string;
  responsible: string;
  status: "Normal" | "Atenção" | "Alterado";
  systolic: number;
  diastolic: number;
  spo2: number;
  heartRate: number;
  result: string;
  createdAt?: Date;
  event?: {
    id: string;
    name: string;
    date?: string;
    startDate?: string | null;
    endDate?: string | null;
    pharmacy?: {
      id: string;
      name: string;
    } | null;
  } | null;
}
