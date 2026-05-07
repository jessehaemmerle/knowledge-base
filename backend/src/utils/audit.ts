import { db, now } from "../db/database.js";

export function audit(userId: number | null, action: string, entityType: string, entityId?: string | number, details?: unknown) {
  db.prepare(`
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, action, entityType, entityId ? String(entityId) : null, details ? JSON.stringify(details) : null, now());
}
