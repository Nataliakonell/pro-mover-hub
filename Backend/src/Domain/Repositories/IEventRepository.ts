import { EventEntity } from "../Entities/Event";

export interface IEventRepository {
  findAll(): Promise<EventEntity[]>;
  findById(id: string): Promise<EventEntity | null>;
  create(data: { id: string; name: string; date: string; location: string }): Promise<EventEntity>;
}

