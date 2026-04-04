"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSessions } from "@/lib/storage";
import { BarChart3 } from "lucide-react";

interface SessionDataPoint {
  date: string;
  label: string;
  volume: number;
  exercises: number;
  sets: number;
  workoutName: string;
}

export default function SessionVolumeChart() {
  const { chartData, avgVolume, trend } = useMemo(() => {
    const sessions = getSessions()
      .filter((s) => s.completed)
      .sort((a, b) => a.date.localeCompare(b.date));

    const data: SessionDataPoint[] = sessions.map((s) => {
      let volume = 0;
      let sets = 0;
      for (const ex of s.exercises) {
        if (ex.skipped) continue;
        for (const set of ex.sets) {
          volume += (set.weight || 0) * set.reps;
          sets++;
        }
      }
      return {
        date: s.date,
        label: s.date.slice(5),
        volume: Math.round(volume),
        exercises: s.exercises.filter((e) => !e.skipped).length,
        sets,
        workoutName: s.workoutName,
      };
    }).slice(-20); // Last 20 sessions

    const avg = data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.volume, 0) / data.length)
      : 0;

    let trendVal = 0;
    if (data.length >= 4) {
      const half = Math.floor(data.length / 2);
      const firstHalf = data.slice(0, half).reduce((s, d) => s + d.volume, 0) / half;
      const secondHalf = data.slice(half).reduce((s, d) => s + d.volume, 0) / (data.length - half);
      trendVal = secondHalf - firstHalf;
    }

    return { chartData: data, avgVolume: avg, trend: trendVal };
  }, []);

  if (chartData.length < 2) {
    return (
      <div className="card mb-3.5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={16} className="text-[#34C759]" />
          <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">Volumen por Sesión</div>
        </div>
        <div className="text-center py-5 text-zinc-400 text-[0.8rem]">
          Necesitás al menos 2 sesiones completadas
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[#34C759]" />
          <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">Volumen por Sesión</div>
        </div>
        <div className="flex items-center gap-2">
          {trend !== 0 && (
            <span className={`text-[0.6rem] font-bold ${trend > 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
              {trend > 0 ? "↑" : "↓"}{Math.abs(Math.round(trend))}kg
            </span>
          )}
          <span className="text-[0.6rem] text-zinc-400">
            Prom: {avgVolume > 1000 ? `${(avgVolume / 1000).toFixed(1)}k` : avgVolume}kg
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34C759" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#636366" }}
              axisLine={{ stroke: "var(--border-subtle)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#636366" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => Number(v) > 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#1C1C1E",
                border: "1px solid #38383A",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#F5F5F7" }}
              formatter={(value, _name, props) => {
                const p = props.payload as SessionDataPoint;
                return [`${(value ?? 0).toLocaleString()}kg (${p.exercises} ej, ${p.sets} sets)`, p.workoutName];
              }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#34C759"
              strokeWidth={2}
              fill="url(#volumeGradient)"
              dot={{ r: 3, fill: "#34C759", stroke: "#1C1C1E", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#34C759" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <div className="text-[0.7rem] font-bold">{Math.max(...chartData.map((d) => d.volume)).toLocaleString()}</div>
          <div className="text-[0.5rem] text-zinc-500">Máximo kg</div>
        </div>
        <div className="text-center py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <div className="text-[0.7rem] font-bold">{avgVolume.toLocaleString()}</div>
          <div className="text-[0.5rem] text-zinc-500">Promedio kg</div>
        </div>
        <div className="text-center py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <div className="text-[0.7rem] font-bold">{chartData.length}</div>
          <div className="text-[0.5rem] text-zinc-500">Sesiones</div>
        </div>
      </div>
    </div>
  );
}
