"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { today, type DayStatus } from "@/lib/storage";

interface Props {
  weekStatus: DayStatus[];
}

export default function WeekHybridView({ weekStatus }: Props) {
  const todayStr = today();
  const maxSets = Math.max(1, ...weekStatus.map((d) => d.totalSets));

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.65rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Esta Semana
        </span>
        <Link href="/weekly-report" className="text-[0.65rem] no-underline" style={{ color: "var(--accent)" }}>
          Reporte →
        </Link>
      </div>
      <div className="flex justify-between">
        {weekStatus.map((d) => {
          const isToday = d.date === todayStr;
          const barHeight = d.totalSets > 0 ? Math.max(4, Math.round((d.totalSets / maxSets) * 28)) : 0;

          return (
            <div key={d.date} className="flex flex-col items-center gap-1" style={{ minWidth: 36 }}>
              {/* Day label */}
              <div
                className="text-[0.56rem] font-semibold"
                style={{ color: isToday ? "var(--accent)" : "var(--text-muted)" }}
              >
                {d.dayLabel}
              </div>

              {/* Dot */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: d.trained
                    ? "var(--accent-green)"
                    : isToday
                      ? "rgba(44, 107, 237, 0.08)"
                      : "var(--bg-elevated)",
                  border: isToday && !d.trained ? "2px solid var(--accent)" : "none",
                }}
              >
                {d.trained ? (
                  <Check size={12} color="#fff" strokeWidth={3} />
                ) : isToday ? (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                ) : null}
              </div>

              {/* Volume bar */}
              <div
                className="w-3 rounded-full"
                style={{
                  height: 28,
                  background: "var(--bg-elevated)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {barHeight > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full"
                    style={{
                      height: barHeight,
                      background: d.trained ? "var(--accent-green)" : "var(--accent)",
                      opacity: 0.6,
                      transition: "height 0.3s ease",
                    }}
                  />
                )}
              </div>

              {/* Sets count */}
              {d.totalSets > 0 && (
                <div className="text-[0.48rem] font-medium" style={{ color: "var(--text-muted)" }}>
                  {d.totalSets}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
