import { EventEntity } from "../Entities/Event";

export interface IEventRepository {
  findAll(): Promise<EventEntity[]>;
  findById(id: string): Promise<EventEntity | null>;
}
