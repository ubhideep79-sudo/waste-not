import React, { useState } from "react";
import { TrendDataPoint, ReasonBreakdownItem, StationBreakdownItem } from "../../types/index.ts";

// ==========================================
// 1. TREND LINE & AREA CHART
// ==========================================
interface TrendAreaChartProps {
  data: TrendDataPoint[];
  metric?: "cost" | "weight";
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  data,
  metric = "cost",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        No trend records available for this selected date range.
      </div>
    );
  }

  const values = data.map((d) => (metric === "cost" ? d.totalCostINR : d.totalWeightKg));
  const maxVal = Math.max(...values, 10);
  const minVal = 0;

  const width = 680;
  const height = 240;
  const paddingX = 40;
  const paddingY = 24;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = data.map((d, i) => {
    const val = metric === "cost" ? d.totalCostINR : d.totalWeightKg;
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW;
    const y = height - paddingY - ((val - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, data: d, val };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
          height - paddingY
        } Z`
      : "";

  return (
    <div className="w-full relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="wasteCostGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = height - paddingY - pct * chartH;
          const gridVal = Math.round(minVal + pct * (maxVal - minVal));
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {metric === "cost" ? `₹${gridVal.toLocaleString()}` : `${gridVal}kg`}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <path d={areaD} fill="url(#wasteCostGradient)" />

        {/* Primary Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#2D6A4F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible larger hit circle */}
              <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
              {/* Visible dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? "5.5" : "3"}
                fill={isHovered ? "#F2C94C" : "#12372A"}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="transition-all"
              />
            </g>
          );
        })}

        {/* Bottom X-axis labels (sampled for readability) */}
        {points.map((p, i) => {
          const showLabel =
            i === 0 ||
            i === points.length - 1 ||
            i % Math.ceil(points.length / 6) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={i}
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              className="text-[9px] fill-slate-500 font-mono"
            >
              {p.data.label}
            </text>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-[#12372A] text-white p-2.5 rounded-lg shadow-xl text-xs border border-[#2D6A4F] transform -translate-x-1/2 -translate-y-full -mt-2 transition-all"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100}%`,
          }}
        >
          <p className="font-bold text-[#F2C94C] text-[11px] mb-1">
            {points[hoveredIndex].data.label}
          </p>
          <div className="space-y-0.5 text-[11px]">
            <p className="text-white flex justify-between gap-3">
              <span className="text-white/70">Waste Cost:</span>
              <span className="font-bold">
                ₹{points[hoveredIndex].data.totalCostINR.toLocaleString("en-IN")}
              </span>
            </p>
            <p className="text-white flex justify-between gap-3">
              <span className="text-white/70">Quantity:</span>
              <span className="font-semibold text-[#D8F3DC]">
                {points[hoveredIndex].data.totalWeightKg} kg
              </span>
            </p>
            <p className="text-white/70 flex justify-between gap-3">
              <span>Entries Logged:</span>
              <span>{points[hoveredIndex].data.entryCount}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. REASON DONUT CHART
// ==========================================
const REASON_COLORS: Record<string, string> = {
  Spoilage: "#E2482D", // Tomato
  Overproduction: "#F2C94C", // Lemon / gold
  "Preparation waste": "#2D6A4F", // Pine / forest green
  "Expired ingredients": "#8B5CF6", // Purple
  "Storage errors": "#0284C7", // Sky blue
  "Plate waste": "#EA580C", // Orange
  Other: "#64748B", // Slate
};

interface ReasonDonutChartProps {
  data: ReasonBreakdownItem[];
  totalCostINR: number;
}

export const ReasonDonutChart: React.FC<ReasonDonutChartProps> = ({
  data,
  totalCostINR,
}) => {
  const [hoveredReason, setHoveredReason] = useState<string | null>(null);

  if (!data || data.length === 0 || totalCostINR === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        No reason breakdown available.
      </div>
    );
  }

  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  const slices = data.map((item) => {
    const fraction = item.totalCostINR / totalCostINR;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...item,
      color: REASON_COLORS[item.reason] || "#64748B",
      strokeDasharray,
      strokeDashoffset,
      fraction,
    };
  });

  const activeSlice = slices.find((s) => s.reason === hoveredReason);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
      {/* SVG Donut */}
      <div className="relative w-44 h-44 shrink-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform -rotate-90"
        >
          {/* Base track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {slices.map((slice) => {
            const isHovered = hoveredReason === slice.reason;
            return (
              <circle
                key={slice.reason}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredReason(slice.reason)}
                onMouseLeave={() => setHoveredReason(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            {activeSlice ? activeSlice.reason : "Total Waste"}
          </span>
          <span className="text-sm font-bold text-[#12372A] font-display">
            ₹
            {(activeSlice ? activeSlice.totalCostINR : totalCostINR).toLocaleString(
              "en-IN"
            )}
          </span>
          {activeSlice && (
            <span className="text-[10px] text-emerald-700 font-bold">
              {activeSlice.percentageOfCost}% of total
            </span>
          )}
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 w-full space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {slices.map((slice) => {
          const isHovered = hoveredReason === slice.reason;
          return (
            <div
              key={slice.reason}
              onMouseEnter={() => setHoveredReason(slice.reason)}
              onMouseLeave={() => setHoveredReason(null)}
              className={`flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                isHovered ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-slate-700 truncate">{slice.reason}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-slate-900 font-medium">
                  ₹{slice.totalCostINR.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-400 w-8 text-right font-mono">
                  {slice.percentageOfCost}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. STATION BAR CHART
// ==========================================
interface StationBarChartProps {
  data: StationBreakdownItem[];
  maxCost?: number;
}

export const StationBarChart: React.FC<StationBarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        No station breakdown available.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.totalCostINR), 1);

  return (
    <div className="space-y-3 py-1">
      {data.map((item) => {
        const pctOfMax = (item.totalCostINR / maxVal) * 100;
        return (
          <div key={item.station} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#162920] truncate">
                {item.station}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-500 font-mono text-[11px]">
                  {item.totalKg} kg
                </span>
                <span className="font-semibold text-[#12372A] font-mono">
                  ₹{item.totalCostINR.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#2D6A4F] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, pctOfMax)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
