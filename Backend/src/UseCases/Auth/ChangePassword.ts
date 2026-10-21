import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export class ChangePassword {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: number, currentPasswordPlain: string, newPasswordPlain: string) {
    if (!newPasswordPlain || newPasswordPlain.trim().length < 6) {
      throw new Error("A nova senha deve possuir pelo menos 6 caracteres.");
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    // Valida a senha atual se fornecida
    if (currentPasswordPlain) {
      let isCurrentValid = false;
      try {
        isCurrentValid = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
      } catch {
        isCurrentValid = false;
      }
      if (!isCurrentValid && user.passwordHash === currentPasswordPlain) {
        isCurrentValid = true;
      }
      if (!isCurrentValid) {
        throw new Error("A senha atual informada está incorreta.");
      }
    }

    const newHash = await bcrypt.hash(newPasswordPlain.trim(), 10);
    await this.userRepo.updatePassword(userId, newHash);

    const updatedUser = await this.userRepo.findById(userId);

    const secret = process.env.JWT_SECRET || "promover_hub_secret_key_2026_super_safe";
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        groupId: user.groupId || null,
        pharmacyId: user.pharmacyId || null,
        mustChangePassword: false,
      },
      secret,
      { expiresIn: "7d" }
    );

    return {
      message: "Senha alterada com sucesso!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        groupId: user.groupId || null,
        pharmacyId: user.pharmacyId || null,
        mustChangePassword: false,
      },
    };
  }
}
