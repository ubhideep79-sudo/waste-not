import React, { useState, useEffect } from "react";
import { AppSettings } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { ConfirmDialog } from "../common/ConfirmDialog.tsx";
import {
  Settings,
  Building2,
  IndianRupee,
  Target,
  RotateCcw,
  Check,
  AlertTriangle,
  Clock,
} from "lucide-react";

export const SettingsModal: React.FC = () => {
  const toast = useToast();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [hotelName, setHotelName] = useState<string>("");
  const [hotelLocation, setHotelLocation] = useState<string>("");
  const [monthlyWasteBudgetINR, setMonthlyWasteBudgetINR] = useState<string>("75000");
  const [costReductionGoalPercent, setCostReductionGoalPercent] = useState<string>("18");
  const [allowStaffEditHours, setAllowStaffEditHours] = useState<string>("24");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Demo reset state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
      setHotelName(res.settings.hotelName);
      setHotelLocation(res.settings.hotelLocation || "");
      setMonthlyWasteBudgetINR(String(res.settings.monthlyWasteBudgetINR));
      setCostReductionGoalPercent(String(res.settings.costReductionGoalPercent));
      setAllowStaffEditHours(String(res.settings.allowStaffEditHours || 24));
    } catch (err: any) {
      toast.error("Failed to load settings: " + err.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.updateSettings({
        hotelName,
        hotelLocation,
        monthlyWasteBudgetINR: parseFloat(monthlyWasteBudgetINR) || 75000,
        costReductionGoalPercent: parseFloat(costReductionGoalPercent) || 18,
        allowStaffEditHours: parseFloat(allowStaffEditHours) || 24,
      });
      toast.success("Hotel waste control settings updated successfully.");
      loadSettings();
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData();
      toast.success("Database restored to fresh hotel demo data!");
      setIsResetConfirmOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset demo data.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-[#12372A] font-display">
          Hotel Settings & Waste Budget Goals
        </h1>
        <p className="text-xs text-[#52796F]">
          Configure property branding, monthly waste financial ceiling, and staff access policies
        </p>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card p-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Hotel Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Hotel Property Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Property Location / City
              </label>
              <input
                type="text"
                value={hotelLocation}
                onChange={(e) => setHotelLocation(e.target.value)}
                placeholder="e.g. New Delhi / Mumbai"
                className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
              />
            </div>
          </div>

          {/* Budget Ceiling & Target Percentage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Monthly Waste Loss Threshold (INR ₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={monthlyWasteBudgetINR}
                  onChange={(e) => setMonthlyWasteBudgetINR(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
                />
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
              <p className="text-[11px] text-[#637C71] mt-1">
                Upper financial limit before waste warnings trigger across dashboards.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Cost Reduction Goal Target (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max="90"
                  value={costReductionGoalPercent}
                  onChange={(e) => setCostReductionGoalPercent(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
                />
                <Target className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
              <p className="text-[11px] text-[#637C71] mt-1">
                Used to project potential monthly savings in analytics audits.
              </p>
            </div>
          </div>

          {/* Staff Edit Window */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Staff Self-Edit Time Window (Hours)
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="1"
                max="72"
                value={allowStaffEditHours}
                onChange={(e) => setAllowStaffEditHours(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
            <p className="text-[11px] text-[#637C71] mt-1">
              Hours after submission during which staff can modify their own waste logs.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-[#74C69D]" />
              )}
              <span>Save Kitchen Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Demo Database Reset */}
      <div className="bg-[#FFFBF0] rounded-xl border border-[#FDE68A] p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Project Examiner / Evaluation Demo Reset</span>
            </div>
            <p className="text-xs text-amber-800 mt-1 max-w-xl leading-relaxed">
              Reset the database back to initial BCA demonstration state: 18 pantry ingredients, 4 chef user accounts, and 45 historical food waste records over the past 35 days.
            </p>
          </div>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Seed</span>
          </button>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDemo}
        title="Reset Entire Database to Seed Data?"
        message="This will overwrite all active ingredients and waste entries with fresh 35-day historical demo records for presentation and testing. Are you sure?"
        confirmLabel="Reset Everything"
        isDestructive={true}
        isLoading={isResetting}
      />
    </div>
  );
};
