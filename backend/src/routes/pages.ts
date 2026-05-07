import { Router } from "express";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { db, now } from "../db/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { createVersion, pagePathForSlug, readPageFile, readVersion, writePageFile } from "../utils/pageFiles.js";
import { slugForPath } from "../utils/slug.js";

export const pagesRouter = Router();
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  visibility: z.enum(["authenticated", "admin", "editor"]).default("authenticated"),
  tags: z.array(z.string()).default([]),
  content: z.string().default(""),
  changeNote: z.string().optional()
});

function normalizePage(row: any, includeContent = false) {
  return {
    ...row,
    tags: JSON.parse(row.tags || "[]"),
    content: includeContent ? readPageFile(row.file_path) : undefined
  };
}

pagesRouter.use(requireAuth);

pagesRouter.get("/", (_req, res) => {
  const pages = db.prepare("SELECT * FROM pages WHERE status != 'archived' ORDER BY updated_at DESC").all().map((row) => normalizePage(row));
  res.json({ pages });
});

pagesRouter.post("/", requireRole("admin", "editor"), (req, res) => {
  const parsed = pageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Seitendaten pruefen" });
  const slug = slugForPath(parsed.data.slug);
  const file = pagePathForSlug(slug);
  const time = now();
  writePageFile(file.relative, parsed.data.content);
  const result = db.prepare(`
    INSERT INTO pages (title, slug, file_path, description, status, visibility, tags, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(parsed.data.title, slug, file.relative, parsed.data.description, parsed.data.status, parsed.data.visibility, JSON.stringify(parsed.data.tags), req.user!.id, req.user!.id, time, time);
  const pageId = Number(result.lastInsertRowid);
  const versionPath = createVersion(slug, parsed.data.content);
  db.prepare("INSERT INTO page_versions (page_id, version_file_path, created_by, change_note, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(pageId, versionPath, req.user!.id, parsed.data.changeNote ?? "Erstellt", time);
  audit(req.user!.id, "page_created", "page", pageId, { slug });
  res.status(201).json({ slug });
});

pagesRouter.get("/:slug(*)/versions", (req, res) => {
  const page = db.prepare("SELECT id FROM pages WHERE slug=?").get(req.params.slug) as { id: number } | undefined;
  if (!page) return res.status(404).json({ message: "Seite nicht gefunden" });
  const versions = db.prepare(`
    SELECT v.*, u.name as author FROM page_versions v LEFT JOIN users u ON u.id=v.created_by
    WHERE page_id=? ORDER BY created_at DESC
  `).all(page.id);
  res.json({ versions });
});

pagesRouter.post("/:slug(*)/restore/:versionId", requireRole("admin", "editor"), (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug=?").get(req.params.slug) as any;
  const version = db.prepare("SELECT * FROM page_versions WHERE id=? AND page_id=?").get(req.params.versionId, page?.id) as any;
  if (!page || !version) return res.status(404).json({ message: "Version nicht gefunden" });
  const content = readVersion(version.version_file_path);
  writePageFile(page.file_path, content);
  audit(req.user!.id, "version_restored", "page", page.id, { versionId: req.params.versionId });
  res.json({ ok: true });
});

pagesRouter.get("/:slug(*)", (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug=?").get(req.params.slug);
  if (!page) return res.status(404).json({ message: "Seite nicht gefunden" });
  const normalized = normalizePage(page, true);
  const html = sanitizeHtml(md.render(normalized.content), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "table", "thead", "tbody", "tr", "th", "td", "input"]),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt"], a: ["href", "name", "target", "rel"], input: ["type", "checked", "disabled"] }
  });
  res.json({ page: normalized, html });
});

pagesRouter.patch("/:slug(*)", requireRole("admin", "editor"), (req, res) => {
  const current = db.prepare("SELECT * FROM pages WHERE slug=?").get(req.params.slug) as any;
  if (!current) return res.status(404).json({ message: "Seite nicht gefunden" });
  const parsed = pageSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Seitendaten pruefen" });
  const nextSlug = parsed.data.slug ? slugForPath(parsed.data.slug) : current.slug;
  const file = pagePathForSlug(nextSlug);
  const content = parsed.data.content ?? readPageFile(current.file_path);
  writePageFile(file.relative, content);
  const time = now();
  db.prepare(`
    UPDATE pages SET title=?, slug=?, file_path=?, description=?, status=?, visibility=?, tags=?, updated_by=?, updated_at=?
    WHERE id=?
  `).run(
    parsed.data.title ?? current.title,
    nextSlug,
    file.relative,
    parsed.data.description ?? current.description,
    parsed.data.status ?? current.status,
    parsed.data.visibility ?? current.visibility,
    JSON.stringify(parsed.data.tags ?? JSON.parse(current.tags || "[]")),
    req.user!.id,
    time,
    current.id
  );
  const versionPath = createVersion(nextSlug, content);
  db.prepare("INSERT INTO page_versions (page_id, version_file_path, created_by, change_note, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(current.id, versionPath, req.user!.id, parsed.data.changeNote ?? "Gespeichert", time);
  audit(req.user!.id, parsed.data.status === "published" ? "page_published" : "page_updated", "page", current.id, { slug: nextSlug });
  res.json({ slug: nextSlug });
});

pagesRouter.delete("/:slug(*)", requireRole("admin", "editor"), (req, res) => {
  const page = db.prepare("SELECT id FROM pages WHERE slug=?").get(req.params.slug) as { id: number } | undefined;
  if (!page) return res.status(404).json({ message: "Seite nicht gefunden" });
  db.prepare("UPDATE pages SET status='archived', updated_by=?, updated_at=? WHERE id=?").run(req.user!.id, now(), page.id);
  audit(req.user!.id, "page_deleted", "page", page.id);
  res.json({ ok: true });
});
