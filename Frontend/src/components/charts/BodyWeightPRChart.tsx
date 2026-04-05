"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getCheckins, getSessions, type DailyCheckin } from "@/lib/storage";
import { Scale, Trophy } from "lucide-react";

interface ChartPoint {
  date: string;
  label: string;
  weight?: number;
  bestE1RM?: number;
  bestWeight?: number;
}

export default function BodyWeightPRChart() {
  const [showPRs, setShowPRs] = useState(true);

  const { chartData, hasWeights, hasPRs } = useMemo(() => {
    const checkins = getCheckins()
      .filter((c) => c.weight)
      .sort((a, b) => a.date.localeCompare(b.date));

    const sessions = getSessions().filter((s) => s.completed);

    // Build date-indexed PR map: best e1RM per date across all exercises
    const prByDate = new Map<string, { e1rm: number; weight: number }>();
    for (const s of sessions) {
      let bestE1RM = 0;
      let bestW = 0;
      for (const ex of s.exercises) {
        if (ex.skipped) continue;
        for (const set of ex.sets) {
          const w = set.weight || 0;
          const r = set.reps;
          if (w <= 0 || r <= 0) continue;
          const e1rm = w * (1 + r / 30);
          if (e1rm > bestE1RM) {
            bestE1RM = e1rm;
            bestW = w;
          }
        }
      }
      if (bestE1RM > 0) {
        const existing = prByDate.get(s.date);
        if (!existing || bestE1RM > existing.e1rm) {
          prByDate.set(s.date, { e1rm: Math.round(bestE1RM * 10) / 10, weight: bestW });
        }
      }
    }

    // Merge all dates
    const allDates = new Set<string>();
    checkins.forEach((c) => allDates.add(c.date));
    prByDate.forEach((_, d) => allDates.add(d));

    const sortedDates = Array.from(allDates).sort().slice(-30);
    const checkinMap = new Map<string, DailyCheckin>();
    checkins.forEach((c) => checkinMap.set(c.date, c));

    const data: ChartPoint[] = sortedDates.map((date) => {
      const ci = checkinMap.get(date);
      const pr = prByDate.get(date);
      return {
        date,
        label: date.slice(5),
        weight: ci?.weight,
        bestE1RM: pr?.e1rm,
        bestWeight: pr?.weight,
      };
    });

    return {
      chartData: data,
      hasWeights: checkins.length >= 2,
      hasPRs: prByDate.size > 0,
    };
  }, []);

  if (!hasWeights && !hasPRs) {
    return (
      <div className="card mb-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={16} className="text-[#64D2FF]" />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Peso + Fuerza</div>
        </div>
        <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
          Necesitás pesajes y sesiones para ver este gráfico
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-[#64D2FF]" />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Peso Corporal + PRs</div>
        </div>
        <button
          onClick={() => setShowPRs(!showPRs)}
          className="flex items-center gap-1 text-[0.6rem] px-2 py-1 rounded-md border-none cursor-pointer"
          style={{
            background: showPRs ? "rgba(255,215,0,0.15)" : "var(--bg-elevated)",
            color: showPRs ? "#FFD700" : "var(--text-muted)",
          }}
        >
          <Trophy size={10} />
          PRs
        </button>
      </div>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#636366" }}
              axisLine={{ stroke: "var(--border-subtle)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="weight"
              tick={{ fontSize: 9, fill: "#64D2FF" }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 1", "dataMax + 1"]}
              tickFormatter={(v) => `${Math.round(Number(v))}`}
            />
            {showPRs && (
              <YAxis
                yAxisId="e1rm"
                orientation="right"
                tick={{ fontSize: 9, fill: "#FFD700" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(Number(v))}`}
              />
            )}
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#F5F5F7" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#636366" }}
            />
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              name="Peso (kg)"
              stroke="#64D2FF"
              strokeWidth={2}
              dot={{ r: 3, fill: "#64D2FF", stroke: "var(--bg-card)", strokeWidth: 2 }}
              connectNulls
            />
            {showPRs && (
              <Bar
                yAxisId="e1rm"
                dataKey="bestE1RM"
                name="Mejor e1RM"
                fill="#FFD700"
                opacity={0.4}
                barSize={8}
                radius={[3, 3, 0, 0]}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
