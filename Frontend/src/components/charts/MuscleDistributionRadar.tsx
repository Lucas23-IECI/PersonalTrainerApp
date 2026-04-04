"use client";

import { useMemo, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getSessions } from "@/lib/storage";
import { MUSCLE_LABELS, type MuscleGroup } from "@/data/exercises";
import { Crosshair } from "lucide-react";

type TimeRange = "week" | "2weeks" | "month" | "all";

// Grouped muscle categories for cleaner radar
const MUSCLE_GROUPS: { label: string; muscles: MuscleGroup[] }[] = [
  { label: "Pecho", muscles: ["chest"] },
  { label: "Espalda", muscles: ["upper_back", "lats", "traps"] },
  { label: "Hombros", muscles: ["front_delts", "side_delts", "rear_delts"] },
  { label: "Bíceps", muscles: ["biceps"] },
  { label: "Tríceps", muscles: ["triceps"] },
  { label: "Core", muscles: ["abs", "obliques", "lower_back"] },
  { label: "Cuádriceps", muscles: ["quads"] },
  { label: "Isquios", muscles: ["hamstrings"] },
  { label: "Glúteos", muscles: ["glutes"] },
  { label: "Pantorrillas", muscles: ["calves"] },
];

interface RadarData {
  group: string;
  sets: number;
  volume: number;
  fullMark: number;
}

export default function MuscleDistributionRadar() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [metric, setMetric] = useState<"sets" | "volume">("sets");

  const { radarData, weakest, strongest } = useMemo(() => {
    const sessions = getSessions().filter((s) => s.completed);
    const now = new Date();
    const daysBack = timeRange === "week" ? 7 : timeRange === "2weeks" ? 14 : timeRange === "month" ? 30 : 9999;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const setsByMuscle = new Map<string, number>();
    const volByMuscle = new Map<string, number>();

    for (const s of sessions) {
      if (timeRange !== "all" && s.date < cutoffStr) continue;
      for (const ex of s.exercises) {
        if (ex.skipped || !ex.primaryMuscles) continue;
        for (const muscle of ex.primaryMuscles) {
          setsByMuscle.set(muscle, (setsByMuscle.get(muscle) || 0) + ex.sets.length);
          let vol = 0;
          for (const set of ex.sets) vol += (set.weight || 0) * set.reps;
          volByMuscle.set(muscle, (volByMuscle.get(muscle) || 0) + vol / ex.primaryMuscles.length);
        }
      }
    }

    const data: RadarData[] = MUSCLE_GROUPS.map((g) => {
      const sets = g.muscles.reduce((s, m) => s + (setsByMuscle.get(m) || 0), 0);
      const volume = Math.round(g.muscles.reduce((s, m) => s + (volByMuscle.get(m) || 0), 0));
      return { group: g.label, sets, volume, fullMark: 100 };
    });

    // Normalize to percentage of max
    const maxSets = Math.max(...data.map((d) => d.sets), 1);
    const maxVol = Math.max(...data.map((d) => d.volume), 1);
    for (const d of data) {
      d.sets = Math.round((d.sets / maxSets) * 100);
      d.volume = Math.round((d.volume / maxVol) * 100);
    }

    const val = metric === "sets" ? "sets" : "volume";
    const sorted = [...data].sort((a, b) => a[val] - b[val]);
    const weak = sorted.find((d) => d[val] > 0) || sorted[0];
    const strong = sorted[sorted.length - 1];

    return { radarData: data, weakest: weak, strongest: strong };
  }, [timeRange, metric]);

  const ranges: { id: TimeRange; label: string }[] = [
    { id: "week", label: "7d" },
    { id: "2weeks", label: "14d" },
    { id: "month", label: "30d" },
    { id: "all", label: "Todo" },
  ];

  const hasData = radarData.some((d) => d.sets > 0 || d.volume > 0);

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crosshair size={16} className="text-[#BF5AF2]" />
          <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">Distribución Muscular</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <div className="flex gap-0.5 p-0.5 rounded-lg flex-1" style={{ background: "var(--bg-elevated)" }}>
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id)}
              className="flex-1 text-[0.6rem] font-bold py-1.5 rounded-md cursor-pointer border-none transition-all"
              style={{
                background: timeRange === r.id ? "var(--bg-card)" : "transparent",
                color: timeRange === r.id ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          {(["sets", "volume"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="text-[0.6rem] font-bold py-1.5 px-2.5 rounded-md cursor-pointer border-none transition-all"
              style={{
                background: metric === m ? "var(--bg-card)" : "transparent",
                color: metric === m ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {m === "sets" ? "Sets" : "Vol"}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-5 text-zinc-400 text-[0.8rem]">
          Sin datos en este período
        </div>
      ) : (
        <>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="group"
                  tick={{ fontSize: 9, fill: "#A1A1AA" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1C1C1E",
                    border: "1px solid #38383A",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value}%`, metric === "sets" ? "Sets" : "Volumen"]}
                />
                <Radar
                  dataKey={metric}
                  stroke="#BF5AF2"
                  fill="#BF5AF2"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="py-1.5 px-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Más fuerte</div>
              <div className="text-[0.7rem] font-bold text-[#34C759]">{strongest.group}</div>
            </div>
            <div className="py-1.5 px-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-[0.5rem] text-zinc-500 uppercase">A mejorar</div>
              <div className="text-[0.7rem] font-bold text-[#FF9500]">{weakest.group}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
