import bcrypt from "bcryptjs";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export class RegisterUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: { name: string; email: string; password: string; role?: string }) {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error("E-mail já cadastrado.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const created = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role || "user",
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
    };
  }
}
