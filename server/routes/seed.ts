import { Router, Response } from "express";
import { seedDatabase } from "../utils/seed.ts";
import { requireAuth, requireManager, AuthRequest } from "../middleware/auth.ts";

const router = Router();

// Reset/re-seed database
router.post("/reset", requireAuth, requireManager, async (_req: AuthRequest, res: Response) => {
  try {
    await seedDatabase(true);
    res.json({
      success: true,
      message: "Database has been reset and reseeded with realistic hotel kitchen demo data.",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to reset demo data.",
      error: err.message,
    });
  }
});

export default router;
