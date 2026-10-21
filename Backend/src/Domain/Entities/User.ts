export interface UserEntity {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  passwordHash: string;
  role: string;
  createdAt?: Date;
}
