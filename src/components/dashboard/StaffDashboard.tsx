import React, { useState, useEffect } from "react";
import { WasteRecord, Ingredient } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  PlusCircle,
  Clock,
  Boxes,
  CheckCircle,
  Scale,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface StaffDashboardProps {
  onOpenRecordModal: () => void;
  onNavigateToMyWaste: () => void;
  onNavigateToInventory: () => void;
  onNavigateToGuidelines: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onOpenRecordModal,
  onNavigateToMyWaste,
  onNavigateToInventory,
  onNavigateToGuidelines,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [myRecords, setMyRecords] = useState<WasteRecord[]>([]);
  const [criticalInventory, setCriticalInventory] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todaySummary, setTodaySummary] = useState<{
    count: number;
    totalKg: number;
    totalCostINR: number;
  }>({ count: 0, totalKg: 0, totalCostINR: 0 });

  useEffect(() => {
    const loadStaffData = async () => {
      setIsLoading(true);
      try {
        const [wasteRes, ingRes] = await Promise.all([
          api.getWasteRecords({ myEntriesOnly: true, limit: 10 }),
          api.getIngredients({ lowStock: true }),
        ]);

        setMyRecords(wasteRes.records);
        setCriticalInventory(ingRes.ingredients.slice(0, 6));

        // Calculate today's entries
        const todayStr = new Date().toISOString().split("T")[0];
        const todayEntries = wasteRes.records.filter((r) =>
          r.recordDate.startsWith(todayStr)
        );

        const totalKg = todayEntries.reduce((sum, r) => sum + r.normalizedKg, 0);
        const totalCostINR = todayEntries.reduce((sum, r) => sum + r.totalCost, 0);

        setTodaySummary({
          count: todayEntries.length,
          totalKg: Number(totalKg.toFixed(2)),
          totalCostINR: Math.round(totalCostINR),
        });
      } catch (err: any) {
        toast.error("Failed to load staff station data: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaffData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Quick Action */}
      <div className="bg-[#12372A] rounded-xl p-6 text-white border border-[#1E4D3A] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D8F3DC]">
            <Clock className="w-4 h-4 text-[#F2C94C]" />
            <span>Active Shift · {user?.kitchenStation || "Main Kitchen"}</span>
          </div>
          <h1 className="text-2xl font-bold font-display mt-1 text-white">
            Chef Station: {user?.name || "Kitchen Staff"}
          </h1>
          <p className="text-xs text-[#A3B899] mt-1 max-w-xl">
            Record every discarded prep scrap, plate return, or expired ingredient immediately to maintain kitchen yield standards and cost transparency.
          </p>
        </div>

        <button
          onClick={onOpenRecordModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#2D6A4F] hover:bg-[#398363] text-white font-bold text-sm shadow-md transition-all shrink-0 border border-[#52796F]"
        >
          <PlusCircle className="w-5 h-5 text-[#F2C94C]" />
          <span>Record Food Waste Now</span>
        </button>
      </div>

      {/* Today's Shift Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
              My Discarded Items (Today)
            </p>
            <p className="text-xl font-bold text-[#12372A] font-display mt-0.5">
              {todaySummary.count} entries
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#12372A]/10 text-[#12372A]">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
              Shift Wasted Weight
            </p>
            <p className="text-xl font-bold text-[#12372A] font-display mt-0.5">
              {todaySummary.totalKg} kg
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
              Shift Waste Cost (INR)
            </p>
            <p className="text-xl font-bold text-[#12372A] font-display mt-0.5">
              ₹{todaySummary.totalCostINR.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Recent Submitted Waste Entries */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D5DDD8] shadow-card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-[#12372A] font-display">
                My Recent Waste Entries
              </h2>
              <p className="text-[11px] text-[#52796F]">
                Entries logged by you (editable within 24 hours)
              </p>
            </div>
            <button
              onClick={onNavigateToMyWaste}
              className="text-xs font-semibold text-[#2D6A4F] hover:text-[#12372A] flex items-center gap-1"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading recent entries...
            </div>
          ) : myRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No waste entries logged by you yet. Click "Record Food Waste Now" above to add your first entry.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Cost (INR)</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(r.recordDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#12372A]">
                        {r.ingredientName}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium">
                        {r.quantity} {r.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#12372A]">
                        ₹{r.totalCost.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {r.reason}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                        {r.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Critical Stock Alerts + Quick SOP Guide */}
        <div className="space-y-6">
          {/* Critical Pantry Items */}
          <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-bold text-[#12372A] uppercase tracking-wider">
                  Low Stock Ingredients
                </h2>
              </div>
              <button
                onClick={onNavigateToInventory}
                className="text-[11px] font-semibold text-[#2D6A4F] hover:text-[#12372A]"
              >
                All Stock
              </button>
            </div>

            {criticalInventory.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                All pantry ingredients are well-stocked.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {criticalInventory.map((item) => (
                  <div
                    key={item._id}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.storageLocation}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-amber-700">
                        {item.availableQuantity} {item.unit}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Reorder ≤{item.reorderLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Reduction Guidelines Card */}
          <div className="bg-[#FAF9F5] rounded-xl border border-[#D5DDD8] p-5">
            <div className="flex items-center gap-2 mb-2 text-[#12372A]">
              <BookOpen className="w-4 h-4 text-[#2D6A4F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Kitchen Waste SOP Reminders
              </h3>
            </div>
            <ul className="text-xs text-[#4F685D] space-y-2 mt-3 list-disc pl-4 leading-relaxed">
              <li>
                <strong>FIFO Principle:</strong> Always rotate older crates to the front when restocking the walk-in chiller.
              </li>
              <li>
                <strong>Progressive Replenishment:</strong> Prepare only 60% of banquet covers upfront; replenish in shallow pans as needed.
              </li>
              <li>
                <strong>Trim Re-use:</strong> Clean vegetable trimmings and meat bones must be frozen for stock and sauce reductions.
              </li>
            </ul>

            <button
              onClick={onNavigateToGuidelines}
              className="mt-4 w-full py-2 rounded-lg bg-white border border-[#D5DDD8] text-xs font-semibold text-[#12372A] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Read Full Waste Reduction Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
