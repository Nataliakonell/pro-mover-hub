import { TriageEntity } from "../Entities/Triage";

export interface ITriageRepository {
  findAll(eventId?: string): Promise<TriageEntity[]>;
  create(data: Omit<TriageEntity, "id" | "createdAt">): Promise<TriageEntity>;
}
