import { IMedicalRecordRepository } from "../../Domain/Repositories/IMedicalRecordRepository";

export class GetAllMedicalRecords {
  constructor(private recordRepo: IMedicalRecordRepository) {}

  async execute() {
    return await this.recordRepo.findAll();
  }
}
