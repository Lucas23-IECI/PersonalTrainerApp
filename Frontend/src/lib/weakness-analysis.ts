/**
 * 7.5 — IA: Weakness Analysis
 * Detects muscle imbalances, stagnating exercises, neglected muscles,
 * and frequency gaps. Generates prioritized actionable recommendations.
 */

import { getSessions, getWeeklyMuscleData, type WorkoutSession } from "./storage";
import { getExerciseHistory } from "./progression";
import { WEEKLY_SET_TARGETS, getMuscleBalanceScore } from "./muscle-goals";
import { getMuscleRecoveryMap } from "./muscle-recovery";
import type { MuscleGroup } from "@/data/exercises";

export type WeaknessType = "neglected" | "stagnating" | "imbalance" | "frequency" | "overworked";

export interface WeaknessItem {
  type: WeaknessType;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
  muscle?: MuscleGroup;
  exercise?: string;
}

export interface WeaknessReport {
  score: number;          // 0-100 overall weakness/balance score
  level: "excellent" | "good" | "needs_work" | "poor";
  items: WeaknessItem[];
  strengths: string[];
}

const ALL_MUSCLES: MuscleGroup[] = [
  "chest", "front_delts", "side_delts", "rear_delts",
  "triceps", "biceps", "forearms",
  "upper_back", "lats", "lower_back", "traps",
  "abs", "obliques",
  "quads", "hamstrings", "glutes", "calves",
  "hip_flexors", "adductors",
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function getSessionsInRange(sessions: WorkoutSession[], days: number): WorkoutSession[] {
  const cutoff = daysAgo(days);
  return sessions.filter((s) => s.completed && s.date >= cutoff);
}

/** Count sets per muscle in a set of sessions */
function muscleSetCounts(sessions: WorkoutSession[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.skipped) continue;
      const workingSets = ex.sets.filter((set) => set.setType !== "warmup").length;
      if (ex.primaryMuscles) {
        for (const m of ex.primaryMuscles) {
          counts[m] = (counts[m] || 0) + workingSets;
        }
      }
    }
  }
  return counts;
}

/** Detect exercises where the user hasn't progressed in 3+ sessions */
function detectStagnation(sessions: WorkoutSession[]): WeaknessItem[] {
  const items: WeaknessItem[] = [];
  const exerciseNames = new Set<string>();

  // Collect all exercises from last 30 days
  const recent = getSessionsInRange(sessions, 30);
  for (const s of recent) {
    for (const ex of s.exercises) {
      if (!ex.skipped && ex.sets.length > 0) exerciseNames.add(ex.name);
    }
  }

  for (const name of exerciseNames) {
    const history = getExerciseHistory(name, 5);
    if (history.length < 3) continue;

    // Check if top set weight hasn't changed in last 3 sessions
    const lastThree = history.slice(0, 3);
    const weights = lastThree.map((h) => h.topSet.weight);
    const volumes = lastThree.map((h) => h.totalVolume);

    const weightStagnant = weights.every((w) => w === weights[0]) && weights[0] > 0;
    const volumeDecline = volumes.length >= 2 && volumes[0] < volumes[volumes.length - 1] * 0.95;

    if (weightStagnant) {
      items.push({
        type: "stagnating",
        severity: volumeDecline ? "high" : "medium",
        title: `${name} estancado`,
        detail: `Mismo peso (${weights[0]}kg) en las últimas ${lastThree.length} sesiones`,
        action: volumeDecline
          ? "Probá variar reps (más reps con menos peso o menos reps con más peso)"
          : "Intentá agregar 1 rep extra por set o subir 2.5kg",
        exercise: name,
      });
    }
  }

  return items;
}

/** Detect muscles trained below minimum weekly volume (last 7 days) */
function detectNeglected(): WeaknessItem[] {
  const items: WeaknessItem[] = [];
  const weeklyData = getWeeklyMuscleData();

  for (const muscle of ALL_MUSCLES) {
    const target = WEEKLY_SET_TARGETS[muscle];
    const actual = weeklyData[muscle]?.sets ?? 0;

    if (actual === 0 && target.min > 2) {
      items.push({
        type: "neglected",
        severity: "high",
        title: `${muscle} sin entrenar`,
        detail: `0 sets esta semana (mín: ${target.min})`,
        action: `Agregá ${target.min} sets de ${muscle} a tu rutina`,
        muscle,
      });
    } else if (actual > 0 && actual < target.min * 0.5) {
      items.push({
        type: "neglected",
        severity: "medium",
        title: `${muscle} con poco volumen`,
        detail: `${actual} sets esta semana (mín: ${target.min})`,
        action: `Aumentá a ${target.min}+ sets semanales`,
        muscle,
      });
    }
  }

  return items;
}

