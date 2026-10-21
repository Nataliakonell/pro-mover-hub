import { Request, Response } from "express";
import { GetAllPharmacies } from "../../UseCases/Pharmacies/GetAllPharmacies";
import { CreatePharmacy } from "../../UseCases/Pharmacies/CreatePharmacy";
import { UpdatePharmacy } from "../../UseCases/Pharmacies/UpdatePharmacy";
import { DeletePharmacy } from "../../UseCases/Pharmacies/DeletePharmacy";

export class PharmacyController {
  constructor(
    private getAllPharmacies: GetAllPharmacies,
    private createPharmacy: CreatePharmacy,
    private updatePharmacy: UpdatePharmacy,
    private deletePharmacy: DeletePharmacy
  ) {}

  async list(req: Request, res: Response) {
    try {
      const pharmacies = await this.getAllPharmacies.execute();
      return res.json(pharmacies);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Erro ao buscar farmácias." });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const created = await this.createPharmacy.execute(req.body);
      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao cadastrar farmácia." });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await this.updatePharmacy.execute(id, req.body);
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao atualizar farmácia." });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.deletePharmacy.execute(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao remover farmácia." });
    }
  }
}
