"use client";

import { useMemo } from "react";
import { Flame, Trophy, CheckCircle2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { type Habit, getHabitStreak, getWeeklyCompletionRate } from "@/lib/habits";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface Props {
  habits: Habit[];
}

export default function HabitStats({ habits }: Props) {
  const streaks = useMemo(
    () => habits.map(h => ({ habit: h, streak: getHabitStreak(h.id) })),
    [habits]
  );

  const weeklyData = useMemo(() => {
    const rates = getWeeklyCompletionRate(null, 8);
    return rates.map((rate, i) => ({
      name: `S${i + 1}`,
      rate,
    }));
  }, []);

  const bestStreak = streaks.reduce((best, s) => Math.max(best, s.streak.best), 0);
  const totalDays = streaks.reduce((sum, s) => sum + s.streak.total, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--bg-elevated)] rounded-2xl p-3 text-center">
          <Flame size={20} className="text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{streaks[0]?.streak.current || 0}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{t("habits.currentStreak")}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] rounded-2xl p-3 text-center">
          <Trophy size={20} className="text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{bestStreak}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{t("habits.bestStreak")}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] rounded-2xl p-3 text-center">
          <CheckCircle2 size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalDays}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{t("habits.totalDays")}</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">{t("habits.weeklyRate")}</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                }}
              />
              <Bar dataKey="rate" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-habit streaks */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">{t("habits.perHabitStreaks")}</h3>
        <div className="space-y-3">
          {streaks.map(({ habit, streak }) => (
            <div key={habit.id} className="flex items-center gap-3">
              <span className="text-lg">{habit.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{habit.name}</p>
                <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                  <span>{t("habits.currentLabel")} {streak.current}</span>
                  <span>{t("habits.bestLabel")} {streak.best}</span>
                  <span>{t("habits.totalLabel")} {streak.total}</span>
                </div>
              </div>
              {streak.current > 0 && (
                <Flame size={16} className="text-orange-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
