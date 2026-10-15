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
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      }

      const result = await this.loginUser.execute(email, password);
      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
      }

      const user = await this.registerUser.execute({ name, email, password, role });
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
