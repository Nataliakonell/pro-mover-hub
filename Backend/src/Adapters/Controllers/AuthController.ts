import { Request, Response } from "express";
import { LoginUser } from "../../UseCases/Auth/LoginUser";
import { RegisterUser } from "../../UseCases/Auth/RegisterUser";

export class AuthController {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser
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
      const { name, email, username, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
      }

      const user = await this.registerUser.execute({ name, email, username, password, role });
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
