export interface MedicalRecordEntity {
  id: string;
  participantId?: string | null;
  name: string;
  age: number;
  date: string;
  status: "Normal" | "Atenção" | "Alterado" | "Acompanhamento";
  pressure: string;
  glucose: string;
  spo2?: string | null;
  heartRate?: string | null;
  note: string;
  tone: "danger" | "warning" | "info" | "success";
  createdAt?: Date;
}
