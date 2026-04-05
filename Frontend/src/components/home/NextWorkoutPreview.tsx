"use client";

import Link from "next/link";
import { ChevronRight, Clock, CalendarDays } from "lucide-react";
import { getNextWorkoutDay } from "@/data/workouts";

export default function NextWorkoutPreview() {
  const next = getNextWorkoutDay();
  if (!next) return null;

  const { workout, daysFromNow, dayName } = next;
  const label = daysFromNow === 1 ? "Mañana" : dayName;

  return (
    <Link href="/workout" className="no-underline text-inherit">
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(52, 199, 89, 0.08)" }}
            >
              <CalendarDays size={16} style={{ color: "var(--accent-green)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] font-semibold uppercase" style={{ color: "var(--accent-green)" }}>
                  {label}
                </span>
                <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                  <Clock size={9} className="inline mr-0.5" />
                  {workout.duration}
                </span>
              </div>
              <div className="text-[0.75rem] font-bold" style={{ color: "var(--text)" }}>
                {workout.name}
              </div>
              <div className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
                {workout.exercises.slice(0, 3).map((e) => e.name).join(" · ")}
                {workout.exercises.length > 3 && ` (+${workout.exercises.length - 3})`}
              </div>
            </div>
          </div>
          <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </Link>
  );
}
