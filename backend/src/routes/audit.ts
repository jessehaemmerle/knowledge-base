import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const auditRouter = Router();
auditRouter.use(requireAuth, requireRole("admin"));

auditRouter.get("/", (_req, res) => {
  const entries = db.prepare(`
    SELECT a.*, u.email, u.name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id
    ORDER BY a.created_at DESC LIMIT 300
  `).all();
  res.json({ entries });
});
