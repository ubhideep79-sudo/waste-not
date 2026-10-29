import { Router, Response } from "express";
import { AppSetting } from "../models/AppSetting.ts";
import { requireAuth, requireManager, AuthRequest } from "../middleware/auth.ts";
import { AuditLog } from "../models/AuditLog.ts";

const router = Router();

router.use(requireAuth);

// GET /api/settings
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    let settings = await AppSetting.findOne();
    if (!settings) {
      settings = await AppSetting.create({
        hotelName: "The Grand Horizon Palace & Convention Centre",
        hotelLocation: "New Delhi / Mumbai",
        currency: "INR",
        currencySymbol: "₹",
        monthlyWasteBudgetINR: 75000,
        costReductionGoalPercent: 18,
        autoDeductInventory: true,
        allowStaffEditHours: 24,
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings.",
      error: err.message,
    });
  }
});

// PUT /api/settings (Manager only)
router.put("/", requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const {
      hotelName,
      hotelLocation,
      monthlyWasteBudgetINR,
      costReductionGoalPercent,
      autoDeductInventory,
      allowStaffEditHours,
    } = req.body;

    let settings = await AppSetting.findOne();
    if (!settings) {
      settings = new AppSetting();
    }

    if (hotelName) settings.hotelName = hotelName.trim();
    if (hotelLocation) settings.hotelLocation = hotelLocation.trim();
    if (monthlyWasteBudgetINR !== undefined) {
      settings.monthlyWasteBudgetINR = Math.max(1000, Number(monthlyWasteBudgetINR));
    }
    if (costReductionGoalPercent !== undefined) {
      settings.costReductionGoalPercent = Math.min(
        90,
        Math.max(1, Number(costReductionGoalPercent))
      );
    }
    if (typeof autoDeductInventory === "boolean") {
      settings.autoDeductInventory = autoDeductInventory;
    }
    if (allowStaffEditHours !== undefined) {
      settings.allowStaffEditHours = Math.max(1, Number(allowStaffEditHours));
    }

    settings.updatedBy = req.user?.name || "Manager";
    await settings.save();

    await AuditLog.create({
      action: "BUDGET_UPDATE",
      entityType: "AppSetting",
      entityId: settings._id.toString(),
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Updated hotel waste settings: Monthly budget set to ₹${settings.monthlyWasteBudgetINR}, target reduction goal ${settings.costReductionGoalPercent}%.`,
    }).catch(() => {});

    res.json({
      success: true,
      message: "Hotel kitchen settings updated successfully.",
      settings,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update settings.",
      error: err.message,
    });
  }
});

export default router;
