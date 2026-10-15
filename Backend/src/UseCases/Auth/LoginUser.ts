import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export class LoginUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, passwordPlain: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error("Credenciais inválidas.");
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      throw new Error("Credenciais inválidas.");
    }

    const secret = process.env.JWT_SECRET || "promover_hub_secret_key_2026_super_safe";
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
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
        role: user.role,
      },
    };
  }
}
