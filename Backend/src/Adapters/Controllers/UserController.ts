import { Response } from "express";
import { GetAllUsers } from "../../UseCases/Users/GetAllUsers";
import { CreateUser } from "../../UseCases/Users/CreateUser";
import { DeleteUser } from "../../UseCases/Users/DeleteUser";
import { AuthenticatedRequest } from "../Middlewares/AuthMiddleware";

export class UserController {
  constructor(
    private getAllUsersUseCase: GetAllUsers,
    private createUserUseCase: CreateUser,
    private deleteUserUseCase: DeleteUser
  ) {}

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Autenticação obrigatória." });
      }

      const users = await this.getAllUsersUseCase.execute({
        id: req.user.id,
        role: req.user.role,
        groupId: req.user.groupId,
        pharmacyId: req.user.pharmacyId,
      });

      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Autenticação obrigatória." });
      }

      const { name, email, username, password, role, groupId, pharmacyId } = req.body;

      const result = await this.createUserUseCase.execute(
        {
          name,
          email,
          username,
          password,
          role,
          groupId,
          pharmacyId,
        },
        {
          id: req.user.id,
          role: req.user.role,
          groupId: req.user.groupId,
          pharmacyId: req.user.pharmacyId,
        }
      );

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Autenticação obrigatória." });
      }

      const targetId = parseInt(req.params.id, 10);
      if (isNaN(targetId)) {
        return res.status(400).json({ error: "ID de usuário inválido." });
      }

      await this.deleteUserUseCase.execute(targetId, {
        id: req.user.id,
        role: req.user.role,
        groupId: req.user.groupId,
        pharmacyId: req.user.pharmacyId,
      });

      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
