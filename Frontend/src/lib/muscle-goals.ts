import type { MuscleGroup } from "@/data/exercises";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/storage";

const STORAGE_KEY = "mark-pt-muscle-goals";

export const WEEKLY_SET_TARGETS: Record<MuscleGroup, { min: number; max: number }> = {
  chest: { min: 10, max: 20 },
  front_delts: { min: 6, max: 12 },
  side_delts: { min: 8, max: 20 },
  rear_delts: { min: 8, max: 16 },
  triceps: { min: 6, max: 12 },
  biceps: { min: 8, max: 16 },
  forearms: { min: 4, max: 8 },
  upper_back: { min: 10, max: 20 },
  lats: { min: 10, max: 20 },
  lower_back: { min: 4, max: 8 },
  traps: { min: 6, max: 12 },
  abs: { min: 8, max: 16 },
  obliques: { min: 4, max: 8 },
  quads: { min: 12, max: 22 },
  hamstrings: { min: 10, max: 16 },
  glutes: { min: 8, max: 16 },
  calves: { min: 8, max: 16 },
  hip_flexors: { min: 2, max: 6 },
  adductors: { min: 4, max: 8 },
};

export function getMuscleGoals(): Record<MuscleGroup, { min: number; max: number }> {
  if (typeof window === "undefined") return { ...WEEKLY_SET_TARGETS };
  const stored = safeGetItem(STORAGE_KEY);
  if (!stored) return { ...WEEKLY_SET_TARGETS };
  try {
    return JSON.parse(stored);
  } catch {
    return { ...WEEKLY_SET_TARGETS };
  }
}

export function saveMuscleGoals(goals: Record<MuscleGroup, { min: number; max: number }>): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(goals));
}

export function resetMuscleGoals(): void {
  safeRemoveItem(STORAGE_KEY);
}

export type SetZone = "under" | "optimal" | "over";

export function getSetZone(sets: number, min: number, max: number): SetZone {
  if (sets < min) return "under";
  if (sets > max) return "over";
  return "optimal";
}

export function getSetZoneColor(zone: SetZone): string {
  const colors: Record<SetZone, string> = {
    under: "#FF9500",
    optimal: "#34C759",
    over: "#FF453A",
  };
  return colors[zone];
}

interface BalanceDetail {
  category: string;
  ratio: number;
  ideal: number;
  label: string;
}

interface BalanceResult {
  score: number;
  details: BalanceDetail[];
  recommendations: string[];
}

export function getMuscleBalanceScore(
  weeklyData: Record<string, { sets: number }>
): BalanceResult {
  const s = (m: string) => weeklyData[m]?.sets ?? 0;

  const push = s("chest") + s("front_delts") + s("triceps");
  const pull = s("lats") + s("upper_back") + s("rear_delts") + s("biceps");
  const upper = push + pull + s("side_delts") + s("traps") + s("forearms");
  const lower = s("quads") + s("hamstrings") + s("glutes") + s("calves") + s("adductors") + s("hip_flexors");
  const anterior = s("quads") + s("abs") + s("chest") + s("front_delts");
  const posterior = s("hamstrings") + s("glutes") + s("upper_back") + s("lats") + s("rear_delts");

  const ratio = (a: number, b: number) => {
    if (a === 0 && b === 0) return 1;
    const max = Math.max(a, b);
    const min = Math.min(a, b);
    return max === 0 ? 0 : min / max;
  };

  const pushPullRatio = ratio(push, pull);
  const upperLowerRatio = ratio(upper, lower);
  const anteriorPosteriorRatio = ratio(anterior, posterior);

  const details: BalanceDetail[] = [
    { category: "Push/Pull", ratio: pushPullRatio, ideal: 1.0, label: `Push ${push} — Pull ${pull}` },
    { category: "Upper/Lower", ratio: upperLowerRatio, ideal: 1.0, label: `Upper ${upper} — Lower ${lower}` },
    { category: "Anterior/Posterior", ratio: anteriorPosteriorRatio, ideal: 1.0, label: `Anterior ${anterior} — Posterior ${posterior}` },
  ];

  const score = Math.round(((pushPullRatio + upperLowerRatio + anteriorPosteriorRatio) / 3) * 100);

  const recommendations: string[] = [];

  if (pushPullRatio < 0.7) {
    const diff = Math.abs(push - pull);
    if (push < pull) {
      recommendations.push(`Aumentá Push (pecho, hombro frontal, tríceps) +${diff} sets`);
    } else {
      recommendations.push(`Aumentá Pull (espalda, dorsales, deltoide posterior, bíceps) +${diff} sets`);
    }
  }

  if (upperLowerRatio < 0.7) {
    const diff = Math.abs(upper - lower);
    if (upper < lower) {
      recommendations.push(`Aumentá tren superior +${diff} sets`);
    } else {
      recommendations.push(`Aumentá tren inferior +${diff} sets`);
    }
  }

  if (anteriorPosteriorRatio < 0.7) {
    const diff = Math.abs(anterior - posterior);
    if (anterior < posterior) {
      recommendations.push(`Aumentá cadena anterior +${diff} sets`);
    } else {
      recommendations.push(`Aumentá cadena posterior +${diff} sets`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Buen balance muscular — seguí así 💪");
  }

  return { score, details, recommendations };
}
