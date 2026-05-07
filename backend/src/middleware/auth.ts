import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { config } from "../config.js";
import { db } from "../db/database.js";

export type Role = "admin" | "editor" | "viewer";
export type AuthUser = { id: number; email: string; name: string; role: Role; active: number };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ message: "Nicht angemeldet" });
  try {
    const payload: string | JwtPayload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "string") return res.status(401).json({ message: "Session ist ungueltig" });
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) return res.status(401).json({ message: "Session ist ungueltig" });
    const user = db.prepare("SELECT id, email, name, role, active FROM users WHERE id=?").get(userId) as AuthUser | undefined;
    if (!user || !user.active) return res.status(401).json({ message: "Benutzer ist nicht aktiv" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Session ist ungueltig" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Keine Berechtigung" });
    }
    next();
  };
}
