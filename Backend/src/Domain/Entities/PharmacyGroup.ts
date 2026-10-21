export interface PharmacyGroupEntity {
  id: string;
  name: string;
  cnpj?: string | null;
  responsible?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: Date;
}
