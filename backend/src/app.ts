import path from "path";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { notFoundMiddleware } from "./common/middleware/notFound.middleware";
import { errorMiddleware } from "./common/middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import tabsRoutes from "./modules/tabs/tabs.routes";
import sectionsRoutes from "./modules/tabs/sections.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";
import publicRoutes from "./modules/public/public.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
    })
  );
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/admin/tabs", tabsRoutes);
  app.use("/api/admin/sections", sectionsRoutes);
  app.use("/api/admin/documents", documentsRoutes);
  app.use("/api/admin/uploads", uploadsRoutes);
  app.use("/api/public", publicRoutes);

  if (env.nodeEnv !== "production") {
    // In production, Vercel serves the static frontend (including /admin) directly and
    // only proxies /api to this server. Locally there's no Vercel in front, so this
    // server also serves the frontend directly, giving one origin for everything
    // (mirrors the production rewrite setup) instead of needing a separate static
    // server + CORS for local testing.
    app.use(express.static(path.join(__dirname, "..", "..", "Avance")));
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
