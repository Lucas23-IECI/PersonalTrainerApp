"use client";

import { useState } from "react";
import { getCheckins, getSettings } from "@/lib/storage";
import { QUALITY_EMOJIS } from "@/lib/sleep-utils";

interface Props {
  days?: number;
}

export default function SleepChart({ days = 14 }: Props) {
  const goal = getSettings().sleepGoal;
  const allCheckins = getCheckins();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Build array of last N days
  const entries: Array<{
    date: string;
    dayLabel: string;
    hours: number;
    quality: number;
    bedtime?: string;
    wakeTime?: string;
  }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const c = allCheckins.find((ci) => ci.date === dateStr);
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    entries.push({
      date: dateStr,
      dayLabel: dayNames[d.getDay()],
      hours: c?.sleepHours || 0,
      quality: c?.sleepQuality || 0,
      bedtime: c?.bedtime,
      wakeTime: c?.wakeTime,
    });
  }

  const maxH = 12;
  const goalPct = (goal / maxH) * 100;
  const selected = selectedIdx !== null ? entries[selectedIdx] : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[0.65rem] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
          Últimos {days} días
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#34C759" }} />
          <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>≥{goal}h</span>
          <div className="w-2 h-2 rounded-full" style={{ background: "#FF3B30" }} />
          <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>&lt;{goal}h</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Goal line */}
        <div
          className="absolute left-0 right-0 border-dashed"
          style={{
            bottom: `${goalPct}%`,
            borderTop: "1.5px dashed rgba(94,92,230,0.4)",
          }}
        />

        <div className="flex gap-1 items-end" style={{ height: 120 }}>
          {entries.map((entry, i) => {
            const pct = entry.hours > 0 ? Math.min((entry.hours / maxH) * 100, 100) : 0;
            const metGoal = entry.hours >= goal;
            const isSelected = selectedIdx === i;
            const isToday = i === entries.length - 1;

            return (
              <button
                key={entry.date}
                onClick={() => setSelectedIdx(isSelected ? null : i)}
                className="flex-1 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer p-0"
                style={{ height: "100%" }}
              >
                <div className="flex-1 w-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[16px] rounded-t-sm transition-all"
                    style={{
                      height: `${pct}%`,
                      minHeight: entry.hours > 0 ? 4 : 0,
                      background: entry.hours === 0
                        ? "var(--border-subtle)"
                        : metGoal
                          ? "#34C759"
                          : "#FF3B30",
                      opacity: isSelected ? 1 : 0.7,
                      boxShadow: isSelected ? `0 0 6px ${metGoal ? "#34C759" : "#FF3B30"}50` : undefined,
                    }}
                  />
                </div>
                <span
                  className="text-[0.45rem] leading-none"
                  style={{
                    color: isToday ? "var(--accent)" : "var(--text-muted)",
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {entry.dayLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && selected.hours > 0 && (
        <div
          className="mt-3 p-2.5 rounded-lg flex items-center justify-between text-[0.7rem]"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div>
            <span className="font-bold" style={{ color: "var(--text)" }}>{selected.date.slice(5)}</span>
            <span className="mx-1.5" style={{ color: "var(--text-muted)" }}>·</span>
            <span className="font-bold" style={{ color: selected.hours >= goal ? "#34C759" : "#FF3B30" }}>
              {selected.hours}h
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selected.bedtime && (
              <span style={{ color: "var(--text-secondary)" }}>🌙 {selected.bedtime}</span>
            )}
            {selected.wakeTime && (
              <span style={{ color: "var(--text-secondary)" }}>☀️ {selected.wakeTime}</span>
            )}
            {selected.quality > 0 && (
              <span>{QUALITY_EMOJIS[selected.quality]}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
