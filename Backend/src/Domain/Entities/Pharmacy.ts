export interface PharmacyEntity {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email?: string | null;
  responsible: string;
  crf?: string | null;
  address: string;
  neighborhood: string;
  city: string;
  status: string;
  notes?: string | null;
  groupId?: string | null;
  group?: {
    id: string;
    name: string;
  } | null;
  createdAt?: Date;
  events?: any[];
}
