import { useState, useEffect } from "react";

export type UserRole = string;

export interface UserProfile {
  name: string;
  email: string;
  role?: string;
}

const DEFAULT_USER: UserProfile = {
  name: "Usuário",
  email: "",
};

const STORAGE_KEY = "conecta_saude_user";

export function getStoredUser(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || DEFAULT_USER.name,
      email: parsed.email || DEFAULT_USER.email,
      role: parsed.role,
    };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveStoredUser(user: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("conecta_saude_auth_change"));
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);

  useEffect(() => {
    setUser(getStoredUser());
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };
    window.addEventListener("conecta_saude_auth_change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("conecta_saude_auth_change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const updateUser = (updated: UserProfile) => {
    saveStoredUser(updated);
    setUser(updated);
  };

  return {
    user,
    updateUser,
    isAdmin: true, // Aberto até a implementação da autenticação definitiva
  };
}
