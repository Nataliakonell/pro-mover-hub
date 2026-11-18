import { TriageEntity } from "../Entities/Triage";

export interface ITriageRepository {
  findAll(eventId?: string, participantId?: string): Promise<TriageEntity[]>;
  findById(id: string): Promise<TriageEntity | null>;
  create(data: Omit<TriageEntity, "id" | "createdAt">): Promise<TriageEntity>;
  update(id: string, data: Partial<Omit<TriageEntity, "id" | "createdAt">>): Promise<TriageEntity>;
  delete(id: string): Promise<void>;
}
