import fs from "node:fs";
import path from "node:path";
import { paths } from "../config.js";
import { assertSafeRelativePath, slugForPath } from "./slug.js";

export function pagePathForSlug(slug: string) {
  const relative = assertSafeRelativePath(`${slugForPath(slug)}.md`);
  return { relative, absolute: path.join(paths.pages, relative) };
}

export function readPageFile(relative: string) {
  const safe = assertSafeRelativePath(relative);
  const absolute = path.join(paths.pages, safe);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : "";
}

export function writePageFile(relative: string, content: string) {
  const safe = assertSafeRelativePath(relative);
  const absolute = path.join(paths.pages, safe);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
}

export function createVersion(slug: string, content: string) {
  const safeSlug = slugForPath(slug);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const relative = assertSafeRelativePath(`${safeSlug}/${stamp}.md`);
  const absolute = path.join(paths.versions, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
  return relative;
}

export function readVersion(relative: string) {
  const safe = assertSafeRelativePath(relative);
  return fs.readFileSync(path.join(paths.versions, safe), "utf8");
}
