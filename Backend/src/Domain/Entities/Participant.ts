export interface ParticipantEntity {
  id: string;
  name: string;
  birthDate: string;
  age: number;
  ageGroup: string;
  cpf: string;
  phone: string;
  eventId?: string | null;
  createdAt?: Date;
  attendances?: any[];
}
