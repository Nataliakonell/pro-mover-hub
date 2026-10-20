import { useState, useEffect } from "react";

export type UserRole = "admin" | "fisioterapeuta" | "avaliador" | "recepcao";

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
}

const DEFAULT_USER: UserProfile = {
  name: "Natália",
  email: "natalia@conectasaude.org",
  role: "admin",
};

const STORAGE_KEY = "pro_mover_user";

export function getStoredUser(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || DEFAULT_USER.name,
      email: parsed.email || DEFAULT_USER.email,
      role: parsed.role || DEFAULT_USER.role,
    };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveStoredUser(user: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("pro_mover_auth_change"));
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);

  useEffect(() => {
    setUser(getStoredUser());
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };
    window.addEventListener("pro_mover_auth_change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("pro_mover_auth_change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const setRole = (role: UserRole) => {
    const updated = { ...user, role };
    saveStoredUser(updated);
  };

  return {
    user,
    setRole,
    isAdmin: user.role === "admin",
  };
}
