import type { RecoveryStatus } from "@/lib/muscle-recovery";
import type { MuscleGroup } from "@/data/exercises";

export interface DailyRecommendation {
  muscle: MuscleGroup;
  priority: "high" | "medium" | "low" | "skip";
  reason: string;
}

const PRIORITY_ORDER: Record<DailyRecommendation["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
  skip: 3,
};

const ALL_MUSCLES: MuscleGroup[] = [
  "chest", "front_delts", "side_delts", "rear_delts",
  "triceps", "biceps", "forearms",
  "upper_back", "lats", "lower_back", "traps",
  "abs", "obliques",
  "quads", "hamstrings", "glutes", "calves",
  "hip_flexors", "adductors",
];

export function getDailyRecommendations(
  recoveryMap: Record<MuscleGroup, { status: RecoveryStatus }>,
  weeklyData: Record<string, { sets: number }>,
  goals: Record<string, { min: number; max: number }>
): DailyRecommendation[] {
  const recommendations: DailyRecommendation[] = [];

  for (const muscle of ALL_MUSCLES) {
    const recovery = recoveryMap[muscle];
    const sets = weeklyData[muscle]?.sets ?? 0;
    const goal = goals[muscle] ?? { min: 0, max: 0 };

    if (recovery.status === "fatigued") {
      recommendations.push({ muscle, priority: "skip", reason: "Fatigado — necesita descanso" });
      continue;
    }

    if (recovery.status === "recovering") {
      recommendations.push({ muscle, priority: "skip", reason: "Recuperándose" });
      continue;
    }

    // recovered or fresh
    if (sets >= goal.max) {
      recommendations.push({ muscle, priority: "skip", reason: "Objetivo alcanzado esta semana" });
    } else if (sets < goal.min) {
      recommendations.push({
        muscle,
        priority: "high",
        reason: `${sets} sets de ${goal.min} objetivo`,
      });
    } else {
      recommendations.push({
        muscle,
        priority: "low",
        reason: "En rango — mantener",
      });
    }
  }

  recommendations.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return recommendations;
}
