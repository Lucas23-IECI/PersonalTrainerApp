"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getSessions } from "@/lib/storage";
import { MUSCLE_LABELS, type MuscleGroup } from "@/data/exercises";
import { Target } from "lucide-react";

const MUSCLE_COLORS: Record<string, string> = {
  chest: "#FF453A",
  front_delts: "#FF6B6B",
  side_delts: "#FF9500",
  rear_delts: "#FFB340",
  triceps: "#FF375F",
  biceps: "#30D158",
  forearms: "#63E6BE",
  upper_back: "#0A84FF",
  lats: "#5E5CE6",
  lower_back: "#BF5AF2",
  traps: "#64D2FF",
  abs: "#FFD60A",
  obliques: "#FFCC00",
  quads: "#32D74B",
  hamstrings: "#AC8E68",
  glutes: "#FF6482",
  calves: "#66D4CF",
  hip_flexors: "#DA8FFF",
  adductors: "#A1845E",
};

type TimeRange = "week" | "2weeks" | "month";

export default function MuscleVolumeChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const chartData = useMemo(() => {
    const sessions = getSessions().filter((s) => s.completed);
    const now = new Date();
    const daysBack = timeRange === "week" ? 7 : timeRange === "2weeks" ? 14 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const volumeByMuscle = new Map<string, number>();

    for (const session of sessions) {
      if (session.date < cutoffStr) continue;
      for (const ex of session.exercises) {
        if (ex.skipped || !ex.primaryMuscles) continue;
        let exVolume = 0;
        for (const set of ex.sets) {
          exVolume += (set.weight || 0) * set.reps;
        }
        if (exVolume <= 0) continue;
        // Distribute volume across primary muscles
        const share = exVolume / ex.primaryMuscles.length;
        for (const muscle of ex.primaryMuscles) {
          volumeByMuscle.set(muscle, (volumeByMuscle.get(muscle) || 0) + share);
        }
      }
    }

    return Array.from(volumeByMuscle.entries())
      .map(([muscle, volume]) => ({
        muscle,
        label: MUSCLE_LABELS[muscle as MuscleGroup] || muscle,
        volume: Math.round(volume),
        color: MUSCLE_COLORS[muscle] || "#636366",
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [timeRange]);

  const totalVolume = chartData.reduce((s, d) => s + d.volume, 0);
  const ranges: { id: TimeRange; label: string }[] = [
    { id: "week", label: "7d" },
    { id: "2weeks", label: "14d" },
    { id: "month", label: "30d" },
  ];

  if (chartData.length === 0) {
    return (
      <div className="card mb-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Target size={16} className="text-[#FF9500]" />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Volumen por Músculo</div>
        </div>
        <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
          Sin datos de volumen en este período
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[#FF9500]" />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Volumen por Músculo</div>
        </div>
        <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
          {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}kg total
        </div>
      </div>

      {/* Time range selector */}
      <div className="flex gap-1 mb-3 p-0.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
        {ranges.map((r) => (
          <button
            key={r.id}
            onClick={() => setTimeRange(r.id)}
            className="flex-1 text-[0.65rem] font-bold py-1.5 rounded-md cursor-pointer border-none transition-all"
            style={{
              background: timeRange === r.id ? "var(--bg-card)" : "transparent",
              color: timeRange === r.id ? "var(--text)" : "var(--text-muted)",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: Math.max(180, chartData.length * 28) }}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 9, fill: "#636366" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => Number(v) > 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : `${v}`}
            />
            <YAxis
              dataKey="label"
              type="category"
              tick={{ fontSize: 10, fill: "#A1A1AA" }}
              axisLine={false}
              tickLine={false}
              width={85}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#F5F5F7" }}
              formatter={(value) => [`${Number(value).toLocaleString()}kg`, "Volumen"]}
            />
            <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
