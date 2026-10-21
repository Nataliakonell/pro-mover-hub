import bcrypt from "bcryptjs";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { generateRandomPassword } from "../../Infrastructure/Security/PasswordGenerator";

export interface RegisterUserInput {
  name: string;
  email: string;
  username?: string;
  password?: string;
  role?: string;
  groupId?: string | null;
  pharmacyId?: string | null;
  mustChangePassword?: boolean;
}

export class RegisterUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: RegisterUserInput) {
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

    // Se a senha não for fornecida, gera uma senha temporária aleatória segura
    const rawPassword = input.password && input.password.trim().length >= 4
      ? input.password.trim()
      : generateRandomPassword(10);

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const mustChange = input.mustChangePassword !== undefined ? input.mustChangePassword : true;

    const created = await this.userRepo.create({
      name: input.name,
      email: input.email,
      username: input.username,
      passwordHash,
      role: input.role || "pharmacy_user",
      groupId: input.groupId || null,
      pharmacyId: input.pharmacyId || null,
      mustChangePassword: mustChange,
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      username: created.username,
      role: created.role,
      groupId: created.groupId,
      pharmacyId: created.pharmacyId,
      mustChangePassword: created.mustChangePassword,
      temporaryPassword: rawPassword,
    };
  }
}
