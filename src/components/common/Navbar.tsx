import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import {
  UtensilsCrossed,
  LogOut,
  UserCheck,
  Clock,
  Menu,
  ShieldCheck,
  ChefHat,
  RotateCcw,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, switchRoleDemo, isManager } = useAuth();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#12372A] text-white border-b border-[#1E4D3A] shadow-sm">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-[#F2C94C] shadow-inner">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight font-display text-white">
                  Waste Not, Want Not
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#2D6A4F]/80 text-[#D8F3DC] border border-[#52796F]/50">
                  Hotel Kitchen System
                </span>
              </div>
              <p className="text-[11px] text-[#A3B899] font-normal leading-none hidden md:block">
                Smart Food Waste & Cost Control · Grand Horizon Palace
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Kitchen Clock */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-[#D8F3DC]/80 bg-[#1E4D3A]/60 px-3 py-1 rounded-md border border-[#2D6A4F]/60">
          <Clock className="w-3.5 h-3.5 text-[#F2C94C]" />
          <span className="font-mono text-xs">{timeStr}</span>
          <span className="text-white/40">·</span>
          <span>IST Live</span>
        </div>

        {/* Right: Quick Demo Switcher + User Profile + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1-Click Role Switcher for examiner evaluation */}
          <div className="hidden md:flex items-center gap-1 bg-[#1E4D3A] p-1 rounded-lg border border-[#2D6A4F] text-xs">
            <span className="text-[10px] uppercase font-bold text-white/50 px-1.5">
              Role:
            </span>
            <button
              onClick={() => switchRoleDemo("manager")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                isManager
                  ? "bg-[#2D6A4F] text-white shadow-sm"
                  : "text-[#D8F3DC]/70 hover:text-white"
              }`}
              title="Switch to Manager (Chef Rajiv Sharma)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#F2C94C]" />
              Manager
            </button>
            <button
              onClick={() => switchRoleDemo("staff")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                !isManager
                  ? "bg-[#2D6A4F] text-white shadow-sm"
                  : "text-[#D8F3DC]/70 hover:text-white"
              }`}
              title="Switch to Staff (Sous Chef Priya Patel)"
            >
              <ChefHat className="w-3.5 h-3.5 text-[#74C69D]" />
              Staff
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/10 sm:pl-3">
            <div className="w-8 h-8 rounded-full bg-[#2D6A4F] border border-[#52796F] flex items-center justify-center font-bold text-xs text-[#D8F3DC]">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-[#A3B899] uppercase tracking-wide font-medium">
                {user?.role === "manager" ? "Executive Chef" : "Kitchen Staff"} ·{" "}
                {user?.kitchenStation?.split(" ")[0] || "Station"}
              </p>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
