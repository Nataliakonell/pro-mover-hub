import bcrypt from "bcryptjs";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export class RegisterUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: { name: string; email: string; username?: string; password: string; role?: string }) {
    const existingEmail = await this.userRepo.findByEmail(input.email);
    if (existingEmail) {
      throw new Error("E-mail já cadastrado.");
    }

    if (input.username) {
      const existingUser = await this.userRepo.findByUsername(input.username);
      if (existingUser) {
        throw new Error("Nome de usuário já está em uso.");
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const created = await this.userRepo.create({
      name: input.name,
      email: input.email,
      username: input.username,
      passwordHash,
      role: input.role || "user",
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      username: created.username,
      role: created.role,
    };
  }
}
