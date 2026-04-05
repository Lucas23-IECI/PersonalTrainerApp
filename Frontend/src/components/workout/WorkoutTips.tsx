"use client";

import { useMemo } from "react";
import type { WorkoutDay } from "@/data/workouts";
import { getBatchSuggestions, type BatchSuggestion } from "@/lib/progression";
import { getMuscleRecoveryMap, getRecoveryEmoji } from "@/lib/muscle-recovery";
import type { MuscleGroup } from "@/data/exercises";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

interface WorkoutTipsProps {
  workout: WorkoutDay;
  maxTips?: number;
}

export default function WorkoutTips({ workout, maxTips = 3 }: WorkoutTipsProps) {
  const tips = useMemo(() => {
    const result: { icon: string; text: string; color: string }[] = [];

    // 1. Progression suggestions for today's exercises
    const exerciseNames = workout.exercises.map((e) => e.name);
    if (exerciseNames.length > 0) {
      const suggestions = getBatchSuggestions(exerciseNames);
      for (const s of suggestions) {
        if (s.trend === "up") {
          result.push({
            icon: "📈",
            text: `${s.exerciseName}: ${s.suggestedWeight}kg${s.suggestedReps ? ` × ${s.suggestedReps}` : ""} — ${s.reason}`,
            color: "#34C759",
          });
        }
        if (result.length >= maxTips) break;
      }
    }

    // 2. Muscle recovery insights
    if (result.length < maxTips) {
      const recoveryMap = getMuscleRecoveryMap();
      const targetMuscles = new Set<MuscleGroup>();
      workout.exercises.forEach((e) => e.primaryMuscles.forEach((m) => targetMuscles.add(m)));

      for (const muscle of targetMuscles) {
        const info = recoveryMap[muscle];
        if (!info) continue;

        if (info.status === "fatigued" && info.hoursSince !== null) {
          const hours = Math.round(info.hoursSince);
          result.push({
            icon: getRecoveryEmoji(info.status),
            text: `${muscle} — entrenado hace ${hours}h, puede que estés fatigado`,
            color: "#FF453A",
          });
        } else if (info.status === "fresh" && info.lastTrained === null) {
          result.push({
            icon: "💪",
            text: `${muscle} — fresco, dale con todo hoy`,
            color: "var(--accent)",
          });
        }
        if (result.length >= maxTips) break;
      }
    }

    return result.slice(0, maxTips);
  }, [workout, maxTips]);

  if (tips.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <div className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
        <Sparkles size={10} /> Tips para hoy
      </div>
      {tips.map((tip, i) => (
        <div
          key={i}
          className="flex items-start gap-2 text-[0.7rem] py-1.5 px-2.5 rounded-lg"
          style={{ background: "var(--bg-elevated)" }}
        >
          <span className="shrink-0">{tip.icon}</span>
          <span style={{ color: "var(--text)" }}>{tip.text}</span>
        </div>
      ))}
    </div>
  );
}
