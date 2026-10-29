import { Router, Response } from "express";
import { WasteRecord } from "../models/WasteRecord.ts";
import { Ingredient } from "../models/Ingredient.ts";
import { AppSetting } from "../models/AppSetting.ts";
import { requireAuth, requireManager, AuthRequest } from "../middleware/auth.ts";
import { AuditLog } from "../models/AuditLog.ts";

const router = Router();

// All waste routes require login
router.use(requireAuth);

// GET /api/waste
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      reason,
      kitchenStation,
      ingredientId,
      myEntriesOnly,
      limit = 100,
      page = 1,
    } = req.query;

    const query: Record<string, any> = {};

    // Date range filter
    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate && typeof startDate === "string") {
        query.recordDate.$gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        // End of that day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.recordDate.$lte = end;
      }
    }

    if (reason && typeof reason === "string" && reason !== "All") {
      query.reason = reason;
    }

    if (kitchenStation && typeof kitchenStation === "string" && kitchenStation !== "All") {
      query.kitchenStation = kitchenStation;
    }

    if (ingredientId && typeof ingredientId === "string" && ingredientId !== "All") {
      query.ingredient = ingredientId;
    }

    // Staff filtering: if myEntriesOnly or if requested by staff
    if (myEntriesOnly === "true") {
      query.recordedBy = req.user?.userId;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [totalRecords, records] = await Promise.all([
      WasteRecord.countDocuments(query),
      WasteRecord.find(query)
        .sort({ recordDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("ingredient", "name category unit costPerUnit availableQuantity"),
    ]);

    // Aggregate summary for the filtered query
    const stats = await WasteRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCostINR: { $sum: "$totalCost" },
          totalWeightKg: { $sum: "$normalizedKg" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = stats[0] || {
      totalCostINR: 0,
      totalWeightKg: 0,
      count: 0,
    };

    res.json({
      success: true,
      count: records.length,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      currentPage: pageNum,
      summary: {
        totalCostINR: Math.round(summary.totalCostINR),
        totalWeightKg: Number(summary.totalWeightKg.toFixed(2)),
        recordCount: summary.count,
      },
      records,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch waste records.",
      error: err.message,
    });
  }
});

// GET /api/waste/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const record = await WasteRecord.findById(req.params.id).populate(
      "ingredient",
      "name category unit costPerUnit availableQuantity"
    );

    if (!record) {
      res.status(404).json({
        success: false,
        message: "Waste record not found.",
      });
      return;
    }

    res.json({
      success: true,
      record,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch waste record.",
      error: err.message,
    });
  }
});

