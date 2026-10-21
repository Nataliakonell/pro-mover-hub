import { useState, useEffect } from "react";
import {
  getPharmaciesApi,
  createPharmacyApi,
  updatePharmacyApi,
  deletePharmacyApi,
} from "./api";

export interface LinkedPharmacy {
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
  status: "Ativa" | "Inativa" | "Pendente";
  createdAt: string;
  notes?: string | null;
  events?: any[];
}

const STORAGE_KEY = "pro_mover_linked_pharmacies_db";

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

export function getStoredPharmacies(): LinkedPharmacy[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredPharmacies(pharmacies: LinkedPharmacy[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pharmacies));
  window.dispatchEvent(new Event("pro_mover_pharmacies_change"));
}

export function usePharmacies() {
  const [pharmacies, setPharmacies] = useState<LinkedPharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPharmacies = async () => {
    try {
      const data = await getPharmaciesApi();
      if (Array.isArray(data)) {
        setPharmacies(data);
        saveStoredPharmacies(data);
      }
    } catch (err: any) {
      console.warn("Falha ao buscar farmácias do PostgreSQL:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getStoredPharmacies();
    if (cached.length > 0) {
      setPharmacies(cached);
    }
    refreshPharmacies();

    const handleChange = () => {
      setPharmacies(getStoredPharmacies());
    };

    window.addEventListener("pro_mover_pharmacies_change", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener("pro_mover_pharmacies_change", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const addPharmacy = async (data: Omit<LinkedPharmacy, "id" | "createdAt">): Promise<LinkedPharmacy | null> => {
    try {
      const created = await createPharmacyApi(data);
      await refreshPharmacies();
      return created;
    } catch (err: any) {
      console.error("Erro ao salvar farmácia no PostgreSQL:", err.message);
      throw err;
    }
  };

  const updatePharmacy = async (id: string, updates: Partial<LinkedPharmacy>) => {
    try {
      await updatePharmacyApi(id, updates);
      await refreshPharmacies();
    } catch (err: any) {
      console.error("Erro ao atualizar farmácia no PostgreSQL:", err.message);
      throw err;
    }
  };

  const removePharmacy = async (id: string) => {
    try {
      await deletePharmacyApi(id);
      await refreshPharmacies();
    } catch (err: any) {
      console.error("Erro ao remover farmácia no PostgreSQL:", err.message);
      throw err;
    }
  };

  return {
    pharmacies,
    loading,
    refreshPharmacies,
    addPharmacy,
    updatePharmacy,
    removePharmacy,
  };
}
