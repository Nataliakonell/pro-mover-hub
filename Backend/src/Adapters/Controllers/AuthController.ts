import { Request, Response } from "express";
import { LoginUser } from "../../UseCases/Auth/LoginUser";
import { RegisterUser } from "../../UseCases/Auth/RegisterUser";
import { ChangePassword } from "../../UseCases/Auth/ChangePassword";
import { AuthenticatedRequest } from "../Middlewares/AuthMiddleware";

export class AuthController {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser,
    private changePasswordUseCase: ChangePassword
  ) {}

  async login(req: Request, res: Response) {
    try {
      const { email, username, identifier, password } = req.body;
      const userIdentifier = identifier || username || email;

      if (!userIdentifier || !password) {
        return res.status(400).json({ error: "Nome de usuário/e-mail e senha são obrigatórios." });
      }

      const result = await this.loginUser.execute(userIdentifier, password);
      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { name, email, username, password, role, groupId, pharmacyId, mustChangePassword } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
      }

      const result = await this.registerUser.execute({
        name,
        email,
        username,
        password,
        role,
        groupId,
        pharmacyId,
        mustChangePassword,
      });
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ error: "A nova senha deve possuir pelo menos 6 caracteres." });
      }

      const result = await this.changePasswordUseCase.execute(req.user.id, currentPassword, newPassword);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