// POST /api/waste (Create new waste record)
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      ingredientId,
      quantity,
      unit,
      reason,
      kitchenStation,
      shift,
      recordDate,
      notes,
      deductFromStock,
    } = req.body;

    if (!ingredientId || !quantity || !reason) {
      res.status(400).json({
        success: false,
        message: "Ingredient, quantity, and waste reason are required.",
      });
      return;
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      res.status(400).json({
        success: false,
        message: "Waste quantity must be a positive number.",
      });
      return;
    }

    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      res.status(404).json({
        success: false,
        message: "Selected ingredient does not exist.",
      });
      return;
    }

    // Prevent duplicate rapid submissions (same user, ingredient, quantity within 15 seconds)
    const fifteenSecAgo = new Date(Date.now() - 15000);
    const duplicate = await WasteRecord.findOne({
      recordedBy: req.user?.userId,
      ingredient: ingredient._id,
      quantity: numQty,
      createdAt: { $gte: fifteenSecAgo },
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        message:
          "Duplicate submission detected. An identical waste entry was just recorded a few seconds ago.",
        code: "DUPLICATE_ENTRY",
      });
      return;
    }

    // Determine unit and unit cost
    const effectiveUnit = unit || ingredient.unit;
    const costPerUnit = ingredient.costPerUnit;

    // Unit conversion calculation:
    // If ingredient is in kg but logged in g: qty / 1000
    // If ingredient is in litre but logged in ml: qty / 1000
    let unitMultiplier = 1;
    if (ingredient.unit === "kg" && effectiveUnit === "g") {
      unitMultiplier = 0.001;
    } else if (ingredient.unit === "g" && effectiveUnit === "kg") {
      unitMultiplier = 1000;
    } else if (ingredient.unit === "litre" && effectiveUnit === "ml") {
      unitMultiplier = 0.001;
    } else if (ingredient.unit === "ml" && effectiveUnit === "litre") {
      unitMultiplier = 1000;
    }

    const calculatedTotalCost = Math.round(
      numQty * unitMultiplier * costPerUnit * 100
    ) / 100;

    let normalizedKg = numQty;
    if (effectiveUnit === "g" || effectiveUnit === "ml") {
      normalizedKg = numQty / 1000;
    } else if (effectiveUnit === "pieces") {
      normalizedKg = numQty * 0.08;
    }

    // Inventory Stock deduction workflow (Explicit and Documented)
    let stockDeducted = false;
    let previousStock = ingredient.availableQuantity;
    let newStock = previousStock;

    if (deductFromStock === true) {
      const deductionAmount = numQty * unitMultiplier;
      newStock = Math.max(0, previousStock - deductionAmount);
      ingredient.availableQuantity = Number(newStock.toFixed(2));
      await ingredient.save();
      stockDeducted = true;
    }

    const newRecord = await WasteRecord.create({
      ingredient: ingredient._id,
      ingredientName: ingredient.name,
      category: ingredient.category,
      quantity: numQty,
      unit: effectiveUnit,
      normalizedKg,
      costPerUnit,
      totalCost: calculatedTotalCost,
      reason,
      kitchenStation: kitchenStation || req.user?.kitchenStation || "Main Kitchen",
      shift: shift || "Morning Shift",
      recordedBy: req.user?.userId,
      recordedByName: req.user?.name || "Kitchen Staff",
      recordedByRole: req.user?.role || "staff",
      notes: notes?.trim() || "",
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      deductedFromStock: stockDeducted,
    });

    // Write audit log
    await AuditLog.create({
      action: "CREATE_WASTE",
      entityType: "WasteRecord",
      entityId: newRecord._id.toString(),
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Staff",
      performedByRole: req.user?.role || "staff",
      details: `Logged food waste: ${newRecord.quantity} ${newRecord.unit} of "${ingredient.name}" worth ₹${newRecord.totalCost} (Reason: ${newRecord.reason}, Station: ${newRecord.kitchenStation}).${stockDeducted ? ` Stock deducted: ${previousStock} -> ${newStock} ${ingredient.unit}.` : ""}`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Successfully recorded waste of ${newRecord.quantity} ${newRecord.unit} ${ingredient.name} (₹${newRecord.totalCost}).`,
      record: newRecord,
      stockUpdated: stockDeducted,
      currentStock: ingredient.availableQuantity,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to record food waste.",
      error: err.message,
    });
  }
});

// PUT /api/waste/:id (Update waste record)
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const record = await WasteRecord.findById(req.params.id);
    if (!record) {
      res.status(404).json({
        success: false,
        message: "Waste record not found.",
      });
      return;
    }

    const settings = await AppSetting.findOne();
    const allowStaffHours = settings?.allowStaffEditHours || 24;

    // Check permissions: Manager can edit always; staff can only edit their own within allowed hours
    const isOwner = record.recordedBy.toString() === req.user?.userId;
    const isManager = req.user?.role === "manager";

    if (!isManager) {
      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: "You can only edit waste records that you submitted.",
        });
        return;
      }

      const hoursSinceCreation =
        (Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > allowStaffHours) {
        res.status(403).json({
          success: false,
          message: `Editing closed. Staff can only modify entries within ${allowStaffHours} hours of submission. Please ask an Executive Chef/Manager.`,
        });
        return;
      }
    }

    const { quantity, reason, kitchenStation, shift, notes, recordDate } = req.body;

    if (quantity !== undefined) {
      const numQty = Number(quantity);
      if (isNaN(numQty) || numQty <= 0) {
        res.status(400).json({
          success: false,
          message: "Quantity must be greater than zero.",
        });
        return;
      }
      record.quantity = numQty;
      record.totalCost = Math.round(numQty * record.costPerUnit * 100) / 100;

      if (record.unit === "kg" || record.unit === "litre") {
        record.normalizedKg = numQty;
      } else if (record.unit === "g" || record.unit === "ml") {
        record.normalizedKg = numQty / 1000;
      } else if (record.unit === "pieces") {
        record.normalizedKg = numQty * 0.08;
      }
    }

    if (reason) record.reason = reason;
    if (kitchenStation) record.kitchenStation = kitchenStation;
    if (shift) record.shift = shift;
    if (notes !== undefined) record.notes = notes.trim();
    if (recordDate) record.recordDate = new Date(recordDate);

    await record.save();

    await AuditLog.create({
      action: "UPDATE_WASTE",
      entityType: "WasteRecord",
      entityId: record._id.toString(),
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "User",
      performedByRole: req.user?.role || "staff",
      details: `Updated waste entry for "${record.ingredientName}" (Qty: ${record.quantity} ${record.unit}, Total: ₹${record.totalCost}).`,
    }).catch(() => {});

    res.json({
      success: true,
      message: "Waste record updated successfully.",
      record,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update waste record.",
      error: err.message,
    });
  }
});

// DELETE /api/waste/:id (Manager only)
router.delete("/:id", requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const record = await WasteRecord.findById(req.params.id);
    if (!record) {
      res.status(404).json({
        success: false,
        message: "Waste record not found.",
      });
      return;
    }

    await WasteRecord.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: "DELETE_WASTE",
      entityType: "WasteRecord",
      entityId: req.params.id,
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Deleted waste entry for "${record.ingredientName}" (${record.quantity} ${record.unit}, ₹${record.totalCost}) recorded on ${new Date(record.recordDate).toLocaleDateString()}.`,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Waste record for ${record.ingredientName} (₹${record.totalCost}) was deleted.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete waste record.",
      error: err.message,
    });
  }
});

export default router;
