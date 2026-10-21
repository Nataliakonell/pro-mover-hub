import { IPharmacyRepository } from "../../Domain/Repositories/IPharmacyRepository";

export class DeletePharmacy {
  constructor(private pharmacyRepo: IPharmacyRepository) {}

  async execute(id: string) {
    return await this.pharmacyRepo.delete(id);
  }
}
