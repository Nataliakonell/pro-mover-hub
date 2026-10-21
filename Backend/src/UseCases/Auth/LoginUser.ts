import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export class LoginUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(identifier: string, passwordPlain: string) {
    if (!identifier || !passwordPlain) {
      throw new Error("Identificador (nome de usuário ou e-mail) e senha são obrigatórios.");
    }

    const user = await this.userRepo.findByIdentifier(identifier);
    if (!user) {
      throw new Error("Credenciais inválidas. Verifique seu nome de usuário/e-mail e senha.");
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    } catch {
      isValid = false;
    }

    // Suporte caso a senha tenha sido inserida diretamente em texto puro no banco de dados via SQL manual
    if (!isValid && user.passwordHash === passwordPlain) {
      isValid = true;
    }

    if (!isValid) {
      throw new Error("Credenciais inválidas. Verifique seu nome de usuário/e-mail e senha.");
    }

    const secret = process.env.JWT_SECRET || "promover_hub_secret_key_2026_super_safe";
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }
}
