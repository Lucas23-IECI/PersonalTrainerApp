"use client";

import { useState } from "react";
import type { WorkoutDay } from "@/data/workouts";
import { getWeekStatus } from "@/lib/storage";
import DayCard from "./DayCard";
import { Check } from "lucide-react";

interface CalendarViewProps {
  plan: WorkoutDay[];
  todayIndex: number; // index within plan array
  onStart: (dayId: string) => void;
}

export default function CalendarView({ plan, todayIndex, onStart }: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(
    plan[todayIndex >= 0 ? todayIndex : 0]?.id || null
  );
  const weekStatus = getWeekStatus();

  // Map plan to weekday grid (Mon=0 → Sun=6)
  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // weekStatus is already Mon-first (matches getWeekDates: Mon→Sun)
  const reorderedStatus = weekStatus;

  // Map plan days to Mon-first order
  const planByGridIndex = new Map<number, WorkoutDay>();
  plan.forEach((w) => {
    // Find grid index from day name
    const gridIdx = dayLabels.findIndex((l) => w.day.startsWith(l.slice(0, 3)));
    if (gridIdx >= 0) planByGridIndex.set(gridIdx, w);
  });

  // Also compute todayGridIndex
  const todayDow = new Date().getDay(); // 0=Sun
  const todayGridIndex = todayDow === 0 ? 6 : todayDow - 1;

  const selectedWorkout = plan.find((w) => w.id === selectedDay);

  return (
    <div>
      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {dayLabels.map((label, i) => {
          const workout = planByGridIndex.get(i);
          const status = reorderedStatus[i];
          const isToday = i === todayGridIndex;
          const isSelected = workout?.id === selectedDay;
          const trained = status?.trained;

          return (
            <button
              key={label}
              onClick={() => workout && setSelectedDay(isSelected ? null : workout.id)}
              className="flex flex-col items-center gap-0.5 py-2 rounded-xl border-none cursor-pointer transition-all relative"
              style={{
                background: isSelected
                  ? (workout?.color || "var(--accent)") + "20"
                  : isToday
                    ? "var(--bg-elevated)"
                    : "transparent",
                boxShadow: isToday ? `inset 0 0 0 1.5px ${workout?.color || "var(--accent)"}` : undefined,
              }}
            >
              <span className="text-[0.58rem] font-semibold" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              {workout ? (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[0.5rem] font-bold text-white"
                  style={{ background: workout.color }}
                >
                  {trained ? <Check size={12} strokeWidth={3} /> : workout.name.charAt(0)}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.5rem]" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                  —
                </div>
              )}
              {workout && !trained && workout.exercises.length > 0 && (
                <span className="text-[0.5rem] leading-tight truncate max-w-full px-0.5" style={{ color: "var(--text-muted)" }}>
                  {workout.duration}
                </span>
              )}
              {trained && (
                <span className="text-[0.45rem] text-[#34C759] font-bold">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedWorkout && (
        <DayCard
          workout={selectedWorkout}
          isToday={selectedWorkout.id === plan[todayIndex]?.id}
          isExpanded={true}
          onToggle={() => setSelectedDay(null)}
          onStart={onStart}
        />
      )}

      {!selectedWorkout && (
        <div className="text-center py-8 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
          Tocá un día para ver el detalle
        </div>
      )}
    </div>
  );
}
