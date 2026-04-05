"use client";

import { MUSCLE_LABELS, type MuscleGroup } from "@/data/exercises";
import type { DailyRecommendation } from "@/lib/muscle-recommendations";
import { Zap } from "lucide-react";

interface DailyMuscleRecommendationProps {
  recommendations: DailyRecommendation[];
}

const PRIORITY_ICON: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
};

export default function DailyMuscleRecommendation({
  recommendations,
}: DailyMuscleRecommendationProps) {
  const filtered = recommendations
    .filter((r) => r.priority === "high" || r.priority === "medium")
    .sort((a, b) => (a.priority === "high" && b.priority !== "high" ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="card" style={{ background: "var(--bg-card)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Zap size={18} style={{ color: "var(--accent)" }} />
        <h3 style={{ margin: 0, color: "var(--text)", fontSize: 16 }}>
          Recomendación del Día
        </h3>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 14 }}>
          Todo en orden — descansá o entrená libre 💪
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((rec) => (
            <li
              key={rec.muscle}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}
            >
              <span>{PRIORITY_ICON[rec.priority]}</span>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>
                {MUSCLE_LABELS[rec.muscle as MuscleGroup]}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {rec.reason}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
