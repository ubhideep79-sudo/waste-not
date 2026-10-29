import { Router, Response } from "express";
import { WasteRecord } from "../models/WasteRecord.ts";
import { Ingredient } from "../models/Ingredient.ts";
import { AppSetting } from "../models/AppSetting.ts";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";

const router = Router();

router.use(requireAuth);

// Helper for date bounds
function getDateBounds(period: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    const dayOfWeek = startDate.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - distanceToMonday);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === "custom" && customStart && customEnd) {
    startDate = new Date(customStart);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default to last 30 days
    startDate = new Date(now.getTime() - 30 * 86400000);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

// GET /api/analytics/dashboard
router.get("/dashboard", async (req: AuthRequest, res: Response) => {
  try {
    const { period = "month", startDate: customStart, endDate: customEnd } = req.query;

    const { startDate, endDate } = getDateBounds(
      String(period),
      customStart ? String(customStart) : undefined,
      customEnd ? String(customEnd) : undefined
    );

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Calculate previous period of equal length for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const [
      settings,
      totalIngredients,
      lowStockCount,
      periodMetrics,
      prevPeriodMetrics,
      monthMetrics,
      reasonBreakdown,
      stationBreakdown,
      topIngredients,
      recentEntries,
    ] = await Promise.all([
      AppSetting.findOne(),
      Ingredient.countDocuments(),
      Ingredient.countDocuments({
        $expr: { $lte: ["$availableQuantity", "$reorderLevel"] },
      }),
      // Selected period summary
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            totalCostINR: { $sum: "$totalCost" },
            totalWeightKg: { $sum: "$normalizedKg" },
            count: { $sum: 1 },
          },
        },
      ]),
      // Previous period summary
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: prevStartDate, $lte: prevEndDate } } },
        {
          $group: {
            _id: null,
            totalCostINR: { $sum: "$totalCost" },
            totalWeightKg: { $sum: "$normalizedKg" },
            count: { $sum: 1 },
          },
        },
      ]),
      // Month-to-date summary
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        {
          $group: {
            _id: null,
            totalCostINR: { $sum: "$totalCost" },
            totalWeightKg: { $sum: "$normalizedKg" },
            count: { $sum: 1 },
          },
        },
      ]),
      // Reason breakdown
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: "$reason",
            totalCost: { $sum: "$totalCost" },
            totalKg: { $sum: "$normalizedKg" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalCost: -1 } },
      ]),
      // Station breakdown
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: "$kitchenStation",
            totalCost: { $sum: "$totalCost" },
            totalKg: { $sum: "$normalizedKg" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalCost: -1 } },
      ]),
      // Top 5 frequently wasted ingredients by cost
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: "$ingredientName",
            totalCost: { $sum: "$totalCost" },
            totalKg: { $sum: "$normalizedKg" },
            category: { $first: "$category" },
            unit: { $first: "$unit" },
            frequency: { $sum: 1 },
          },
        },
        { $sort: { totalCost: -1 } },
        { $limit: 5 },
      ]),
      // Recent waste records
      WasteRecord.find({ recordDate: { $gte: startDate, $lte: endDate } })
        .sort({ recordDate: -1, createdAt: -1 })
        .limit(6),
    ]);

    const cur = periodMetrics[0] || { totalCostINR: 0, totalWeightKg: 0, count: 0 };
    const prev = prevPeriodMetrics[0] || { totalCostINR: 0, totalWeightKg: 0, count: 0 };
    const mtd = monthMetrics[0] || { totalCostINR: 0, totalWeightKg: 0, count: 0 };

    // Cost percentage difference compared to previous period
    let costDiffPercent = 0;
    if (prev.totalCostINR > 0) {
      costDiffPercent = Number(
        (((cur.totalCostINR - prev.totalCostINR) / prev.totalCostINR) * 100).toFixed(1)
      );
    }

    // Monthly budget comparison
    const monthlyBudget = settings?.monthlyWasteBudgetINR || 75000;
    const budgetUtilizedPercent = Number(
      ((mtd.totalCostINR / monthlyBudget) * 100).toFixed(1)
    );
    const estimatedSavingsTarget = Math.max(
      0,
      Math.round(monthlyBudget * ((settings?.costReductionGoalPercent || 15) / 100))
    );

    // Actual savings if current month is lower than monthly budget
    const actualSavingsMeasured = Math.max(0, monthlyBudget - mtd.totalCostINR);

    res.json({
      success: true,
      period: {
        type: period,
        startDate,
        endDate,
      },
      kpi: {
        totalFoodWasteKg: Number(cur.totalWeightKg.toFixed(2)),
        totalWasteCostINR: Math.round(cur.totalCostINR),
        recordedEntriesCount: cur.count,
        monthToDateWasteKg: Number(mtd.totalWeightKg.toFixed(2)),
        monthToDateWasteINR: Math.round(mtd.totalCostINR),
        monthlyBudgetINR: monthlyBudget,
        budgetUtilizedPercent,
        projectedSavingsTargetINR: estimatedSavingsTarget,
        actualSavingsMeasuredINR: actualSavingsMeasured,
        costDiffPercent, // e.g. -12.4% means 12.4% reduction
        totalIngredients,
        lowStockCount,
      },
      reasonBreakdown: reasonBreakdown.map((r) => ({
        reason: r._id,
        totalCostINR: Math.round(r.totalCost),
        totalKg: Number(r.totalKg.toFixed(2)),
        count: r.count,
        percentageOfCost: cur.totalCostINR > 0 ? Number(((r.totalCost / cur.totalCostINR) * 100).toFixed(1)) : 0,
      })),
      stationBreakdown: stationBreakdown.map((s) => ({
        station: s._id,
        totalCostINR: Math.round(s.totalCost),
        totalKg: Number(s.totalKg.toFixed(2)),
        count: s.count,
        percentageOfCost: cur.totalCostINR > 0 ? Number(((s.totalCost / cur.totalCostINR) * 100).toFixed(1)) : 0,
      })),
      topWastedIngredients: topIngredients.map((i) => ({
        name: i._id,
        category: i.category,
        totalCostINR: Math.round(i.totalCost),
        totalKg: Number(i.totalKg.toFixed(2)),
        frequency: i.frequency,
      })),
      recentEntries,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to generate dashboard analytics.",
      error: err.message,
    });
  }
});

