import { IMedicalRecordRepository } from "../../Domain/Repositories/IMedicalRecordRepository";
import { MedicalRecordEntity } from "../../Domain/Entities/MedicalRecord";

export class CreateMedicalRecord {
  constructor(private recordRepo: IMedicalRecordRepository) {}

  async execute(input: Omit<MedicalRecordEntity, "createdAt">) {
    return await this.recordRepo.create(input);
  }
}
