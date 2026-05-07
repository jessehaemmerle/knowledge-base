import path from "node:path";
import slugify from "slugify";

export function slugForPath(input: string) {
  return input
    .split("/")
    .map((part) => slugify(part, { lower: true, strict: true, trim: true }) || "seite")
    .join("/");
}

export function assertSafeRelativePath(relativePath: string) {
  const normalized = path.posix.normalize(relativePath).replace(/^\/+/, "");
  if (normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error("Unsafe path");
  }
  return normalized;
}
