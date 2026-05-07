import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 8080),
  appUrl: process.env.APP_URL ?? "http://localhost:8080",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  dataDir: process.env.DATA_DIR ?? path.resolve(process.cwd(), "data"),
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.local",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
  adminName: process.env.ADMIN_NAME ?? "Admin"
};

export const paths = {
  db: path.join(config.dataDir, "wiki.sqlite"),
  pages: path.join(config.dataDir, "pages"),
  versions: path.join(config.dataDir, "versions"),
  uploads: path.join(config.dataDir, "uploads")
};
