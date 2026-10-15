import { ICourtesyRepository } from "../../Domain/Repositories/ICourtesyRepository";

export class GetCourtesyRecords {
  constructor(private courtesyRepo: ICourtesyRepository) {}

  async execute() {
    return await this.courtesyRepo.findAll();
  }
}
