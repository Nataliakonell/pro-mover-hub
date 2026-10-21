import { Response } from "express";
import { GetAllPharmacies } from "../../UseCases/Pharmacies/GetAllPharmacies";
import { CreatePharmacy } from "../../UseCases/Pharmacies/CreatePharmacy";
import { UpdatePharmacy } from "../../UseCases/Pharmacies/UpdatePharmacy";
import { DeletePharmacy } from "../../UseCases/Pharmacies/DeletePharmacy";
import { AuthenticatedRequest } from "../Middlewares/AuthMiddleware";

export class PharmacyController {
  constructor(
    private getAllPharmacies: GetAllPharmacies,
    private createPharmacy: CreatePharmacy,
    private updatePharmacy: UpdatePharmacy,
    private deletePharmacy: DeletePharmacy
  ) {}

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacies = await this.getAllPharmacies.execute();

      // Regras de escopo multi-tenant
      if (req.user) {
        if (req.user.role === "admin") {
          return res.json(pharmacies);
        }
        if (req.user.role === "group_manager" && req.user.groupId) {
          const filtered = pharmacies.filter((p) => p.groupId === req.user?.groupId);
          return res.json(filtered);
        }
        if (req.user.role === "pharmacy_user" && req.user.pharmacyId) {
          const filtered = pharmacies.filter((p) => p.id === req.user?.pharmacyId);
          return res.json(filtered);
        }
      }

      return res.json(pharmacies);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Erro ao buscar farmácias." });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = { ...req.body };
      // Se for gestor de grupo, associa automaticamente a farmácia ao seu grupo
      if (req.user && req.user.role === "group_manager" && req.user.groupId) {
        data.groupId = req.user.groupId;
      }

      const created = await this.createPharmacy.execute(data);
      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao cadastrar farmácia." });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updated = await this.updatePharmacy.execute(id, req.body);
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao atualizar farmácia." });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await this.deletePharmacy.execute(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao remover farmácia." });
    }
  }
}
