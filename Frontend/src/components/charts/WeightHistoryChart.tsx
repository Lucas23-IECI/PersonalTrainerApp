"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getCheckins, getSettings, kgToLbs } from "@/lib/storage";
import { getProfileData } from "@/data/profile";
import { Scale, TrendingDown, TrendingUp, Target, Calendar } from "lucide-react";
import { t } from "@/lib/i18n";

interface WeightPoint {
  date: string;
  label: string;
  weight: number;
  avg7?: number;
}

type Range = 30 | 60 | 90 | 0; // 0 = all

export default function WeightHistoryChart() {
  const [range, setRange] = useState<Range>(60);
  const unit = getSettings().unit;
  const profileData = useMemo(() => getProfileData(), []);

  const { chartData, stats } = useMemo(() => {
    const checkins = getCheckins()
      .filter((c) => c.weight)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (checkins.length < 2) return { chartData: [], stats: null };

    // Apply range filter
    let filtered = checkins;
    if (range > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - range);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      filtered = checkins.filter((c) => c.date >= cutoffStr);
      if (filtered.length < 2) filtered = checkins.slice(-2); // at least 2
    }

    // Build points with 7-day moving average
    const points: WeightPoint[] = [];
    for (let i = 0; i < filtered.length; i++) {
      const c = filtered[i];
      const w = c.weight!;

      // 7-day moving avg: look back in ALL checkins
      const idx = checkins.indexOf(c);
      const windowStart = Math.max(0, idx - 6);
      const window = checkins.slice(windowStart, idx + 1);
      const avg7 = window.reduce((s, x) => s + x.weight!, 0) / window.length;

      points.push({
        date: c.date,
        label: c.date.slice(5), // MM-DD
        weight: unit === "lbs" ? Math.round(kgToLbs(w) * 10) / 10 : w,
        avg7: unit === "lbs" ? Math.round(kgToLbs(avg7) * 10) / 10 : Math.round(avg7 * 10) / 10,
      });
    }

    // Stats
    const weights = filtered.map((c) => c.weight!);
    const first = weights[0];
    const last = weights[weights.length - 1];
    const change = last - first;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = weights.reduce((s, w) => s + w, 0) / weights.length;
    const daySpan = Math.max(
      1,
      (new Date(filtered[filtered.length - 1].date).getTime() - new Date(filtered[0].date).getTime()) / 86400000
    );
    const weeklyRate = (change / daySpan) * 7;

    // Estimated weeks to goal
    const goalW = profileData.goalWeight;
    const remaining = last - goalW;
    const weeksToGoal = weeklyRate !== 0 && Math.sign(remaining) === Math.sign(weeklyRate)
      ? Math.abs(remaining / weeklyRate)
      : null;

    return {
      chartData: points,
      stats: {
        first: unit === "lbs" ? kgToLbs(first) : first,
        last: unit === "lbs" ? kgToLbs(last) : last,
        change: unit === "lbs" ? kgToLbs(change) : change,
        min: unit === "lbs" ? kgToLbs(min) : min,
        max: unit === "lbs" ? kgToLbs(max) : max,
        avg: unit === "lbs" ? kgToLbs(avg) : avg,
        weeklyRate: unit === "lbs" ? kgToLbs(weeklyRate) : weeklyRate,
        entries: filtered.length,
        weeksToGoal,
        goalWeight: unit === "lbs" ? kgToLbs(goalW) : goalW,
      },
    };
  }, [range, unit, profileData]);

  if (!stats) {
    return (
      <div className="card mb-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={16} className="text-[#64D2FF]" />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            {t("progress.weightHistory")}
          </div>
        </div>
        <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
          {t("progress.needAtLeast2Weights")}
        </div>
      </div>
    );
  }

  const unitLabel = unit === "lbs" ? "lbs" : "kg";
  const yMin = Math.floor(Math.min(...chartData.map((d) => Math.min(d.weight, d.avg7 || d.weight))) - 1);
  const yMax = Math.ceil(Math.max(...chartData.map((d) => Math.max(d.weight, d.avg7 || d.weight))) + 1);
  const goalInRange = stats.goalWeight >= yMin - 2 && stats.goalWeight <= yMax + 2;

  return (
    <div className="card mb-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-[#64D2FF]" />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            {t("progress.weightHistory")}
          </div>
        </div>
        <div className="flex gap-1">
          {([30, 60, 90, 0] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-2 py-0.5 rounded text-[0.55rem] font-bold border-none cursor-pointer transition-colors"
              style={{
                background: range === r ? "var(--accent)" : "var(--bg-elevated)",
                color: range === r ? "white" : "var(--text-muted)",
              }}
            >
              {r === 0 ? t("progress.rangeAll") : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <div className="text-center">
          <div className="text-[0.9rem] font-black" style={{ color: stats.change <= 0 ? "#34C759" : "#FF3B30" }}>
            {stats.change > 0 ? "+" : ""}{stats.change.toFixed(1)}
          </div>
          <div className="text-[0.45rem] uppercase" style={{ color: "var(--text-muted)" }}>{unitLabel} {t("progress.changeLabel")}</div>
        </div>
        <div className="text-center">
          <div className="text-[0.9rem] font-black">{stats.avg.toFixed(1)}</div>
          <div className="text-[0.45rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.average")}</div>
        </div>
        <div className="text-center">
          <div className="text-[0.9rem] font-black" style={{ color: stats.weeklyRate <= 0 ? "#34C759" : "#FF3B30" }}>
            {stats.weeklyRate > 0 ? "+" : ""}{stats.weeklyRate.toFixed(2)}
          </div>
          <div className="text-[0.45rem] uppercase" style={{ color: "var(--text-muted)" }}>{unitLabel}/{t("progress.perWeek")}</div>
        </div>
        <div className="text-center">
          <div className="text-[0.9rem] font-black">{stats.entries}</div>
          <div className="text-[0.45rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.weighIns")}</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64D2FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#64D2FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[goalInRange ? Math.min(yMin, Math.floor(stats.goalWeight) - 1) : yMin, yMax]}
              tick={{ fontSize: 9, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--text-muted)" }}
            />
            {goalInRange && (
              <ReferenceLine
                y={stats.goalWeight}
                stroke="#34C759"
                strokeDasharray="6 3"
                label={{
                  value: `${t("progress.goalMeta")} ${stats.goalWeight.toFixed(1)}`,
                  position: "right",
                  fontSize: 9,
                  fill: "#34C759",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#64D2FF"
              strokeWidth={2}
              fill="url(#weightGrad)"
              dot={{ r: 3, fill: "#64D2FF", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="avg7"
              stroke="#FF9500"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              name="avg7"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 rounded" style={{ background: "#64D2FF" }} />
          <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>{t("progress.weight")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 rounded" style={{ background: "#FF9500", borderTop: "1px dashed #FF9500" }} />
          <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>{t("progress.movingAvg")}</span>
        </div>
        {goalInRange && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ background: "#34C759", borderTop: "1px dashed #34C759" }} />
            <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>{t("progress.goalMeta")}</span>
          </div>
        )}
      </div>

      {/* Goal estimation */}
      {stats.weeksToGoal !== null && stats.weeksToGoal > 0 && stats.weeksToGoal < 200 && (
        <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <Target size={14} className="text-[#34C759] shrink-0" />
          <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
            {t("progress.estimatedGoal")}: <strong style={{ color: "var(--text)" }}>~{Math.round(stats.weeksToGoal)} {t("progress.weeks")}</strong>{" "}
            ({stats.goalWeight.toFixed(1)} {unitLabel})
          </span>
        </div>
      )}

      {/* Min/Max range */}
      <div className="flex justify-between mt-2 text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
        <span>{t("progress.minWeight")}: {stats.min.toFixed(1)} {unitLabel}</span>
        <span>{t("progress.maxWeight")}: {stats.max.toFixed(1)} {unitLabel}</span>
      </div>
    </div>
  );
}
