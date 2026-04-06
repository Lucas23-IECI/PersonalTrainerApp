"use client";

import { useState, useMemo } from "react";
import { t } from "@/lib/i18n";
import { today } from "@/lib/storage";
import { type Habit, getCalendarData, getHabitCompletionForDate, isHabitFullyCompleted } from "@/lib/habits";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

interface Props {
  habits: Habit[];
}

export default function HabitCalendar({ habits }: Props) {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [weeks] = useState(13); // 13 weeks = ~90 days

  const calData = useMemo(
    () => getCalendarData(selectedHabit, weeks * 7),
    [selectedHabit, weeks]
  );

  // Build grid: weeks x 7 days
  const grid = useMemo(() => {
    const d = new Date(today() + "T00:00:00");
    // Go back to fill the grid
    const totalDays = weeks * 7;
    const days: { date: string; rate: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(dd.getDate() - i);
      const ds = dd.toISOString().split("T")[0];
      days.push({ date: ds, rate: calData.get(ds) || 0 });
    }
    // Chunk into weeks
    const weekChunks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weekChunks.push(days.slice(i, i + 7));
    }
    return weekChunks;
  }, [calData, weeks]);

  function getColor(rate: number): string {
    if (rate === 0) return "var(--bg-elevated)";
    if (rate <= 25) return "rgba(48, 209, 88, 0.2)";
    if (rate <= 50) return "rgba(48, 209, 88, 0.4)";
    if (rate <= 75) return "rgba(48, 209, 88, 0.65)";
    return "rgba(48, 209, 88, 0.9)";
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedHabit(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !selectedHabit ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
          }`}
        >
          {t("common.all")}
        </button>
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHabit(h.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedHabit === h.id ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            }`}
          >
            {h.icon} {h.name}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">{t("habits.heatmap")}</h3>
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="h-[14px] text-[10px] text-[var(--text-muted)] flex items-center">
                {d}
              </div>
            ))}
          </div>
          {/* Cells */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  className="w-[14px] h-[14px] rounded-[3px]"
                  style={{ backgroundColor: getColor(day.rate) }}
                  title={`${day.date}: ${day.rate}%`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--text-muted)]">
          <span>{t("habits.less")}</span>
          {[0, 25, 50, 75, 100].map(r => (
            <div
              key={r}
              className="w-[14px] h-[14px] rounded-[3px]"
              style={{ backgroundColor: getColor(r) }}
            />
          ))}
          <span>{t("habits.more")}</span>
        </div>
      </div>
    </div>
  );
}
