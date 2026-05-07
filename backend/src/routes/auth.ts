import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db/database.js";
import { requireAuth, signToken, type AuthUser } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

export const authRouter = Router();
const loginLimiter = rateLimit({ windowMs: 60_000, max: 8 });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post("/login", loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "E-Mail und Passwort pruefen" });
  const user = db.prepare("SELECT id, email, name, password_hash, role, active FROM users WHERE email=?").get(parsed.data.email) as (AuthUser & { password_hash: string }) | undefined;
  if (!user || !user.active || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ message: "Login fehlgeschlagen" });
  }
  audit(user.id, "login", "user", user.id);
  res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

authRouter.post("/logout", requireAuth, (req, res) => {
  audit(req.user!.id, "logout", "user", req.user!.id);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
