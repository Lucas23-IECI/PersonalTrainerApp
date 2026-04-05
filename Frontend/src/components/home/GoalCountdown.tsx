"use client";

import { daysUntil } from "@/data/profile";
import { Target } from "lucide-react";

interface Props {
  currentWeight: number;
  goalWeight: number;
  startWeight: number;
  brazilDate: string;
}

export default function GoalCountdown({ currentWeight, goalWeight, startWeight, brazilDate }: Props) {
  const daysLeft = daysUntil(brazilDate);
  const totalToLose = startWeight - goalWeight;
  const lost = startWeight - currentWeight;
  const progressPct = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100))) : 0;
  const remaining = Math.max(0, currentWeight - goalWeight);

  if (daysLeft <= 0) return null;

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent-soft)" }}
        >
          <Target size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.7rem] font-semibold" style={{ color: "var(--text)" }}>
              Meta: Brasil 2027
            </span>
            <span className="text-[0.6rem] font-bold" style={{ color: "var(--accent)" }}>
              {daysLeft} días
            </span>
          </div>
          <div className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
            {currentWeight} → {goalWeight} kg · {remaining.toFixed(1)} kg por bajar
          </div>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPct}%`, background: "var(--accent)" }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-[0.52rem]" style={{ color: "var(--text-muted)" }}>
          {progressPct}% completado
        </span>
      </div>
    </div>
  );
}
