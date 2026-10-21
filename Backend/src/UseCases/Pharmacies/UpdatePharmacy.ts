import { IPharmacyRepository } from "../../Domain/Repositories/IPharmacyRepository";
import { PharmacyEntity } from "../../Domain/Entities/Pharmacy";

export class UpdatePharmacy {
  constructor(private pharmacyRepo: IPharmacyRepository) {}

  async execute(id: string, data: Partial<PharmacyEntity>) {
    return await this.pharmacyRepo.update(id, data);
  }
}
