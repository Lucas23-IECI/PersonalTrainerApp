"use client";

import { useMemo } from "react";
import { getMuscleBalanceScore } from "@/lib/muscle-goals";
import { Scale } from "lucide-react";

interface MuscleBalanceCardProps {
  weeklyData: Record<string, { sets: number }>;
}

export default function MuscleBalanceCard({ weeklyData }: MuscleBalanceCardProps) {
  const { score, details, recommendations } = useMemo(
    () => getMuscleBalanceScore(weeklyData),
    [weeklyData],
  );

  const color = score >= 80 ? "#34C759" : score >= 60 ? "#FFD60A" : "#FF453A";
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Bueno" : "Mejorable";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Scale size={20} style={{ color: "var(--accent)" }} />
        <span style={{ fontWeight: 600, color: "var(--text)" }}>Balance Muscular</span>
      </div>

      {/* Circular Score */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <svg width={130} height={130} viewBox="0 0 130 130">
          <circle
            cx={65} cy={65} r={radius}
            fill="none" stroke="var(--border)" strokeWidth={10}
          />
          <circle
            cx={65} cy={65} r={radius}
            fill="none" stroke={color} strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 65 65)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
          <text
            x={65} y={60} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 32, fontWeight: 700, fill: color }}
          >
            {score}
          </text>
          <text
            x={65} y={82} textAnchor="middle"
            style={{ fontSize: 12, fill: "var(--text-muted)" }}
          >
            {label}
          </text>
        </svg>
      </div>

      {/* Ratio Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {details.map((d) => {
          const pct = Math.round(d.ratio * 100);
          const barLeft = Math.min(pct, 100);
          return (
            <div key={d.category} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>{d.category}</span>
                <span style={{ color: "var(--text-muted)" }}>{d.label}</span>
              </div>
              <div
                style={{
                  height: 6, borderRadius: 3, background: "var(--border)",
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* Center marker */}
                <div
                  style={{
                    position: "absolute", left: "50%", top: 0, bottom: 0,
                    width: 1, background: "var(--text-muted)", opacity: 0.4,
                  }}
                />
                {/* Fill */}
                <div
                  style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${barLeft}%`, borderRadius: 3,
                    background: pct >= 80 ? "#34C759" : pct >= 60 ? "#FFD60A" : "#FF453A",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {recommendations.map((r, i) => (
            <span
              key={i}
              style={{ fontSize: 12, color: "#FFB300", lineHeight: 1.4 }}
            >
              💡 {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
