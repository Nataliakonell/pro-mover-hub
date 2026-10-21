import { Response } from "express";
import { GetAllPharmacyGroups } from "../../UseCases/PharmacyGroups/GetAllPharmacyGroups";
import { CreatePharmacyGroup } from "../../UseCases/PharmacyGroups/CreatePharmacyGroup";
import { UpdatePharmacyGroup } from "../../UseCases/PharmacyGroups/UpdatePharmacyGroup";
import { DeletePharmacyGroup } from "../../UseCases/PharmacyGroups/DeletePharmacyGroup";
import { AuthenticatedRequest } from "../Middlewares/AuthMiddleware";

export class PharmacyGroupController {
  constructor(
    private getAllGroups: GetAllPharmacyGroups,
    private createGroup: CreatePharmacyGroup,
    private updateGroup: UpdatePharmacyGroup,
    private deleteGroup: DeletePharmacyGroup
  ) {}

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const groups = await this.getAllGroups.execute();

      // Regra de escopo:
      // Se for admin, vê todos os grupos.
      // Se for group_manager, vê apenas o grupo dele.
      if (req.user && req.user.role === "group_manager" && req.user.groupId) {
        const filtered = groups.filter((g) => g.id === req.user?.groupId);
        return res.json(filtered);
      }

      return res.json(groups);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, name, cnpj, responsible, phone, email } = req.body;
      const group = await this.createGroup.execute({ id, name, cnpj, responsible, phone, email });
      return res.status(201).json(group);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, cnpj, responsible, phone, email } = req.body;

      // Gestor só pode atualizar seu próprio grupo
      if (req.user && req.user.role === "group_manager" && req.user.groupId !== id) {
        return res.status(403).json({ error: "Permissão negada para alterar outro grupo de farmácias." });
      }

      const updated = await this.updateGroup.execute(id, { name, cnpj, responsible, phone, email });
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await this.deleteGroup.execute(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
