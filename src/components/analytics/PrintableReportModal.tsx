import React from "react";
import { Modal } from "../common/Modal.tsx";
import { DashboardData, Recommendation } from "../../types/index.ts";
import { Printer, UtensilsCrossed, CheckCircle, ShieldCheck } from "lucide-react";

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: DashboardData | null;
  recommendations: Recommendation[];
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  dashboardData,
  recommendations,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const kpi = dashboardData?.kpi;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hotel Kitchen Food Waste Audit Report"
      subtitle="Printable executive summary for hotel general management and department heads"
      maxWidth="2xl"
    >
      <div className="space-y-6 print:m-0 print:p-0">
        {/* Print Button Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
          <p className="text-xs text-slate-500">
            Formatted specifically for A4 / Letter executive printing.
          </p>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-[#F2C94C]" />
            <span>Print to PDF / Paper</span>
          </button>
        </div>

        {/* Printable Document Sheet */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs print:border-none print:shadow-none space-y-6">
          {/* Hotel Report Header */}
          <div className="flex items-start justify-between border-b-2 border-[#12372A] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-[#2D6A4F]" />
                <h1 className="text-xl font-bold text-[#12372A] tracking-tight font-display">
                  WASTE NOT, WANT NOT
                </h1>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#52796F] mt-0.5">
                Food Waste Control & Cost-Saving Audit
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Property: The Grand Horizon Palace & Convention Centre
              </p>
            </div>

            <div className="text-right text-xs space-y-0.5 text-slate-600 font-mono">
              <p>
                <strong>Report Generated:</strong> {new Date().toLocaleDateString("en-IN")}
              </p>
              <p>
                <strong>Period:</strong> {dashboardData?.period.type.toUpperCase() || "MONTH"}
              </p>
              <p>
                <strong>Currency:</strong> INR (₹)
              </p>
            </div>
          </div>

          {/* Executive KPI Summary */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#12372A] mb-3">
              1. Executive Waste Metrics Summary
            </h2>
            <div className="grid grid-cols-4 gap-3 text-xs border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Total Loss (INR)
                </span>
                <p className="text-base font-bold text-[#12372A] font-mono mt-0.5">
                  ₹{(kpi?.totalWasteCostINR || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Total Discarded
                </span>
                <p className="text-base font-bold text-[#12372A] font-mono mt-0.5">
                  {kpi?.totalFoodWasteKg || 0} kg
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Monthly Limit
                </span>
                <p className="text-base font-bold text-slate-800 font-mono mt-0.5">
                  ₹{(kpi?.monthlyBudgetINR || 75000).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Measured Surplus
                </span>
                <p className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                  ₹{(kpi?.actualSavingsMeasuredINR || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Reason Allocation Table */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#12372A] mb-2">
              2. Breakdown by Disposal Reason
            </h2>
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-2">Waste Reason</th>
                  <th className="p-2 text-right">Records Count</th>
                  <th className="p-2 text-right">Volume (kg)</th>
                  <th className="p-2 text-right">Cost (INR)</th>
                  <th className="p-2 text-right">% of Total Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {(dashboardData?.reasonBreakdown || []).map((r) => (
                  <tr key={r.reason}>
                    <td className="p-2 font-sans font-medium text-slate-800">
                      {r.reason}
                    </td>
                    <td className="p-2 text-right text-slate-600">{r.count}</td>
                    <td className="p-2 text-right text-slate-600">{r.totalKg} kg</td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      ₹{r.totalCostINR.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2 text-right text-slate-700">
                      {r.percentageOfCost}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Station Allocation Table */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#12372A] mb-2">
              3. Station Discard Distribution
            </h2>
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-2">Kitchen Station</th>
                  <th className="p-2 text-right">Total Discarded (kg)</th>
                  <th className="p-2 text-right">Financial Loss (INR)</th>
                  <th className="p-2 text-right">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {(dashboardData?.stationBreakdown || []).map((s) => (
                  <tr key={s.station}>
                    <td className="p-2 font-sans font-medium text-slate-800">
                      {s.station}
                    </td>
                    <td className="p-2 text-right text-slate-600">{s.totalKg} kg</td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      ₹{s.totalCostINR.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2 text-right text-slate-700">
                      {s.percentageOfCost}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Recommendations */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#12372A] mb-2">
              4. Immediate Actionable SOP Recommendations
            </h2>
            <div className="space-y-2 text-xs">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={rec.id}
                  className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-start gap-2"
                >
                  <span className="font-bold text-slate-700 font-mono">{i + 1}.</span>
                  <div>
                    <p className="font-bold text-[#12372A]">{rec.title}</p>
                    <p className="text-slate-600 mt-0.5">{rec.actionStep}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signoff / Audit Verification */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Prepared By:</p>
              <div className="mt-8 border-b border-slate-400 w-48" />
              <p className="text-[10px] text-slate-500 mt-1">Executive Chef / Food & Beverage Director</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-800">Verified & Approved:</p>
              <div className="mt-8 border-b border-slate-400 w-48 ml-auto" />
              <p className="text-[10px] text-slate-500 mt-1">General Manager / Financial Controller</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
