export type UserRole = "admin" | "group_manager" | "pharmacy_user" | "client";

export interface UserEntity {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  passwordHash: string;
  role: UserRole | string;
  groupId?: string | null;
  pharmacyId?: string | null;
  mustChangePassword: boolean;
  createdAt?: Date;
  group?: {
    id: string;
    name: string;
  } | null;
  pharmacy?: {
    id: string;
    name: string;
  } | null;
}
