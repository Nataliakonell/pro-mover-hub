import { PharmacyEntity } from "../Entities/Pharmacy";

export interface IPharmacyRepository {
  findAll(filter?: { groupId?: string }): Promise<PharmacyEntity[]>;
  findById(id: string): Promise<PharmacyEntity | null>;
  create(data: Omit<PharmacyEntity, "id" | "createdAt" | "events" | "group">): Promise<PharmacyEntity>;
  update(id: string, data: Partial<PharmacyEntity>): Promise<PharmacyEntity>;
  delete(id: string): Promise<void>;
}
