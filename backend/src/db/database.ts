import fs from "node:fs";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { config, paths } from "../config.js";
import { slugForPath } from "../utils/slug.js";

fs.mkdirSync(paths.pages, { recursive: true });
fs.mkdirSync(paths.versions, { recursive: true });
fs.mkdirSync(paths.uploads, { recursive: true });

export const db = new Database(paths.db);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','editor','viewer')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      visibility TEXT NOT NULL DEFAULT 'authenticated',
      tags TEXT NOT NULL DEFAULT '[]',
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS page_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      version_file_path TEXT NOT NULL,
      created_by INTEGER,
      change_note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('folder','page','external')),
      title TEXT NOT NULL,
      page_id INTEGER,
      external_url TEXT,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}

export function now() {
  return new Date().toISOString();
}

export function seed() {
  const createdAt = now();
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    db.prepare(`
      INSERT INTO users (email, name, password_hash, role, active, created_at, updated_at)
      VALUES (?, ?, ?, 'admin', 1, ?, ?)
    `).run(config.adminEmail, config.adminName, bcrypt.hashSync(config.adminPassword, 12), createdAt, createdAt);
  }

  const pageCount = db.prepare("SELECT COUNT(*) as count FROM pages").get() as { count: number };
  if (pageCount.count > 0) return;

  const admin = db.prepare("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1").get() as { id: number };
  const samples = [
    {
      title: "Startseite",
      slug: "startseite",
      description: "Willkommen in deinem modernen Markdown-Wiki.",
      tags: ["welcome", "wiki"],
      body: "# Willkommen im Wiki\n\nDies ist deine Startseite. Bearbeite Seiten visuell im Editor, waehle interne Links ueber `[[` und speichere alles als Markdown-Dateien.\n\n## Schnellstart\n\n- Erstelle Seiten ueber den Button **Neue Seite**.\n- Verlinke Inhalte mit normalen Markdown-Links oder Wiki-Links.\n- Nutze die Suche mit `Ctrl + K`.\n"
    },
    { title: "Erste Schritte", slug: "erste-schritte", description: "Die wichtigsten ersten Schritte.", tags: ["hilfe"], body: "# Erste Schritte\n\nLege eine Struktur in der linken Navigation an und beginne mit kurzen, gut lesbaren Artikeln.\n" },
    { title: "IT-Dokumentation", slug: "it/dokumentation", description: "Beispielbereich fuer IT-Wissen.", tags: ["it"], body: "# IT-Dokumentation\n\nHier koennen Netzwerk, Server, Anwendungen und Betrieb beschrieben werden.\n" },
    { title: "Prozesse", slug: "prozesse", description: "Wiederkehrende Ablaeufe.", tags: ["prozesse"], body: "# Prozesse\n\nDokumentiere Onboarding, Offboarding und Standardablaeufe.\n" },
    { title: "Richtlinien", slug: "richtlinien", description: "Interne Regeln und Leitlinien.", tags: ["richtlinien"], body: "# Richtlinien\n\nHalte Sicherheits- und Arbeitsrichtlinien zentral auffindbar.\n" }
  ];

  const insertPage = db.prepare(`
    INSERT INTO pages (title, slug, file_path, description, status, visibility, tags, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'published', 'authenticated', ?, ?, ?, ?, ?)
  `);
  const insertMenu = db.prepare(`
    INSERT INTO menu_items (parent_id, type, title, page_id, sort_order, created_at, updated_at)
    VALUES (NULL, 'page', ?, ?, ?, ?, ?)
  `);

  samples.forEach((sample, index) => {
    const relative = `${slugForPath(sample.slug)}.md`;
    const absolute = `${paths.pages}/${relative}`;
    fs.mkdirSync(absolute.slice(0, absolute.lastIndexOf("/")), { recursive: true });
    fs.writeFileSync(absolute, sample.body, "utf8");
    const result = insertPage.run(sample.title, sample.slug, relative, sample.description, JSON.stringify(sample.tags), admin.id, admin.id, createdAt, createdAt);
    insertMenu.run(sample.title, Number(result.lastInsertRowid), index, createdAt, createdAt);
  });
}
