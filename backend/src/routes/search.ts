import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { readPageFile } from "../utils/pageFiles.js";

export const searchRouter = Router();
searchRouter.use(requireAuth);

searchRouter.get("/", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (!q) return res.json({ results: [] });
  const pages = db.prepare("SELECT * FROM pages WHERE status != 'archived' ORDER BY updated_at DESC").all() as any[];
  const results = pages
    .map((page) => {
      const content = readPageFile(page.file_path);
      const haystack = `${page.title} ${page.description ?? ""} ${page.tags} ${content}`.toLowerCase();
      const index = haystack.indexOf(q);
      if (index < 0) return null;
      const raw = content.replace(/\s+/g, " ");
      const contentIndex = raw.toLowerCase().indexOf(q);
      const snippet = contentIndex >= 0 ? raw.slice(Math.max(0, contentIndex - 80), contentIndex + 160) : page.description;
      return { id: page.id, title: page.title, slug: page.slug, description: page.description, tags: JSON.parse(page.tags || "[]"), snippet };
    })
    .filter(Boolean)
    .slice(0, 20);
  res.json({ results });
});
