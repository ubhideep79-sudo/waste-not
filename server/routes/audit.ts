import { Router, Response } from "express";
import { AuditLog } from "../models/AuditLog.ts";
import { requireAuth, requireManager, AuthRequest } from "../middleware/auth.ts";

const router = Router();

router.use(requireAuth);
router.use(requireManager);

// GET /api/audit (List audit trail with pagination and filter)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { action, entityType, limit = 50, page = 1 } = req.query;

    const query: Record<string, any> = {};
    if (action && typeof action === "string" && action !== "All") {
      query.action = action;
    }
    if (entityType && typeof entityType === "string" && entityType !== "All") {
      query.entityType = entityType;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs.",
      error: err.message,
    });
  }
});

export default router;
