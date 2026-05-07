import { Router } from "express";
import { z } from "zod";
import { db, now } from "../db/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

export const menuRouter = Router();
menuRouter.use(requireAuth);

const menuSchema = z.object({
  parent_id: z.number().nullable().optional(),
  type: z.enum(["folder", "page", "external"]),
  title: z.string().min(1),
  page_id: z.number().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  icon: z.string().nullable().optional(),
  sort_order: z.number().optional()
});

function tree(rows: any[], parent: number | null = null): any[] {
  return rows
    .filter((item) => item.parent_id === parent)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({ ...item, children: tree(rows, item.id) }));
}

menuRouter.get("/", (_req, res) => {
  const rows = db.prepare(`
    SELECT m.*, p.slug FROM menu_items m LEFT JOIN pages p ON p.id=m.page_id ORDER BY sort_order ASC
  `).all();
  res.json({ menu: tree(rows) });
});

menuRouter.post("/", requireRole("admin", "editor"), (req, res) => {
  const parsed = menuSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Menuepunkt pruefen" });
  const time = now();
  const result = db.prepare(`
    INSERT INTO menu_items (parent_id, type, title, page_id, external_url, icon, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(parsed.data.parent_id ?? null, parsed.data.type, parsed.data.title, parsed.data.page_id ?? null, parsed.data.external_url ?? null, parsed.data.icon ?? null, parsed.data.sort_order ?? 0, time, time);
  const id = Number(result.lastInsertRowid);
  audit(req.user!.id, "menu_changed", "menu_item", id);
  res.status(201).json({ id });
});

menuRouter.patch("/:id", requireRole("admin", "editor"), (req, res) => {
  const parsed = menuSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Menuepunkt pruefen" });
  const current = db.prepare("SELECT * FROM menu_items WHERE id=?").get(req.params.id) as any;
  if (!current) return res.status(404).json({ message: "Menuepunkt nicht gefunden" });
  db.prepare(`
    UPDATE menu_items SET parent_id=?, type=?, title=?, page_id=?, external_url=?, icon=?, sort_order=?, updated_at=? WHERE id=?
  `).run(parsed.data.parent_id ?? current.parent_id, parsed.data.type ?? current.type, parsed.data.title ?? current.title, parsed.data.page_id ?? current.page_id, parsed.data.external_url ?? current.external_url, parsed.data.icon ?? current.icon, parsed.data.sort_order ?? current.sort_order, now(), req.params.id);
  audit(req.user!.id, "menu_changed", "menu_item", req.params.id);
  res.json({ ok: true });
});

menuRouter.delete("/:id", requireRole("admin", "editor"), (req, res) => {
  db.prepare("DELETE FROM menu_items WHERE id=?").run(req.params.id);
  audit(req.user!.id, "menu_changed", "menu_item", req.params.id);
  res.json({ ok: true });
});

menuRouter.post("/reorder", requireRole("admin", "editor"), (req, res) => {
  const items = z.array(z.object({ id: z.number(), parent_id: z.number().nullable(), sort_order: z.number() })).safeParse(req.body.items);
  if (!items.success) return res.status(400).json({ message: "Sortierung pruefen" });
  const update = db.prepare("UPDATE menu_items SET parent_id=?, sort_order=?, updated_at=? WHERE id=?");
  const tx = db.transaction(() => items.data.forEach((item) => update.run(item.parent_id, item.sort_order, now(), item.id)));
  tx();
  audit(req.user!.id, "menu_changed", "menu", "reorder");
  res.json({ ok: true });
});
