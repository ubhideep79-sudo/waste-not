import React, { useState, useEffect, useCallback } from "react";
import { DashboardData, TrendDataPoint } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { StatCard } from "../common/StatCard.tsx";
import {
  TrendAreaChart,
  ReasonDonutChart,
  StationBarChart,
} from "../common/InteractiveChart.tsx";
import {
  Trash2,
  IndianRupee,
  Scale,
  Calendar,
  Boxes,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  ArrowRight,
  PlusCircle,
  FileText,
  Clock,
} from "lucide-react";

interface ManagerDashboardProps {
  onNavigateToWaste: () => void;
  onNavigateToInventory: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToReports: () => void;
  onOpenRecordModal: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onNavigateToWaste,
  onNavigateToInventory,
  onNavigateToAnalytics,
  onNavigateToReports,
  onOpenRecordModal,
}) => {
  const toast = useToast();

  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">("month");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [trendMetric, setTrendMetric] = useState<"cost" | "weight">("cost");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, trends] = await Promise.all([
        api.getDashboard({
          period,
          startDate: customStart || undefined,
          endDate: customEnd || undefined,
        }),
        api.getTrends({
          period,
          startDate: customStart || undefined,
          endDate: customEnd || undefined,
        }),
      ]);

      setDashboardData(dash);
      setTrendData(trends.trends);
    } catch (err: any) {
      toast.error("Failed to load dashboard data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const kpi = dashboardData?.kpi;

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#12372A] font-display">
              Executive Kitchen Dashboard
            </h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#D8F3DC] text-[#1E4D3A] border border-[#74C69D]/40">
              Live Database
            </span>
          </div>
          <p className="text-xs text-[#52796F] mt-0.5">
            Real-time food waste measurements, cost analysis in INR, and kitchen performance
          </p>
        </div>

        {/* Date Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#D5DDD8] rounded-lg shadow-2xs">
            {(["today", "week", "month", "custom"] as const).map((p) => {
              const labels = {
                today: "Today",
                week: "This Week",
                month: "This Month",
                custom: "Custom",
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    period === p
                      ? "bg-[#12372A] text-white shadow-xs"
                      : "text-[#52796F] hover:text-[#12372A] hover:bg-[#FAF9F5]"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {period === "custom" && (
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[#D5DDD8]">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs border-0 outline-hidden font-mono px-2 py-1 text-slate-700"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs border-0 outline-hidden font-mono px-2 py-1 text-slate-700"
              />
            </div>
          )}

          <button
            onClick={onOpenRecordModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-[#F2C94C]" />
            <span>Record Waste</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <StatCard
          title="Total Recorded Loss"
          value={`₹${(kpi?.totalWasteCostINR || 0).toLocaleString("en-IN")}`}
          subtitle={`${period === "month" ? "This month" : "Selected period"}`}
          icon={IndianRupee}
          trend={kpi?.costDiffPercent}
          variant="pine"
          tooltip="Total financial loss calculated from snapshot ingredient costs"
        />

        {/* Total Weight */}
        <StatCard
          title="Total Food Waste"
          value={`${kpi?.totalFoodWasteKg || 0} kg`}
          subtitle={`${kpi?.recordedEntriesCount || 0} waste records logged`}
          icon={Scale}
          variant="sage"
          tooltip="Normalized sum of discarded weight across all ingredients"
        />

        {/* Month to Date vs Budget */}
        <StatCard
          title="Monthly Waste Budget"
          value={`₹${(kpi?.monthToDateWasteINR || 0).toLocaleString("en-IN")}`}
          subtitle={`Limit: ₹${(kpi?.monthlyBudgetINR || 75000).toLocaleString("en-IN")} (${kpi?.budgetUtilizedPercent || 0}%)`}
          icon={Calendar}
          variant={
            (kpi?.budgetUtilizedPercent || 0) > 90
              ? "tomato"
              : (kpi?.budgetUtilizedPercent || 0) > 70
              ? "amber"
              : "sage"
          }
          tooltip="Month-to-date waste expenditure compared to hotel target budget"
        />

        {/* Low Stock & Inventory Valuation */}
        <StatCard
          title="Active Pantry Items"
          value={`${kpi?.totalIngredients || 0} items`}
          subtitle={`${kpi?.lowStockCount || 0} items below reorder level`}
          icon={Boxes}
          variant={kpi?.lowStockCount && kpi.lowStockCount > 0 ? "amber" : "neutral"}
          tooltip="Active inventory ingredients tracked in hotel kitchen"
        />
      </div>

      {/* Monthly Budget Progress Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#D5DDD8] shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#52796F]">
              Monthly Kitchen Waste Threshold
            </span>
            <p className="text-sm font-bold text-[#12372A] mt-0.5">
              ₹{(kpi?.monthToDateWasteINR || 0).toLocaleString("en-IN")} spent of ₹
              {(kpi?.monthlyBudgetINR || 75000).toLocaleString("en-IN")} allocation
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-[#637C71]">Measured Savings Buffer: </span>
            <strong className="text-emerald-700 font-mono text-sm">
              ₹{(kpi?.actualSavingsMeasuredINR || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              (kpi?.budgetUtilizedPercent || 0) > 90
                ? "bg-red-500"
                : (kpi?.budgetUtilizedPercent || 0) > 70
                ? "bg-amber-500"
                : "bg-[#2D6A4F]"
            }`}
            style={{ width: `${Math.min(100, kpi?.budgetUtilizedPercent || 0)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-[#637C71] mt-1.5 font-mono">
          <span>₹0</span>
          <span>Target Cap: ₹{(kpi?.monthlyBudgetINR || 75000).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Main Charts Grid: Trend Line & Reason Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#D5DDD8] shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-[#12372A] font-display">
                Food Waste Trend Over Time
              </h2>
              <p className="text-[11px] text-[#52796F]">
                Daily timeline tracking cost and volume variations
              </p>
            </div>

            {/* Toggle metric */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md text-xs">
              <button
                onClick={() => setTrendMetric("cost")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  trendMetric === "cost"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cost (₹)
              </button>
              <button
                onClick={() => setTrendMetric("weight")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  trendMetric === "weight"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Weight (kg)
              </button>
            </div>
          </div>

          <TrendAreaChart data={trendData} metric={trendMetric} />
        </div>

        {/* Reason Donut Chart (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-[#D5DDD8] shadow-card flex flex-col justify-between">
          <div className="mb-2 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#12372A] font-display">
              Breakdown by Waste Reason
            </h2>
            <p className="text-[11px] text-[#52796F]">
              Primary causes of food losses during selected period
            </p>
          </div>

          <ReasonDonutChart
            data={dashboardData?.reasonBreakdown || []}
            totalCostINR={kpi?.totalWasteCostINR || 0}
          />
        </div>
      </div>

      {/* Secondary Grid: Station Breakdown & Top Wasted Ingredients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-[#D5DDD8] shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-[#12372A] font-display">
                Waste Cost by Kitchen Station
              </h2>
              <p className="text-[11px] text-[#52796F]">
                Comparison across banquet, main line, pastry & butchery
              </p>
            </div>
          </div>

          <StationBarChart data={dashboardData?.stationBreakdown || []} />
        </div>

        {/* Top 5 Frequently Wasted Ingredients */}
        <div className="bg-white p-5 rounded-xl border border-[#D5DDD8] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-[#12372A] font-display">
                  Top Wasted Ingredients (by INR Cost)
                </h2>
                <p className="text-[11px] text-[#52796F]">
                  Highest financial impact items requiring kitchen intervention
                </p>
              </div>
              <button
                onClick={onNavigateToInventory}
                className="text-xs text-[#2D6A4F] hover:text-[#12372A] font-semibold flex items-center gap-1"
              >
                <span>Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(dashboardData?.topWastedIngredients || []).map((item, idx) => (
                <div
                  key={item.name}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[#12372A]">{item.name}</p>
                      <p className="text-[10px] text-[#637C71]">
                        {item.category} · {item.frequency} entries
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-[#12372A] font-mono">
                      ₹{item.totalCostINR.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-[#637C71] font-mono">
                      {item.totalKg} kg wasted
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-[#637C71]">
              Need tailored reduction guidance?
            </span>
            <button
              onClick={onNavigateToAnalytics}
              className="text-xs font-semibold text-[#2D6A4F] hover:text-[#12372A] flex items-center gap-1"
            >
              <span>View Cost-Saving Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Entries Table */}
      <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-[#12372A] font-display">
              Recent Waste Log Submissions
            </h2>
            <p className="text-[11px] text-[#52796F]">
              Latest food items logged across kitchen stations
            </p>
          </div>
          <button
            onClick={onNavigateToWaste}
            className="text-xs font-semibold text-[#2D6A4F] hover:text-[#12372A] flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Ingredient</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Loss (INR)</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(dashboardData?.recentEntries || []).map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                    {new Date(r.recordDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#12372A]">
                    {r.ingredientName}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {r.quantity} {r.unit}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#12372A]">
                    ₹{r.totalCost.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{r.reason}</td>
                  <td className="py-2.5 px-3 text-slate-600">{r.kitchenStation}</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.recordedByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
