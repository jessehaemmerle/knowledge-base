import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { migrate, seed } from "./db/database.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { pagesRouter } from "./routes/pages.js";
import { menuRouter } from "./routes/menu.js";
import { searchRouter } from "./routes/search.js";
import { auditRouter } from "./routes/audit.js";

migrate();
seed();

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/pages", pagesRouter);
app.use("/api/menu", menuRouter);
app.use("/api/search", searchRouter);
app.use("/api/audit", auditRouter);

const frontendDist = path.resolve(process.cwd(), "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));

app.listen(config.port, () => {
  console.log(`Modern Markdown Wiki listening on ${config.port}`);
});
