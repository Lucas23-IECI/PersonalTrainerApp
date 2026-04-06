"use client";

import { useState } from "react";
import { Play, Clock, ChevronDown, ChevronUp, Check } from "lucide-react";
import type { WorkoutDay } from "@/data/workouts";
import { quickMarkDone, isQuickMarkedToday } from "@/lib/storage";

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
  const [done, setDone] = useState(() => isQuickMarkedToday(w.id));

  function handleToggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    const result = quickMarkDone(w.id, w.name);
    setDone(result);
  }

  if (compact) {
    return (
      <div
        className="card py-2 px-3 cursor-pointer"
        style={{
          borderColor: done ? "#22c55e60" : isToday ? w.color + "60" : undefined,
          opacity: done ? 0.7 : 1,
        }}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Check toggle */}
            {!isRest && (
              <button
                onClick={handleToggleDone}
                className="shrink-0 flex items-center justify-center rounded-full border-2 transition-all"
                style={{
                  width: 22, height: 22,
                  borderColor: done ? "#22c55e" : "var(--text-muted)",
                  background: done ? "#22c55e" : "transparent",
                }}
              >
                {done && <Check size={12} color="#fff" strokeWidth={3} />}
              </button>
            )}
            {isToday && (
              <span
                className="text-[0.5rem] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: w.color }}
              >
                HOY
              </span>
            )}
            <span className="text-[0.62rem] font-medium" style={{ color: "var(--text-muted)" }}>{w.day}</span>
            <span className={`text-[0.78rem] font-bold ${done ? "line-through" : ""}`} style={{ color: done ? "var(--text-muted)" : w.color }}>
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
      style={{
        borderColor: done ? "#22c55e60" : isToday ? w.color + "60" : undefined,
        opacity: done ? 0.75 : 1,
      }}
    >
      {/* Header */}
      <div onClick={onToggle} className="flex justify-between items-start cursor-pointer">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {/* Check toggle */}
            {!isRest && (
              <button
                onClick={handleToggleDone}
                className="shrink-0 flex items-center justify-center rounded-full border-2 transition-all"
                style={{
                  width: 24, height: 24,
                  borderColor: done ? "#22c55e" : "var(--text-muted)",
                  background: done ? "#22c55e" : "transparent",
                }}
              >
                {done && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>
            )}
            {isToday && (
              <span
                className="text-[0.55rem] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: w.color }}
              >
                HOY
              </span>
            )}
            <span className="text-[0.65rem] font-medium" style={{ color: "var(--text-muted)" }}>{w.day}</span>
          </div>
          <div className={`text-[0.9rem] font-bold mb-1 ${done ? "line-through" : ""}`} style={{ color: done ? "var(--text-muted)" : w.color }}>
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
        <div className="ml-2 shrink-0" style={{ color: "var(--text-secondary)" }}>
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
          className="text-[0.7rem] mb-3 py-2 px-3 rounded-lg"
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-elevated)",
            borderLeft: `3px solid ${w.color}`,
          }}
        >
          {w.note}
        </div>
      )}

      {isRest && w.exercises.length === 0 ? (
        <div className="text-center py-6" style={{ color: "var(--text-secondary)" }}>
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
                    <div className="text-[0.6rem] font-bold py-1 mt-1" style={{ color: "var(--accent)" }}>
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
                      <span className="font-semibold" style={{ color: "var(--text)" }}>{ex.name}</span>
                      {ex.notes && (
                        <div className="text-[0.6rem] mt-0.5 leading-tight" style={{ color: "var(--text-secondary)" }}>
                          {ex.notes}
                        </div>
                      )}
                    </div>
                    <span className="text-[0.72rem] text-right" style={{ color: "var(--text-muted)" }}>
                      {ex.sets}×{ex.reps}
                    </span>
                    <span className="text-[0.65rem] text-right min-w-[50px]" style={{ color: "var(--text-secondary)" }}>
                      {ex.load}
                    </span>
                    <span className="text-[0.65rem] text-right" style={{ color: "var(--text-muted)" }}>
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
