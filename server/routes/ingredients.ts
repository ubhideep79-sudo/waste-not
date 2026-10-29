import { Router, Response } from "express";
import { Ingredient } from "../models/Ingredient.ts";
import { WasteRecord } from "../models/WasteRecord.ts";
import { requireAuth, requireManager, AuthRequest } from "../middleware/auth.ts";
import { AuditLog } from "../models/AuditLog.ts";

const router = Router();

// Read ingredients requires standard authentication
router.use(requireAuth);

// GET /api/ingredients (Search, filter by category, low-stock, expiry)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, lowStock, expiringSoon } = req.query;

    const query: Record<string, any> = {};

    if (search && typeof search === "string" && search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    if (category && typeof category === "string" && category !== "All") {
      query.category = category;
    }

    let ingredients = await Ingredient.find(query).sort({ name: 1 });

    // Filter in-memory for custom flags if requested
    if (lowStock === "true") {
      ingredients = ingredients.filter(
        (i) => i.availableQuantity <= i.reorderLevel
      );
    }

    if (expiringSoon === "true") {
      const now = new Date();
      const inThreeDays = new Date(now.getTime() + 3 * 86400000);
      ingredients = ingredients.filter(
        (i) => i.expiryDate && new Date(i.expiryDate) <= inThreeDays
      );
    }

    // Calculate inventory statistics
    const totalValuationINR = ingredients.reduce(
      (sum, item) => sum + item.availableQuantity * item.costPerUnit,
      0
    );
    const lowStockCount = ingredients.filter(
      (i) => i.availableQuantity <= i.reorderLevel
    ).length;

    res.json({
      success: true,
      count: ingredients.length,
      totalValuationINR: Math.round(totalValuationINR),
      lowStockCount,
      ingredients,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ingredients.",
      error: err.message,
    });
  }
});

// GET /api/ingredients/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      res.status(404).json({
        success: false,
        message: "Ingredient not found.",
      });
      return;
    }

    // Fetch waste history summary for this ingredient
    const wasteSummary = await WasteRecord.aggregate([
      { $match: { ingredient: ingredient._id } },
      {
        $group: {
          _id: null,
          totalWastedQty: { $sum: "$quantity" },
          totalWastedCost: { $sum: "$totalCost" },
          recordsCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      ingredient,
      wasteSummary: wasteSummary[0] || {
        totalWastedQty: 0,
        totalWastedCost: 0,
        recordsCount: 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ingredient details.",
      error: err.message,
    });
  }
});

// Manager only operations:
router.post("/", requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      category,
      unit,
      availableQuantity,
      reorderLevel,
      costPerUnit,
      supplier,
      expiryDate,
      storageLocation,
    } = req.body;

    if (!name || !category || !unit || costPerUnit === undefined) {
      res.status(400).json({
        success: false,
        message: "Name, category, unit, and cost per unit are required.",
      });
      return;
    }

    if (Number(availableQuantity) < 0 || Number(costPerUnit) <= 0) {
      res.status(400).json({
        success: false,
        message:
          "Available quantity cannot be negative, and cost per unit must be greater than zero.",
      });
      return;
    }

    const existing = await Ingredient.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      res.status(400).json({
        success: false,
        message: "An ingredient with this name already exists in inventory.",
      });
      return;
    }

    const newIngredient = await Ingredient.create({
      name: name.trim(),
      category,
      unit,
      availableQuantity: Number(availableQuantity) || 0,
      reorderLevel: Number(reorderLevel) || 5,
      costPerUnit: Number(costPerUnit),
      supplier: supplier?.trim() || "Hotel Central Supply",
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      storageLocation: storageLocation?.trim() || "Walk-in Chiller",
    });

    await AuditLog.create({
      action: "CREATE_INGREDIENT",
      entityType: "Ingredient",
      entityId: newIngredient._id.toString(),
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Added new ingredient: ${newIngredient.name} (${newIngredient.availableQuantity} ${newIngredient.unit} @ ₹${newIngredient.costPerUnit}/${newIngredient.unit}).`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Ingredient "${newIngredient.name}" created successfully.`,
      ingredient: newIngredient,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create ingredient.",
      error: err.message,
    });
  }
});

