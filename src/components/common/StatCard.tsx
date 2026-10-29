import React from "react";
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number; // e.g. -14.2% or +5.0%
  trendInverted?: boolean; // In waste management, negative trend is GOOD (green)!
  variant?: "pine" | "sage" | "amber" | "tomato" | "neutral";
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendInverted = true, // By default for waste, cost reduction is good
  variant = "pine",
  tooltip,
}) => {
  const variantStyles = {
    pine: "bg-white border-[#D5DDD8] hover:border-[#2D6A4F]/60",
    sage: "bg-[#F3FAF5] border-[#D8F3DC] hover:border-[#74C69D]",
    amber: "bg-[#FFFBF0] border-[#FDE68A] hover:border-[#F59E0B]",
    tomato: "bg-[#FFF5F5] border-[#FECACA] hover:border-[#EF4444]",
    neutral: "bg-white border-[#E2E8F0] hover:border-slate-300",
  };

  const iconStyles = {
    pine: "bg-[#12372A]/10 text-[#12372A]",
    sage: "bg-[#2D6A4F]/10 text-[#2D6A4F]",
    amber: "bg-[#F59E0B]/10 text-[#D97706]",
    tomato: "bg-[#EF4444]/10 text-[#DC2626]",
    neutral: "bg-slate-100 text-slate-700",
  };

  // Trend formatting
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isZero = trend !== undefined && trend === 0;

  // If inverted (waste): negative reduction is GOOD (green), increase is BAD (red)
  const isGood = trendInverted ? isNegative : isPositive;
  const isBad = trendInverted ? isPositive : isNegative;

  return (
    <div
      title={tooltip}
      className={`rounded-xl p-4 sm:p-5 border shadow-card transition-all flex flex-col justify-between ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#52796F]">
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#162920] font-display">
              {value}
            </span>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg shrink-0 ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend !== undefined) && (
        <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-[#637C71] truncate">{subtitle}</span>
          )}

          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 font-medium text-[11px] px-1.5 py-0.5 rounded ${
                isGood
                  ? "bg-[#D8F3DC] text-[#1E4D3A]"
                  : isBad
                  ? "bg-[#FEE2E2] text-[#991B1B]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isZero && <Minus className="w-3 h-3" />}
              <span>
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
