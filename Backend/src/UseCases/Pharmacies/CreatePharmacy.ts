import { IPharmacyRepository } from "../../Domain/Repositories/IPharmacyRepository";

export class CreatePharmacy {
  constructor(private pharmacyRepo: IPharmacyRepository) {}

  async execute(input: {
    name: string;
    cnpj: string;
    phone: string;
    email?: string | null;
    responsible: string;
    crf?: string | null;
    address: string;
    neighborhood: string;
    city: string;
    status?: string;
    notes?: string | null;
  }) {
    if (!input.name || !input.cnpj) {
      throw new Error("Nome e CNPJ da farmácia são obrigatórios.");
    }
    return await this.pharmacyRepo.create(input);
  }
}