// GET /api/analytics/trends (Day-by-day trend for charts)
router.get("/trends", async (req: AuthRequest, res: Response) => {
  try {
    const { period = "month", startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateBounds(
      String(period),
      customStart ? String(customStart) : undefined,
      customEnd ? String(customEnd) : undefined
    );

    const trendRecords = await WasteRecord.aggregate([
      { $match: { recordDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$recordDate" },
          },
          totalCost: { $sum: "$totalCost" },
          totalKg: { $sum: "$normalizedKg" },
          entryCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build complete date continuum so chart does not have missing gap dates
    const dateMap = new Map<string, { totalCost: number; totalKg: number; entryCount: number }>();
    trendRecords.forEach((item) => {
      dateMap.set(item._id, {
        totalCost: Math.round(item.totalCost),
        totalKg: Number(item.totalKg.toFixed(2)),
        entryCount: item.entryCount,
      });
    });

    const fullTrends: Array<{
      date: string;
      label: string;
      totalCostINR: number;
      totalWeightKg: number;
      entryCount: number;
    }> = [];

    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dateStr = curr.toISOString().split("T")[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const displayLabel = `${curr.getDate()} ${monthNames[curr.getMonth()]}`;

      const data = dateMap.get(dateStr) || { totalCost: 0, totalKg: 0, entryCount: 0 };
      fullTrends.push({
        date: dateStr,
        label: displayLabel,
        totalCostINR: data.totalCost,
        totalWeightKg: data.totalKg,
        entryCount: data.entryCount,
      });

      curr.setDate(curr.getDate() + 1);
    }

    res.json({
      success: true,
      trends: fullTrends,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to generate trend analytics.",
      error: err.message,
    });
  }
});

// GET /api/analytics/recommendations (Smart AI/algorithmic action plan)
router.get("/recommendations", async (_req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [reasonStats, stationStats, topCostItem] = await Promise.all([
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: "$reason",
            totalCost: { $sum: "$totalCost" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalCost: -1 } },
      ]),
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: "$kitchenStation",
            totalCost: { $sum: "$totalCost" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalCost: -1 } },
      ]),
      WasteRecord.aggregate([
        { $match: { recordDate: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: "$ingredientName",
            totalCost: { $sum: "$totalCost" },
            category: { $first: "$category" },
            unit: { $first: "$unit" },
            totalQty: { $sum: "$quantity" },
          },
        },
        { $sort: { totalCost: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const totalThirtyDayCost = reasonStats.reduce((sum, r) => sum + r.totalCost, 0);

    const recommendations: Array<{
      id: string;
      title: string;
      priority: "HIGH" | "MEDIUM" | "OPPORTUNITY";
      category: string;
      finding: string;
      actionStep: string;
      projectedSavingsINR: number;
    }> = [];

    // Check top reasons
    const overproduction = reasonStats.find((r) => r._id === "Overproduction");
    if (overproduction && overproduction.totalCost > 0) {
      const pct = Math.round((overproduction.totalCost / totalThirtyDayCost) * 100);
      recommendations.push({
        id: "REC-01",
        title: "Implement Batch Portion Scheduling for Banquet Lines",
        priority: "HIGH",
        category: "Production Control",
        finding: `Overproduction accounts for ₹${Math.round(overproduction.totalCost)} (${pct}% of recent food waste), primarily during evening buffet services.`,
        actionStep: "Replace single large batch cooking with 2-stage progressive replenishment pans (cook 60% baseline, replenish in 20% pans).",
        projectedSavingsINR: Math.round(overproduction.totalCost * 0.35),
      });
    }

    const prepWaste = reasonStats.find((r) => r._id === "Preparation waste");
    if (prepWaste && prepWaste.totalCost > 0) {
      recommendations.push({
        id: "REC-02",
        title: "Butchery & Fish Filleting Yield Training",
        priority: "HIGH",
        category: "Kitchen Skills & Yield",
        finding: `Preparation trimming losses total ₹${Math.round(prepWaste.totalCost)} over the last 30 days, heavily concentrated on protein cuts.`,
        actionStep: "Conduct butchery yield verification and institute vegetable/protein scrap repurposing for house stocks and demi-glace bases.",
        projectedSavingsINR: Math.round(prepWaste.totalCost * 0.28),
      });
    }

    const storageError = reasonStats.find((r) => r._id === "Storage errors");
    if (storageError && storageError.totalCost > 0) {
      recommendations.push({
        id: "REC-03",
        title: "Walk-in Chiller Temperature & Door Alarm Audit",
        priority: "MEDIUM",
        category: "Storage Maintenance",
        finding: `Storage and defrosting errors caused ₹${Math.round(storageError.totalCost)} in losses (spoilage from temperature spikes or unmonitored thawing).`,
        actionStep: "Calibrate daily digital chiller logging sheets twice per shift and enforce rapid cold-chain FIFO rotation labels.",
        projectedSavingsINR: Math.round(storageError.totalCost * 0.5),
      });
    }

    const spoilage = reasonStats.find((r) => r._id === "Spoilage");
    if (spoilage && spoilage.totalCost > 0) {
      recommendations.push({
        id: "REC-04",
        title: "Dynamic Reorder Level Optimization for Perishables",
        priority: "MEDIUM",
        category: "Procurement",
        finding: `Natural spoilage reached ₹${Math.round(spoilage.totalCost)}, indicating perishable inventory holding exceeds 3-day consumption velocity.`,
        actionStep: "Switch fresh mushrooms, herbs, and cream orders from bi-weekly bulk drops to daily or alternate-day fresh morning deliveries.",
        projectedSavingsINR: Math.round(spoilage.totalCost * 0.3),
      });
    }

    // Top ingredient finding
    if (topCostItem.length > 0) {
      const topItem = topCostItem[0];
      recommendations.push({
        id: "REC-05",
        title: `Special Waste Audit: ${topItem._id}`,
        priority: "OPPORTUNITY",
        category: "High-Value Ingredient",
        finding: `"${topItem._id}" represents the single largest financial loss at ₹${Math.round(topItem.totalCost)} (${topItem.totalQty.toFixed(1)} ${topItem.unit}).`,
        actionStep: `Assign mandatory dual-signature logging before discarding ${topItem._id} to deter unnecessary disposal.`,
        projectedSavingsINR: Math.round(topItem.totalCost * 0.25),
      });
    }

    const totalProjectedSavings = recommendations.reduce(
      (sum, r) => sum + r.projectedSavingsINR,
      0
    );

    res.json({
      success: true,
      totalProjectedSavingsINR: totalProjectedSavings,
      recommendationsCount: recommendations.length,
      recommendations,
      topWasteStation: stationStats[0]?._id || "Main Kitchen",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations.",
      error: err.message,
    });
  }
});

// GET /api/analytics/export-csv (RFC-compliant CSV download)
router.get("/export-csv", async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, reason, kitchenStation } = req.query;

    const query: Record<string, any> = {};
    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        query.recordDate.$lte = end;
      }
    }
    if (reason && reason !== "All") query.reason = reason;
    if (kitchenStation && kitchenStation !== "All") query.kitchenStation = kitchenStation;

    const records = await WasteRecord.find(query).sort({ recordDate: -1 });

    // Build CSV headers
    const headers = [
      "Record ID",
      "Date",
      "Time",
      "Ingredient Name",
      "Category",
      "Quantity Wasted",
      "Unit",
      "Normalized Weight (kg)",
      "Cost Per Unit (INR)",
      "Total Waste Cost (INR)",
      "Waste Reason",
      "Kitchen Station",
      "Shift",
      "Recorded By Name",
      "Recorded By Role",
      "Inventory Deducted",
      "Kitchen Notes",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r) => {
      const d = new Date(r.recordDate);
      const datePart = d.toISOString().split("T")[0];
      const timePart = d.toTimeString().split(" ")[0];

      return [
        escapeCsv(r._id.toString()),
        escapeCsv(datePart),
        escapeCsv(timePart),
        escapeCsv(r.ingredientName),
        escapeCsv(r.category),
        escapeCsv(r.quantity),
        escapeCsv(r.unit),
        escapeCsv(r.normalizedKg),
        escapeCsv(r.costPerUnit),
        escapeCsv(r.totalCost),
        escapeCsv(r.reason),
        escapeCsv(r.kitchenStation),
        escapeCsv(r.shift),
        escapeCsv(r.recordedByName),
        escapeCsv(r.recordedByRole),
        escapeCsv(r.deductedFromStock ? "Yes" : "No"),
        escapeCsv(r.notes || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="waste_not_report_${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV export.",
      error: err.message,
    });
  }
});

export default router;
