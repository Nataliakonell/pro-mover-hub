import { useState, useEffect } from "react";
import { loginApi } from "./api";

export type UserRole = string;

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  username?: string | null;
  role?: string;
}

const STORAGE_KEY_USER = "conecta_saude_user";
const STORAGE_KEY_TOKEN = "conecta_saude_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (!parsed.email && !parsed.username)) return null;
    return {
      id: parsed.id,
      name: parsed.name || "Usuário",
      email: parsed.email || "",
      username: parsed.username || null,
      role: parsed.role || "user",
    };
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  window.dispatchEvent(new Event("conecta_saude_auth_change"));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
  window.dispatchEvent(new Event("conecta_saude_auth_change"));
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getStoredToken());

    const handleAuthChange = () => {
      setUser(getStoredUser());
      setToken(getStoredToken());
    };

    window.addEventListener("conecta_saude_auth_change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("conecta_saude_auth_change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const login = async (identifier: string, passwordPlain: string): Promise<UserProfile> => {
    const res = await loginApi(identifier.trim().toLowerCase(), passwordPlain);
    saveAuthSession(res.token, res.user);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken(null);
  };

  return {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === "admin",
    login,
    logout,
  };
}