/** Detect muscles trained too much (above max) */
function detectOverworked(): WeaknessItem[] {
  const items: WeaknessItem[] = [];
  const weeklyData = getWeeklyMuscleData();

  for (const muscle of ALL_MUSCLES) {
    const target = WEEKLY_SET_TARGETS[muscle];
    const actual = weeklyData[muscle]?.sets ?? 0;

    if (actual > target.max * 1.3) {
      items.push({
        type: "overworked",
        severity: "high",
        title: `${muscle} sobreentrenado`,
        detail: `${actual} sets esta semana (máx: ${target.max})`,
        action: `Reducí a ${target.max} sets para permitir recuperación`,
        muscle,
      });
    } else if (actual > target.max) {
      items.push({
        type: "overworked",
        severity: "low",
        title: `${muscle} sobre el máximo`,
        detail: `${actual} sets esta semana (máx: ${target.max})`,
        action: `Considerá reducir ${actual - target.max} sets`,
        muscle,
      });
    }
  }

  return items;
}

/** Detect training frequency gaps — muscles not trained in 10+ days */
function detectFrequencyGaps(sessions: WorkoutSession[]): WeaknessItem[] {
  const items: WeaknessItem[] = [];
  const recoveryMap = getMuscleRecoveryMap();

  for (const muscle of ALL_MUSCLES) {
    const info = recoveryMap[muscle];
    if (info.hoursSince !== null && info.hoursSince > 240) { // 10+ days
      const days = Math.round(info.hoursSince / 24);
      items.push({
        type: "frequency",
        severity: days > 14 ? "high" : "medium",
        title: `${muscle} sin entrenar (${days}d)`,
        detail: `Última vez: ${info.lastTrained}`,
        action: `Incluí ${muscle} en tu próximo entreno`,
        muscle,
      });
    }
  }

  return items;
}

/** Detect push/pull/upper/lower imbalances */
function detectImbalances(): WeaknessItem[] {
  const items: WeaknessItem[] = [];
  const weeklyData = getWeeklyMuscleData();
  const balance = getMuscleBalanceScore(weeklyData);

  for (const detail of balance.details) {
    if (detail.ratio < 0.6) {
      items.push({
        type: "imbalance",
        severity: "high",
        title: `Desbalance ${detail.category}`,
        detail: `${detail.label} — ratio ${(detail.ratio * 100).toFixed(0)}%`,
        action: balance.recommendations.find((r) => r.includes(detail.category.split("/")[0])) || "Equilibrá el volumen",
      });
    } else if (detail.ratio < 0.75) {
      items.push({
        type: "imbalance",
        severity: "medium",
        title: `Leve desbalance ${detail.category}`,
        detail: `${detail.label} — ratio ${(detail.ratio * 100).toFixed(0)}%`,
        action: balance.recommendations.find((r) => r.includes(detail.category.split("/")[0])) || "Monitoreá el balance",
      });
    }
  }

  return items;
}

/** Find user's strongest areas */
function detectStrengths(): string[] {
  const strengths: string[] = [];
  const weeklyData = getWeeklyMuscleData();
  const balance = getMuscleBalanceScore(weeklyData);

  if (balance.score >= 85) strengths.push("Excelente balance muscular");

  // Find muscles at optimal volume
  let optimalCount = 0;
  for (const muscle of ALL_MUSCLES) {
    const target = WEEKLY_SET_TARGETS[muscle];
    const actual = weeklyData[muscle]?.sets ?? 0;
    if (actual >= target.min && actual <= target.max) optimalCount++;
  }
  if (optimalCount >= 12) strengths.push(`${optimalCount} músculos en rango óptimo de volumen`);

  // Check consistency
  const sessions = getSessions().filter((s) => s.completed);
  const last30 = getSessionsInRange(sessions, 30);
  if (last30.length >= 12) strengths.push("Gran consistencia (12+ sesiones/mes)");
  else if (last30.length >= 8) strengths.push("Buena frecuencia de entrenamiento");

  if (strengths.length === 0) strengths.push("¡Seguí entrenando para ver tus fortalezas!");

  return strengths;
}

/** Main function: generate full weakness analysis report */
export function getWeaknessAnalysis(): WeaknessReport {
  const sessions = getSessions().filter((s) => s.completed);
  const items: WeaknessItem[] = [];

  items.push(...detectNeglected());
  items.push(...detectOverworked());
  items.push(...detectStagnation(sessions));
  items.push(...detectFrequencyGaps(sessions));
  items.push(...detectImbalances());

  // Sort by severity
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Calculate overall score
  const highCount = items.filter((i) => i.severity === "high").length;
  const mediumCount = items.filter((i) => i.severity === "medium").length;
  const penalty = highCount * 15 + mediumCount * 5;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  let level: WeaknessReport["level"];
  if (score >= 85) level = "excellent";
  else if (score >= 65) level = "good";
  else if (score >= 40) level = "needs_work";
  else level = "poor";

  const strengths = detectStrengths();

  return { score, level, items, strengths };
}
