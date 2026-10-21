import { IPharmacyGroupRepository } from "../../Domain/Repositories/IPharmacyGroupRepository";

export class GetAllPharmacyGroups {
  constructor(private groupRepo: IPharmacyGroupRepository) {}

  async execute() {
    return this.groupRepo.findAll();
  }
}
