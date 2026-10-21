import { UserEntity } from "../Entities/User";

export interface UserFilter {
  groupId?: string | null;
  pharmacyId?: string | null;
}

export interface IUserRepository {
  findAll(filter?: UserFilter): Promise<UserEntity[]>;
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findByIdentifier(identifier: string): Promise<UserEntity | null>;
  create(data: Omit<UserEntity, "id" | "createdAt" | "group" | "pharmacy">): Promise<UserEntity>;
  update(id: number, data: Partial<Omit<UserEntity, "id" | "createdAt" | "group" | "pharmacy">>): Promise<UserEntity>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
  delete(id: number): Promise<void>;
}
