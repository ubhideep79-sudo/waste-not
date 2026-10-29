import React, { useState, useEffect } from "react";
import {
  DashboardData,
  TrendDataPoint,
  Recommendation,
  WasteReason,
} from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import {
  TrendAreaChart,
  ReasonDonutChart,
  StationBarChart,
} from "../common/InteractiveChart.tsx";
import { PrintableReportModal } from "./PrintableReportModal.tsx";
import {
  Download,
  Printer,
  Sparkles,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Layers,
  IndianRupee,
  Scale,
  Target,
  ArrowRight,
  Info,
} from "lucide-react";

export const CostSavingAnalytics: React.FC = () => {
  const toast = useToast();

  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">("month");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [projectedSavingsTotal, setProjectedSavingsTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Printable modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const [dash, trends, recs] = await Promise.all([
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
          api.getRecommendations(),
        ]);

        setDashboardData(dash);
        setTrendData(trends.trends);
        setRecommendations(recs.recommendations);
        setProjectedSavingsTotal(recs.totalProjectedSavingsINR);
      } catch (err: any) {
        toast.error("Failed to load analytics: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [period, customStart, customEnd]);

  const kpi = dashboardData?.kpi;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#12372A] font-display">
            Cost-Saving Analytics & Corrective Actions
          </h1>
          <p className="text-xs text-[#52796F]">
            Data-backed hotel kitchen waste insights, ROI projections, and actionable SOP reductions
          </p>
        </div>

        {/* Actions: Print Report & CSV */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#12372A] bg-white border border-[#D5DDD8] rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Print Audit Report</span>
          </button>

          <button
            onClick={() => api.downloadCsv()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>Export Full CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-[#D5DDD8] shadow-2xs">
        <span className="text-xs font-semibold text-[#52796F] px-2">
          Analysis Window:
        </span>
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
          {(["today", "week", "month", "custom"] as const).map((p) => {
            const labels = {
              today: "Today",
              week: "This Week",
              month: "This Month",
              custom: "Custom Period",
            };
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  period === p
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 font-mono text-slate-700"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 font-mono text-slate-700"
            />
          </div>
        )}
      </div>

      {/* Savings & Target Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Measured Actual Savings */}
        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
              Measured Actual Savings
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-800 font-display mt-1">
            ₹{(kpi?.actualSavingsMeasuredINR || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-[#637C71] mt-1">
            Under-budget surplus vs monthly limit
          </p>
        </div>

        {/* Projected Savings Target */}
        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
              Projected Target Savings
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
              Goal
            </span>
          </div>
          <p className="text-2xl font-bold text-[#12372A] font-display mt-1">
            ₹{(kpi?.projectedSavingsTargetINR || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-[#637C71] mt-1">
            Based on 18% reduction target
          </p>
        </div>

        {/* Total Cost */}
        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card">
          <span className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
            Total Incurred Loss
          </span>
          <p className="text-2xl font-bold text-[#12372A] font-display mt-1">
            ₹{(kpi?.totalWasteCostINR || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-[#637C71] mt-1">
            {kpi?.costDiffPercent ? (
              <span className={kpi.costDiffPercent < 0 ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                {kpi.costDiffPercent > 0 ? `+${kpi.costDiffPercent}%` : `${kpi.costDiffPercent}%`} vs prior period
              </span>
            ) : (
              "Current period total"
            )}
          </p>
        </div>

        {/* Total Quantity */}
        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card">
          <span className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
            Total Mass Discarded
          </span>
          <p className="text-2xl font-bold text-[#12372A] font-display mt-1">
            {kpi?.totalFoodWasteKg || 0} kg
          </p>
          <p className="text-[11px] text-[#637C71] mt-1">
            {kpi?.recordedEntriesCount || 0} verified weigh-ins
          </p>
        </div>
      </div>

      {/* Suggested Corrective Actions Section (Domain-specific hotel kitchen recommendations) */}
      <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#12372A] font-display">
                Data-Driven Corrective Action Plan
              </h2>
              <p className="text-xs text-[#52796F]">
                Tailored reduction SOPs derived directly from measured hotel kitchen waste patterns
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[#52796F]">Potential Combined Savings:</span>
            <p className="text-base font-bold text-emerald-800 font-mono">
              ₹{projectedSavingsTotal.toLocaleString("en-IN")} / mo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const priorityBadge = {
              HIGH: "bg-red-50 text-red-800 border-red-200",
              MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
              OPPORTUNITY: "bg-emerald-50 text-emerald-800 border-emerald-200",
            };

            return (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-[#D5DDD8] bg-[#FAF9F5] flex flex-col justify-between hover:border-[#2D6A4F]/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        priorityBadge[rec.priority]
                      }`}
                    >
                      {rec.priority} Priority · {rec.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 font-mono">
                      +₹{rec.projectedSavingsINR.toLocaleString("en-IN")} saving
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#12372A] mb-1">
                    {rec.title}
                  </h3>

                  <div className="text-xs text-[#4F685D] space-y-1.5 mt-2">
                    <p className="leading-relaxed">
                      <strong className="text-slate-800">Observation: </strong>
                      {rec.finding}
                    </p>
                    <p className="leading-relaxed bg-white p-2.5 rounded-lg border border-[#D5DDD8]">
                      <strong className="text-[#12372A]">Action Step: </strong>
                      {rec.actionStep}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Grid: Trends + Reason Breakdown + Station Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="bg-white p-5 rounded-xl border border-[#D5DDD8] shadow-card">
          <div className="mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#12372A] font-display">
              Timeline of Waste Losses (INR)
            </h2>
            <p className="text-[11px] text-[#52796F]">
              Daily aggregate financial waste during selected period
            </p>
          </div>
          <TrendAreaChart data={trendData} metric="cost" />
        </div>

        {/* Reason Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-[#D5DDD8] shadow-card">
          <div className="mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#12372A] font-display">
              Loss Allocation by Reason
            </h2>
            <p className="text-[11px] text-[#52796F]">
              Direct financial proportion attributable to each disposal cause
            </p>
          </div>
          <ReasonDonutChart
            data={dashboardData?.reasonBreakdown || []}
            totalCostINR={kpi?.totalWasteCostINR || 0}
          />
        </div>
      </div>

      {/* Printable Report Modal */}
      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        dashboardData={dashboardData}
        recommendations={recommendations}
      />
    </div>
  );
};
