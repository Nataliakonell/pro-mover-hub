import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "group_manager" | "pharmacy_user" | "client" | string;
  groupId?: string | null;
  pharmacyId?: string | null;
  mustChangePassword?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || "promover_hub_secret_key_2026_super_safe";
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Autenticação obrigatória para acessar este recurso." });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = req.user?.role?.toLowerCase();
  if (!role || (role !== "admin" && role !== "administrador")) {
    return res.status(403).json({ error: "Acesso restrito ao Administrador Geral do sistema." });
  }
  next();
}

export function requireGroupManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = req.user?.role?.toLowerCase();
  if (!role || (role !== "admin" && role !== "administrador" && role !== "group_manager")) {
    return res.status(403).json({ error: "Acesso restrito a Gestores de Grupo ou Administradores." });
  }
  next();
}

export function requirePharmacyAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = req.user?.role?.toLowerCase();
  if (!role || (role !== "admin" && role !== "administrador" && role !== "group_manager" && role !== "pharmacy_user")) {
    return res.status(403).json({ error: "Acesso restrito a usuários autorizados da farmácia ou grupo." });
  }
  next();
}
