import React from "react";
import { BookOpen, CheckCircle, AlertTriangle, ShieldCheck, Scale, Sparkles } from "lucide-react";

export const GuidelinesView: React.FC = () => {
  const sops = [
    {
      title: "1. FIFO (First-In, First-Out) Storage Protocol",
      station: "All Storage Areas",
      rules: [
        "Store new incoming deliveries behind existing stock in walk-in chillers and dry pantries.",
        "Inspect crate dates daily during morning and evening shift handovers.",
        "Apply color-coded day dots on opened bulk packages (dairy, sauces, stocks).",
      ],
    },
    {
      title: "2. Progressive Banquet Line Replenishment",
      station: "Banquet & Hot Production",
      rules: [
        "Never load 100% of buffet covers into deep chafing dishes at the beginning of service.",
        "Load 60% of forecast at service start; utilize shallow 2-inch insert pans for the remaining 40%.",
        "Monitor attendance curves: stop replenishing hot proteins 45 minutes prior to service end.",
      ],
    },
    {
      title: "3. Precision Butchery & Trim Utilization",
      station: "Butchery & Garde Manger",
      rules: [
        "Clean butcher station knives twice daily; dull blades increase sinew and meat yield waste by up to 14%.",
        "Collect all clean poultry and lamb bones for daily master stock kettles.",
        "Store trimmed vegetable ends (celery, carrots, onion skins) in designated labeled stock tubs.",
      ],
    },
    {
      title: "4. Daily Plate Waste Auditing",
      station: "Dishwashing & Stewarding",
      rules: [
        "Stewarding staff must separate uneaten plate returns into scrap bins for weight verification.",
        "Consistently returned buffet dishes indicate portion size over-allocation or recipe seasoning adjustments required.",
        "Log buffet clearing weights nightly by 23:30 hours.",
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#12372A] font-display">
          Hotel Kitchen Food Waste SOPs & Reduction Guidelines
        </h1>
        <p className="text-xs text-[#52796F]">
          Operational protocols designed to achieve the hotel's 18% cost reduction objective
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sops.map((sop) => (
          <div
            key={sop.title}
            className="p-5 rounded-xl border border-[#D5DDD8] bg-white shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-[#1E4D3A] uppercase tracking-wider bg-[#D8F3DC] px-2 py-0.5 rounded border border-[#74C69D]/40">
                  {sop.station}
                </span>
                <CheckCircle className="w-4 h-4 text-[#2D6A4F]" />
              </div>

              <h2 className="text-sm font-bold text-[#12372A] mb-3">
                {sop.title}
              </h2>

              <ul className="space-y-2 text-xs text-[#4F685D]">
                {sop.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] font-bold">›</span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
