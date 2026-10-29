import React from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  LayoutDashboard,
  Trash2,
  PlusCircle,
  Boxes,
  TrendingDown,
  FileText,
  Users,
  History,
  Settings,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  ChefHat,
  X,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "staff-dashboard"
  | "waste-log"
  | "record-waste"
  | "inventory"
  | "analytics"
  | "reports"
  | "staff-team"
  | "audit"
  | "settings"
  | "guidelines";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { isManager, user } = useAuth();

  const managerNavItems: NavItem[] = [
    {
      id: "dashboard" as NavTab,
      label: "Executive Dashboard",
      icon: LayoutDashboard,
      badge: "Live",
    },
    {
      id: "waste-log" as NavTab,
      label: "Waste Records & Log",
      icon: Trash2,
    },
    {
      id: "record-waste" as NavTab,
      label: "Record Food Waste",
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: "inventory" as NavTab,
      label: "Inventory & Stock",
      icon: Boxes,
    },
    {
      id: "analytics" as NavTab,
      label: "Cost-Saving Analytics",
      icon: TrendingDown,
    },
    {
      id: "reports" as NavTab,
      label: "Reports & CSV Export",
      icon: FileText,
    },
    {
      id: "staff-team" as NavTab,
      label: "Kitchen Staff Team",
      icon: Users,
    },
    {
      id: "audit" as NavTab,
      label: "Security Audit Trail",
      icon: History,
    },
    {
      id: "settings" as NavTab,
      label: "Budget & Settings",
      icon: Settings,
    },
  ];

  const staffNavItems: NavItem[] = [
    {
      id: "staff-dashboard" as NavTab,
      label: "Kitchen Station",
      icon: LayoutDashboard,
    },
    {
      id: "record-waste" as NavTab,
      label: "Record Food Waste",
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: "waste-log" as NavTab,
      label: "Recent Waste Entries",
      icon: Trash2,
    },
    {
      id: "inventory" as NavTab,
      label: "Available Stock Check",
      icon: Boxes,
    },
    {
      id: "guidelines" as NavTab,
      label: "Waste Reduction SOPs",
      icon: BookOpen,
    },
  ];

  const navItems = isManager ? managerNavItems : staffNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#FAF9F5] border-r border-[#D5DDD8] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="p-4 flex items-center justify-between border-b border-[#D5DDD8] lg:hidden">
            <span className="font-bold text-sm text-[#12372A]">
              Navigation Menu
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-500 hover:text-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Indicator Banner */}
          <div className="p-3.5 mx-3 mt-3 mb-2 rounded-lg bg-[#EAEFE9] border border-[#D5DDD8]/80 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#12372A]">
              {isManager ? (
                <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
              ) : (
                <ChefHat className="w-4 h-4 text-[#2D6A4F]" />
              )}
              <span>{isManager ? "Manager Mode" : "Staff Mode"}</span>
            </div>
            <p className="text-[11px] text-[#4F685D] mt-0.5 leading-snug">
              {isManager
                ? "Full administrative control, inventory & cost reports."
                : "Record waste & view kitchen stock availability."}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="px-2 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#12372A] text-white shadow-xs font-semibold"
                      : item.highlight
                      ? "bg-[#D8F3DC]/70 text-[#12372A] hover:bg-[#D8F3DC] border border-[#74C69D]/40 font-semibold"
                      : "text-[#2B3F36] hover:bg-[#EAEFE9] hover:text-[#12372A]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-[#F2C94C]"
                          : item.highlight
                          ? "text-[#2D6A4F]"
                          : "text-[#52796F]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#2D6A4F]/10 text-[#2D6A4F]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Project Info & Hotel Badge */}
        <div className="p-3.5 border-t border-[#D5DDD8] bg-[#F2F5F1] text-[11px] text-[#4F685D]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-[#12372A]">BCA Final Project</span>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-[#D5DDD8]">
              v1.0
            </span>
          </div>
          <p className="text-[10px] leading-tight text-[#637C71]">
            Hotel Food Waste Control & INR Cost-Saving System.
          </p>
        </div>
      </aside>
    </>
  );
};
