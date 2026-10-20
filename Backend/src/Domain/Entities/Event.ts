export interface EventEntity {
  id: string;
  name: string;
  date: string;
  startDate?: string;
  endDate?: string;
  location: string;
  createdAt?: Date;
}
