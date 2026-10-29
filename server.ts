import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, isDbConnected } from "./server/config/db.ts";
import { seedDatabase } from "./server/utils/seed.ts";

import authRoutes from "./server/routes/auth.ts";
import userRoutes from "./server/routes/users.ts";
import ingredientRoutes from "./server/routes/ingredients.ts";
import wasteRoutes from "./server/routes/waste.ts";
import analyticsRoutes from "./server/routes/analytics.ts";
import settingsRoutes from "./server/routes/settings.ts";
import auditRoutes from "./server/routes/audit.ts";
import seedRoutes from "./server/routes/seed.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Waste Not, Want Not — Food Waste Control and Cost-Saving System",
    database: isDbConnected() ? "connected" : "connecting",
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/seed", seedRoutes);

// Global Error Handler for API
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error("[Server Error]", err);
  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((e: any) => e.message)
        .join(". "),
    });
    return;
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite middleware
    console.log("[Server] Initializing Vite dev middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[Server] Waste Not, Want Not is running on http://0.0.0.0:${PORT}`
    );
  });

  // Connect DB and seed in background
  connectDB()
    .then(async () => {
      console.log("[Server] Database connected.");
      if (process.env.SEED_DEMO !== "false") {
        await seedDatabase(false);
      }
    })
    .catch((err: any) => {
      console.error("[Server] Initial DB connection warning:", err.message);
    });
}

startServer();

export default app;
