import { EventEntity } from "../Entities/Event";

export interface IEventRepository {
  findAll(): Promise<EventEntity[]>;
  findById(id: string): Promise<EventEntity | null>;
  create(data: { id: string; name: string; date: string; startDate?: string; endDate?: string; location: string; pharmacyId?: string }): Promise<EventEntity>;
  update(id: string, data: Partial<{ name: string; date: string; startDate?: string; endDate?: string; location: string; pharmacyId?: string }>): Promise<EventEntity>;
  delete(id: string): Promise<void>;
}

