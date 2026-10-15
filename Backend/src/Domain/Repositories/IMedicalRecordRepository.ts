import { MedicalRecordEntity } from "../Entities/MedicalRecord";

export interface IMedicalRecordRepository {
  findAll(): Promise<MedicalRecordEntity[]>;
  findById(id: string): Promise<MedicalRecordEntity | null>;
  create(data: Omit<MedicalRecordEntity, "createdAt">): Promise<MedicalRecordEntity>;
}
