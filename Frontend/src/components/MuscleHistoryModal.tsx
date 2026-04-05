"use client";

import { useState, useEffect, useMemo } from "react";
import { MUSCLE_LABELS, type MuscleGroup, exerciseLibrary } from "@/data/exercises";
import { getSessions, type WorkoutSession } from "@/lib/storage";
import { X, TrendingUp, Dumbbell, Calendar } from "lucide-react";

interface MuscleHistoryModalProps {
  muscle: MuscleGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

function getWeeksData(muscle: MuscleGroup): { label: string; sets: number; volume: number }[] {
  const sessions = getSessions().filter((s) => s.completed);
  const now = new Date();
  const weeks: { label: string; sets: number; volume: number }[] = [];

  for (let w = 0; w < 4; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    let sets = 0,
      volume = 0;
    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= weekStart && sessionDate <= weekEnd) {
        session.exercises.forEach((ex) => {
          if (ex.skipped) return;
          const isPrimary = ex.primaryMuscles?.includes(muscle);
          const libEx = exerciseLibrary.find((e) => e.name === ex.name);
          const isSecondary = libEx?.secondaryMuscles?.includes(muscle);
          if (isPrimary || isSecondary) {
            const working = ex.sets.filter((s) => s.setType !== "warmup");
            const mult = isPrimary ? 1 : 0.5;
            sets += Math.round(working.length * mult);
            volume += Math.round(working.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0) * mult);
          }
        });
      }
    });
    weeks.push({ label: `Sem ${w + 1}`, sets, volume });
  }

  return weeks;
}

function computeStats(muscle: MuscleGroup, sessions: WorkoutSession[]) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);

  let totalSets = 0;
  let totalVolume = 0;
  let bestWeight = 0;
  let bestReps = 0;
  const exerciseCounts: Record<string, number> = {};

  sessions.filter((s) => s.completed).forEach((session) => {
    const sessionDate = new Date(session.date);
    const isThisWeek = sessionDate >= weekStart && sessionDate <= now;

    session.exercises.forEach((ex) => {
      if (ex.skipped) return;
      const isPrimary = ex.primaryMuscles?.includes(muscle);
      const libEx = exerciseLibrary.find((e) => e.name === ex.name);
      const isSecondary = libEx?.secondaryMuscles?.includes(muscle);
      if (!isPrimary && !isSecondary) return;

      const working = ex.sets.filter((s) => s.setType !== "warmup");
      const mult = isPrimary ? 1 : 0.5;

      if (isThisWeek) {
        totalSets += Math.round(working.length * mult);
        totalVolume += Math.round(working.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0) * mult);
      }

      exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + working.length;

      working.forEach((s) => {
        if ((s.weight || 0) > bestWeight || ((s.weight || 0) === bestWeight && s.reps > bestReps)) {
          bestWeight = s.weight || 0;
          bestReps = s.reps;
        }
      });
    });
  });

  const topExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalSets,
    totalVolume,
    topExercise: topExercise ? topExercise[0] : "—",
    bestSet: bestWeight > 0 ? `${bestWeight}kg × ${bestReps}` : "—",
    exerciseBreakdown: Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1]),
  };
}

export default function MuscleHistoryModal({ muscle, isOpen, onClose }: MuscleHistoryModalProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    if (isOpen && muscle) setSessions(getSessions());
  }, [isOpen, muscle]);

  const weeks = useMemo(() => (muscle ? getWeeksData(muscle) : []), [muscle, sessions]);
  const stats = useMemo(() => (muscle ? computeStats(muscle, sessions) : null), [muscle, sessions]);

  if (!isOpen || !muscle) return null;

  const maxSets = Math.max(...weeks.map((w) => w.sets), 1);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{MUSCLE_LABELS[muscle]}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", padding: "16px 20px" }}>
          {/* 4-week bar chart */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <TrendingUp size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Últimas 4 semanas</span>
            </div>
            {weeks.map((w) => (
              <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", width: 40, textAlign: "right", flexShrink: 0 }}>{w.label}</span>
                <div style={{ flex: 1, background: "var(--bg-elevated)", borderRadius: 4, height: 18, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(w.sets / maxSets) * 100}%`,
                      height: "100%",
                      background: "var(--accent)",
                      borderRadius: 4,
                      minWidth: w.sets > 0 ? 4 : 0,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", width: 28, flexShrink: 0 }}>{w.sets}s</span>
              </div>
            ))}
          </div>

          {/* Stats grid 2x2 */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <StatCard icon={<Dumbbell size={14} />} label="Sets esta semana" value={String(stats.totalSets)} />
              <StatCard icon={<TrendingUp size={14} />} label="Volumen semanal" value={`${stats.totalVolume} kg`} />
              <StatCard icon={<Calendar size={14} />} label="Top ejercicio" value={stats.topExercise} small />
              <StatCard icon={<Dumbbell size={14} />} label="Mejor serie" value={stats.bestSet} />
            </div>
          )}

          {/* Exercise breakdown */}
          {stats && stats.exerciseBreakdown.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Ejercicios utilizados</p>
              {stats.exerciseBreakdown.map(([name, count]) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    background: "var(--bg-elevated)",
                    borderRadius: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--text)" }}>{name}</span>
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{count} sets</span>
                </div>
              ))}
            </div>
          )}

          {stats && stats.exerciseBreakdown.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>
              Sin datos de entrenamiento para este músculo
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, color: "var(--text-muted)" }}>
        {icon}
        <span style={{ fontSize: 11 }}>{label}</span>
      </div>
      <span style={{ fontSize: small ? 13 : 16, fontWeight: 700, color: "var(--text)", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}