// Update ingredient
router.put("/:id", requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      category,
      unit,
      availableQuantity,
      reorderLevel,
      costPerUnit,
      supplier,
      expiryDate,
      storageLocation,
    } = req.body;

    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      res.status(404).json({
        success: false,
        message: "Ingredient not found.",
      });
      return;
    }

    if (name) ingredient.name = name.trim();
    if (category) ingredient.category = category;
    if (unit) ingredient.unit = unit;
    if (availableQuantity !== undefined) {
      if (Number(availableQuantity) < 0) {
        res.status(400).json({
          success: false,
          message: "Available quantity cannot be negative.",
        });
        return;
      }
      ingredient.availableQuantity = Number(availableQuantity);
    }
    if (reorderLevel !== undefined) {
      ingredient.reorderLevel = Math.max(0, Number(reorderLevel));
    }
    if (costPerUnit !== undefined) {
      if (Number(costPerUnit) <= 0) {
        res.status(400).json({
          success: false,
          message: "Cost per unit must be greater than zero.",
        });
        return;
      }
      ingredient.costPerUnit = Number(costPerUnit);
    }
    if (supplier !== undefined) ingredient.supplier = supplier.trim();
    if (expiryDate !== undefined) {
      ingredient.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
    }
    if (storageLocation !== undefined) {
      ingredient.storageLocation = storageLocation.trim();
    }

    await ingredient.save();

    await AuditLog.create({
      action: "UPDATE_INGREDIENT",
      entityType: "Ingredient",
      entityId: ingredient._id.toString(),
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Updated ingredient "${ingredient.name}" (Stock: ${ingredient.availableQuantity} ${ingredient.unit}, Cost: ₹${ingredient.costPerUnit}).`,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Ingredient "${ingredient.name}" updated successfully.`,
      ingredient,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update ingredient.",
      error: err.message,
    });
  }
});

// Adjust stock count (audit log specifically)
router.patch(
  "/:id/adjust-stock",
  requireManager,
  async (req: AuthRequest, res: Response) => {
    try {
      const { newQuantity, reason } = req.body;
      if (newQuantity === undefined || Number(newQuantity) < 0) {
        res.status(400).json({
          success: false,
          message: "Valid non-negative new quantity is required.",
        });
        return;
      }

      const ingredient = await Ingredient.findById(req.params.id);
      if (!ingredient) {
        res.status(404).json({
          success: false,
          message: "Ingredient not found.",
        });
        return;
      }

      const previousQty = ingredient.availableQuantity;
      ingredient.availableQuantity = Number(newQuantity);
      await ingredient.save();

      await AuditLog.create({
        action: "STOCK_ADJUSTMENT",
        entityType: "Ingredient",
        entityId: ingredient._id.toString(),
        performedBy: req.user?.userId,
        performedByName: req.user?.name || "Manager",
        performedByRole: "manager",
        details: `Adjusted stock for ${ingredient.name}: was ${previousQty} ${ingredient.unit}, now ${ingredient.availableQuantity} ${ingredient.unit}. Reason: ${reason || "Physical count adjustment"}.`,
      }).catch(() => {});

      res.json({
        success: true,
        message: `Stock adjusted for ${ingredient.name}.`,
        ingredient,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: "Failed to adjust stock.",
        error: err.message,
      });
    }
  }
);

// Delete ingredient (subject to data integrity check)
router.delete("/:id", requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      res.status(404).json({
        success: false,
        message: "Ingredient not found.",
      });
      return;
    }

    // Check if ingredient has existing waste records
    const linkedRecordsCount = await WasteRecord.countDocuments({
      ingredient: ingredient._id,
    });

    if (linkedRecordsCount > 0) {
      // Data integrity enforcement
      res.status(409).json({
        success: false,
        message: `Cannot delete "${ingredient.name}" because it is linked to ${linkedRecordsCount} historical waste record(s). Deleting it would compromise food waste audit history. You can adjust its stock to 0 instead.`,
        code: "INTEGRITY_VIOLATION",
        linkedRecordsCount,
      });
      return;
    }

    await Ingredient.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: "DELETE_INGREDIENT",
      entityType: "Ingredient",
      entityId: req.params.id,
      performedBy: req.user?.userId,
      performedByName: req.user?.name || "Manager",
      performedByRole: "manager",
      details: `Deleted ingredient "${ingredient.name}".`,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Ingredient "${ingredient.name}" has been deleted.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete ingredient.",
      error: err.message,
    });
  }
});

export default router;
