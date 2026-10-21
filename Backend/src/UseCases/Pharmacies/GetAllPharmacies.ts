import { IPharmacyRepository } from "../../Domain/Repositories/IPharmacyRepository";

export class GetAllPharmacies {
  constructor(private pharmacyRepo: IPharmacyRepository) {}

  async execute() {
    return await this.pharmacyRepo.findAll();
  }
}
