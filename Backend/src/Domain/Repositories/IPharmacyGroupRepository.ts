import { PharmacyGroupEntity } from "../Entities/PharmacyGroup";

export interface IPharmacyGroupRepository {
  findAll(): Promise<PharmacyGroupEntity[]>;
  findById(id: string): Promise<PharmacyGroupEntity | null>;
  findByCnpj(cnpj: string): Promise<PharmacyGroupEntity | null>;
  create(data: Omit<PharmacyGroupEntity, "createdAt">): Promise<PharmacyGroupEntity>;
  update(id: string, data: Partial<Omit<PharmacyGroupEntity, "id" | "createdAt">>): Promise<PharmacyGroupEntity>;
  delete(id: string): Promise<void>;
}
