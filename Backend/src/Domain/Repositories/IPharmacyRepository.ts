import { PharmacyEntity } from "../Entities/Pharmacy";

export interface IPharmacyRepository {
  findAll(): Promise<PharmacyEntity[]>;
  findById(id: string): Promise<PharmacyEntity | null>;
  create(data: Omit<PharmacyEntity, "id" | "createdAt" | "events">): Promise<PharmacyEntity>;
  update(id: string, data: Partial<PharmacyEntity>): Promise<PharmacyEntity>;
  delete(id: string): Promise<void>;
}
