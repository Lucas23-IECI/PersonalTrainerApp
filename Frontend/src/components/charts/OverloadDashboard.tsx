"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  BarChart,
  Bar,
} from "recharts";
import { getSessions } from "@/lib/storage";
import { TrendingUp, TrendingDown, Minus, ChevronDown, Zap, Target, Award } from "lucide-react";

interface DataPoint {
  date: string;
  label: string;
  topWeight: number;
  topReps: number;
  e1rm: number;
  totalVolume: number;
  sets: number;
  isPR: boolean;
}

interface ExerciseStats {
  name: string;
  dataPoints: DataPoint[];
  currentE1RM: number;
  startE1RM: number;
  prDate: string | null;
  totalSessions: number;
}

export default function OverloadDashboard() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [chartMode, setChartMode] = useState<"e1rm" | "volume" | "weight">("e1rm");

  const { exerciseNames, stats } = useMemo(() => {
    const sessions = getSessions().filter((s) => s.completed);
    const map = new Map<string, DataPoint[]>();

    for (const session of sessions) {
      for (const ex of session.exercises) {
        if (ex.skipped || ex.sets.length === 0) continue;

        let topWeight = 0;
        let topReps = 0;
        let bestE1rm = 0;
        let totalVolume = 0;

        for (const set of ex.sets) {
          const w = set.weight || 0;
          const r = set.reps;
          if (w <= 0 || r <= 0) continue;
          const e1rm = w * (1 + r / 30);
          totalVolume += w * r;
          if (e1rm > bestE1rm) {
            bestE1rm = e1rm;
            topWeight = w;
            topReps = r;
          }
        }

        if (bestE1rm > 0) {
          if (!map.has(ex.name)) map.set(ex.name, []);
          map.get(ex.name)!.push({
            date: session.date,
            label: session.date.slice(5),
            topWeight,
            topReps,
            e1rm: Math.round(bestE1rm * 10) / 10,
            totalVolume: Math.round(totalVolume),
            sets: ex.sets.filter((s) => (s.weight || 0) > 0 && s.reps > 0).length,
            isPR: false,
          });
        }
      }
    }

    // Sort each exercise's data by date and mark PRs
    for (const [, points] of map) {
      points.sort((a, b) => a.date.localeCompare(b.date));
      let maxE1rm = 0;
      for (const p of points) {
        if (p.e1rm > maxE1rm) {
          maxE1rm = p.e1rm;
          p.isPR = true;
        }
      }
    }

    const names = Array.from(map.entries())
      .filter(([, d]) => d.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([n]) => n);

    const sel = selectedExercise && names.includes(selectedExercise) ? selectedExercise : names[0] || null;
    const data = sel ? map.get(sel) || [] : [];

    let currentE1RM = 0;
    let startE1RM = 0;
    let prDate: string | null = null;

    if (data.length > 0) {
      startE1RM = data[0].e1rm;
      currentE1RM = data[data.length - 1].e1rm;
      const prPoint = [...data].reverse().find((p) => p.isPR);
      prDate = prPoint?.date || null;
    }

    const st: ExerciseStats = {
      name: sel || "",
      dataPoints: data,
      currentE1RM,
      startE1RM,
      prDate,
      totalSessions: data.length,
    };

    return { exerciseNames: names, stats: st };
  }, [selectedExercise]);

  if (exerciseNames.length === 0) {
    return (
      <div className="card mb-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-[#FF9500]" />
          <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">Sobrecarga Progresiva</div>
        </div>
        <div className="text-center py-5 text-zinc-400 text-[0.8rem]">
          Necesitás al menos 2 sesiones con el mismo ejercicio
        </div>
      </div>
    );
  }

  const { dataPoints, currentE1RM, startE1RM, prDate, totalSessions } = stats;
  const delta = currentE1RM - startE1RM;
  const deltaPct = startE1RM > 0 ? ((delta / startE1RM) * 100).toFixed(1) : "0";

  // Recent trend (last 3 vs prev 3)
  let recentTrend: "up" | "down" | "flat" = "flat";
  if (dataPoints.length >= 4) {
    const recent = dataPoints.slice(-3);
    const prev = dataPoints.slice(-6, -3);
    if (prev.length > 0) {
      const avgRecent = recent.reduce((a, p) => a + p.e1rm, 0) / recent.length;
      const avgPrev = prev.reduce((a, p) => a + p.e1rm, 0) / prev.length;
      if (avgRecent > avgPrev * 1.01) recentTrend = "up";
      else if (avgRecent < avgPrev * 0.99) recentTrend = "down";
    }
  }

  const prPoints = dataPoints.filter((p) => p.isPR);
  const chartKey = chartMode === "e1rm" ? "e1rm" : chartMode === "volume" ? "totalVolume" : "topWeight";
  const chartColor = chartMode === "e1rm" ? "#2C6BED" : chartMode === "volume" ? "#34C759" : "#FF9500";
  const chartLabel = chartMode === "e1rm" ? "E1RM (kg)" : chartMode === "volume" ? "Volumen (kg)" : "Peso (kg)";

  return (
    <div className="card mb-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#FF9500]" />
          <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">Sobrecarga Progresiva</div>
        </div>
      </div>

      {/* Exercise selector */}
      <div className="relative mb-3">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="w-full flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-[0.8rem] font-semibold"
        >
          <span className="truncate">{stats.name}</span>
          <ChevronDown size={14} className={`text-zinc-400 transition-transform ${showSelector ? "rotate-180" : ""}`} />
        </button>
        {showSelector && (
          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700">
            {exerciseNames.map((name) => (
              <button
                key={name}
                onClick={() => { setSelectedExercise(name); setShowSelector(false); }}
                className={`w-full text-left px-3 py-2 text-[0.75rem] hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                  name === stats.name ? "font-bold text-[#2C6BED]" : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2 text-center">
          <div className="text-[0.55rem] text-zinc-400 uppercase mb-0.5">E1RM Actual</div>
          <div className="text-base font-black">{currentE1RM.toFixed(1)}</div>
          <div className="text-[0.5rem] text-zinc-400">kg</div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2 text-center">
          <div className="text-[0.55rem] text-zinc-400 uppercase mb-0.5">Progreso</div>
          <div className={`text-base font-black flex items-center justify-center gap-0.5 ${
            delta > 0 ? "text-[#34C759]" : delta < 0 ? "text-red-500" : ""
          }`}>
            {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}
          </div>
          <div className="text-[0.5rem] text-zinc-400">{deltaPct}%</div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2 text-center">
          <div className="text-[0.55rem] text-zinc-400 uppercase mb-0.5">Sesiones</div>
          <div className="text-base font-black">{totalSessions}</div>
          <div className="text-[0.5rem] text-zinc-400">registros</div>
        </div>
      </div>

      {/* Trend badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold ${
          recentTrend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
          recentTrend === "down" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        }`}>
          {recentTrend === "up" ? <TrendingUp size={10} /> : recentTrend === "down" ? <TrendingDown size={10} /> : <Minus size={10} />}
          {recentTrend === "up" ? "Progresando" : recentTrend === "down" ? "Bajando" : "Estable"}
        </div>
        {prDate && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[0.6rem] font-semibold">
            <Award size={10} />
            PR: {prDate.slice(5)}
          </div>
        )}
      </div>

      {/* Chart mode tabs */}
      <div className="flex gap-1 mb-2">
        {([
          { key: "e1rm" as const, label: "E1RM", icon: Target },
          { key: "volume" as const, label: "Volumen", icon: Zap },
          { key: "weight" as const, label: "Peso", icon: TrendingUp },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setChartMode(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[0.6rem] font-semibold transition-colors ${
              chartMode === key
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* Main chart */}
      <div className="h-[180px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataPoints}>
            <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card, #fff)",
                border: "1px solid var(--border-subtle, #e4e4e7)",
                borderRadius: 8,
                fontSize: 11,
                padding: "6px 10px",
              }}
              formatter={(value) => [`${value} kg`, chartLabel]}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Line
              type="monotone"
              dataKey={chartKey}
              stroke={chartColor}
              strokeWidth={2}
              dot={{ r: 3, fill: chartColor }}
              activeDot={{ r: 5 }}
            />
            {/* PR markers on e1rm mode */}
            {chartMode === "e1rm" && prPoints.map((p, i) => (
              <ReferenceDot
                key={i}
                x={p.label}
                y={p.e1rm}
                r={6}
                fill="#FF9500"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Volume bars */}
      {chartMode === "volume" && (
        <div className="h-[100px] -ml-2 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPoints}>
              <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={35} />
              <Bar dataKey="totalVolume" fill="#34C759" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions table */}
      <div className="mt-3">
        <div className="text-[0.6rem] text-zinc-400 uppercase tracking-wider mb-1.5">Últimas sesiones</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[0.65rem]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="text-[0.5rem] text-zinc-400 uppercase">
                <th className="text-left py-1 font-semibold">Fecha</th>
                <th className="text-center py-1 font-semibold">Peso</th>
                <th className="text-center py-1 font-semibold">Reps</th>
                <th className="text-center py-1 font-semibold">Sets</th>
                <th className="text-right py-1 font-semibold">E1RM</th>
              </tr>
            </thead>
            <tbody>
              {[...dataPoints].reverse().slice(0, 8).map((p, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border-subtle, #e4e4e7)" }}>
                  <td className="py-1.5 text-zinc-500">{p.label}</td>
                  <td className="py-1.5 text-center font-bold">{p.topWeight}kg</td>
                  <td className="py-1.5 text-center">{p.topReps}</td>
                  <td className="py-1.5 text-center text-zinc-400">{p.sets}</td>
                  <td className="py-1.5 text-right font-bold">
                    {p.isPR && <span className="text-[#FF9500] mr-0.5">★</span>}
                    {p.e1rm}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
