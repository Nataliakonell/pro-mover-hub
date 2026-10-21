export interface EventEntity {
  id: string;
  name: string;
  date: string;
  startDate?: string;
  endDate?: string;
  location: string;
  pharmacyId?: string | null;
  pharmacy?: any;
  createdAt?: Date;
}
