"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSessions } from "@/lib/storage";
import { TrendingUp, ChevronDown } from "lucide-react";

interface E1RMDataPoint {
  date: string;
  label: string;
  e1rm: number;
  weight: number;
  reps: number;
}

export default function E1RMChart() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const { exerciseNames, chartData, trend } = useMemo(() => {
    const sessions = getSessions().filter((s) => s.completed);
    const exerciseMap = new Map<string, E1RMDataPoint[]>();

    for (const session of sessions) {
      for (const ex of session.exercises) {
        if (ex.skipped || ex.sets.length === 0) continue;
        // Find best e1RM set for this exercise in this session
        let bestE1RM = 0;
        let bestWeight = 0;
        let bestReps = 0;
        for (const set of ex.sets) {
          const w = set.weight || 0;
          const r = set.reps;
          if (w <= 0 || r <= 0) continue;
          const e1rm = w * (1 + r / 30); // Epley formula
          if (e1rm > bestE1RM) {
            bestE1RM = e1rm;
            bestWeight = w;
            bestReps = r;
          }
        }
        if (bestE1RM > 0) {
          if (!exerciseMap.has(ex.name)) exerciseMap.set(ex.name, []);
          exerciseMap.get(ex.name)!.push({
            date: session.date,
            label: session.date.slice(5),
            e1rm: Math.round(bestE1RM * 10) / 10,
            weight: bestWeight,
            reps: bestReps,
          });
        }
      }
    }

    // Only exercises with 2+ data points
    const names = Array.from(exerciseMap.entries())
      .filter(([, data]) => data.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name]) => name);

    const selected = selectedExercise && names.includes(selectedExercise)
      ? selectedExercise
      : names[0] || null;

    const data = selected ? exerciseMap.get(selected) || [] : [];

    // Calculate trend
    let trendVal = 0;
    if (data.length >= 2) {
      const first = data[0].e1rm;
      const last = data[data.length - 1].e1rm;
      trendVal = last - first;
    }

    return { exerciseNames: names, chartData: data, trend: trendVal };
  }, [selectedExercise]);

  const activeExercise = selectedExercise && exerciseNames.includes(selectedExercise)
    ? selectedExercise
    : exerciseNames[0] || null;

  if (exerciseNames.length === 0) {
    return (
      <div className="card mb-3.5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} style={{ color: "var(--accent)" }} />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>1RM Estimado</div>
        </div>
        <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
          Necesitás al menos 2 sesiones de un ejercicio
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: "var(--accent)" }} />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>1RM Estimado</div>
        </div>
        {trend !== 0 && (
          <div className={`text-[0.65rem] font-bold ${trend > 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
            {trend > 0 ? "+" : ""}{trend.toFixed(1)}kg
          </div>
        )}
      </div>

      {/* Exercise selector */}
      <div className="relative mb-3">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[0.78rem] font-semibold border-none cursor-pointer"
          style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
        >
          <span className="truncate">{activeExercise}</span>
          <ChevronDown size={14} className="transition-transform" style={{ color: "var(--text-muted)", transform: showSelector ? "rotate(180deg)" : undefined }} />
        </button>
        {showSelector && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-y-auto z-10"
            style={{ background: "var(--bg-elevated)", maxHeight: 200, border: "1px solid var(--border)" }}
          >
            {exerciseNames.map((name) => (
              <button
                key={name}
                onClick={() => { setSelectedExercise(name); setShowSelector(false); }}
                className="w-full text-left px-3 py-2 text-[0.72rem] border-none cursor-pointer"
                style={{
                  background: name === activeExercise ? "var(--bg-card)" : "transparent",
                  color: name === activeExercise ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={{ stroke: "var(--border-subtle)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 5", "dataMax + 5"]}
              tickFormatter={(v) => `${Math.round(Number(v))}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--text)" }}
              itemStyle={{ color: "var(--accent)" }}
              formatter={(value, _name, props) => {
                const p = props.payload as E1RMDataPoint;
                return [`${value}kg (${p.weight}×${p.reps})`, "e1RM"];
              }}
            />
            <Line
              type="monotone"
              dataKey="e1rm"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--accent)", stroke: "var(--bg-card)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "var(--accent)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Last 3 values */}
      {chartData.length >= 2 && (
        <div className="flex gap-2 mt-3">
          {chartData.slice(-3).map((d, i) => (
            <div key={i} className="flex-1 text-center py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-[0.7rem] font-bold">~{Math.round(d.e1rm)}kg</div>
              <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>{d.weight}×{d.reps} · {d.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
