"use client";

import { Play, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { WorkoutDay } from "@/data/workouts";

interface DayCardProps {
  workout: WorkoutDay;
  isToday: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onStart: (dayId: string) => void;
  compact?: boolean;
}

export default function DayCard({ workout: w, isToday, isExpanded, onToggle, onStart, compact }: DayCardProps) {
  const isRest = w.type === "rest" || w.type === "optional";

  if (compact) {
    return (
      <div
        className="card py-2 px-3 cursor-pointer"
        style={{ borderColor: isToday ? w.color + "60" : undefined }}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isToday && (
              <span
                className="text-[0.5rem] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: w.color }}
              >
                HOY
              </span>
            )}
            <span className="text-[0.62rem] text-zinc-500 font-medium">{w.day}</span>
            <span className="text-[0.78rem] font-bold" style={{ color: w.color }}>
              {w.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {w.exercises.length > 0 && (
              <span className="badge badge-blue text-[0.55rem]">{w.focus}</span>
            )}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
        {isExpanded && <ExpandedContent workout={w} isRest={isRest} onStart={onStart} />}
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ borderColor: isToday ? w.color + "60" : undefined }}
    >
      {/* Header */}
      <div onClick={onToggle} className="flex justify-between items-start cursor-pointer">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isToday && (
              <span
                className="text-[0.55rem] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: w.color }}
              >
                HOY
              </span>
            )}
            <span className="text-[0.65rem] text-zinc-500 font-medium">{w.day}</span>
          </div>
          <div className="text-[0.9rem] font-bold mb-1" style={{ color: w.color }}>
            {w.name}
          </div>
          {w.exercises.length > 0 && (
            <div className="flex gap-2">
              <span className="badge badge-blue">{w.focus}</span>
              <span className="badge badge-blue">
                <Clock size={10} className="mr-1" />
                {w.duration}
              </span>
            </div>
          )}
        </div>
        <div className="text-zinc-600 ml-2 shrink-0">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded */}
      {isExpanded && <ExpandedContent workout={w} isRest={isRest} onStart={onStart} />}
    </div>
  );
}

function ExpandedContent({ workout: w, isRest, onStart }: { workout: WorkoutDay; isRest: boolean; onStart: (id: string) => void }) {
  return (
    <div className="mt-3">
      {w.note && (
        <div
          className="text-[0.7rem] text-zinc-400 mb-3 py-2 px-3 rounded-lg"
          style={{
            background: "var(--bg-elevated)",
            borderLeft: `3px solid ${w.color}`,
          }}
        >
          {w.note}
        </div>
      )}

      {isRest && w.exercises.length === 0 ? (
        <div className="text-center py-6 text-zinc-600">
          <div className="text-2xl mb-2">🧘</div>
          <div className="text-sm">Recuperación</div>
        </div>
      ) : (
        <>
          <div className="text-[0.78rem]">
            {w.exercises.map((ex, i) => {
              const showSS =
                ex.superset &&
                (i === 0 || w.exercises[i - 1]?.superset !== ex.superset);
              return (
                <div key={i}>
                  {showSS && (
                    <div className="text-[0.6rem] text-[#2C6BED] font-bold py-1 mt-1">
                      ↔ Superset {ex.superset}
                    </div>
                  )}
                  <div
                    className="grid items-center py-1.5"
                    style={{
                      gridTemplateColumns: "1fr auto auto auto",
                      gap: 8,
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <span className="text-zinc-800 font-semibold">{ex.name}</span>
                      {ex.notes && (
                        <div className="text-[0.6rem] text-zinc-600 mt-0.5 leading-tight">
                          {ex.notes}
                        </div>
                      )}
                    </div>
                    <span className="text-zinc-500 text-[0.72rem] text-right">
                      {ex.sets}×{ex.reps}
                    </span>
                    <span className="text-zinc-600 text-[0.65rem] text-right min-w-[50px]">
                      {ex.load}
                    </span>
                    <span className="text-zinc-400 text-[0.65rem] text-right">
                      RPE {ex.rpe}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {w.type !== "football" && w.exercises.length > 0 && (
            <button
              onClick={() => onStart(w.id)}
              className="btn btn-primary w-full mt-4 text-[0.85rem]"
            >
              <Play size={16} /> Empezar Entrenamiento
            </button>
          )}
        </>
      )}
    </div>
  );
}
