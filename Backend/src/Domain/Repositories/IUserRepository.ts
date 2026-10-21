import { UserEntity } from "../Entities/User";

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findByIdentifier(identifier: string): Promise<UserEntity | null>;
  create(data: Omit<UserEntity, "id" | "createdAt">): Promise<UserEntity>;
}
