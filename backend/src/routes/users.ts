import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, now } from "../db/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

export const usersRouter = Router();
usersRouter.use(requireAuth, requireRole("admin"));

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
  role: z.enum(["admin", "editor", "viewer"]),
  active: z.boolean().optional()
});

usersRouter.get("/", (_req, res) => {
  const users = db.prepare("SELECT id, email, name, role, active, created_at, updated_at FROM users ORDER BY created_at DESC").all();
  res.json({ users });
});

usersRouter.post("/", (req, res) => {
  const parsed = userSchema.required({ password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ungueltige Benutzerdaten" });
  const time = now();
  const result = db.prepare(`
    INSERT INTO users (email, name, password_hash, role, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(parsed.data.email, parsed.data.name, bcrypt.hashSync(parsed.data.password, 12), parsed.data.role, parsed.data.active === false ? 0 : 1, time, time);
  const id = Number(result.lastInsertRowid);
  audit(req.user!.id, "user_created", "user", id, { email: parsed.data.email });
  res.status(201).json({ id });
});

usersRouter.get("/:id", (req, res) => {
  const user = db.prepare("SELECT id, email, name, role, active, created_at, updated_at FROM users WHERE id=?").get(req.params.id);
  if (!user) return res.status(404).json({ message: "Benutzer nicht gefunden" });
  res.json({ user });
});

usersRouter.patch("/:id", (req, res) => {
  const parsed = userSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ungueltige Benutzerdaten" });
  const current = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id) as Record<string, unknown> | undefined;
  if (!current) return res.status(404).json({ message: "Benutzer nicht gefunden" });
  const next = { ...current, ...parsed.data, active: parsed.data.active === undefined ? current.active : parsed.data.active ? 1 : 0 };
  const hash = parsed.data.password ? bcrypt.hashSync(parsed.data.password, 12) : current.password_hash;
  db.prepare("UPDATE users SET email=?, name=?, password_hash=?, role=?, active=?, updated_at=? WHERE id=?")
    .run(next.email, next.name, hash, next.role, next.active, now(), req.params.id);
  audit(req.user!.id, "user_updated", "user", req.params.id);
  res.json({ ok: true });
});

usersRouter.delete("/:id", (req, res) => {
  db.prepare("UPDATE users SET active=0, updated_at=? WHERE id=?").run(now(), req.params.id);
  audit(req.user!.id, "user_disabled", "user", req.params.id);
  res.json({ ok: true });
});
