// =============================================
// Intelligent Progression Engine
// RPE-based, no stupid jumps, smart suggestions
// =============================================

import { getSessions, type WorkoutSession, type LoggedSet } from "./storage";
import { type ProgramExercise } from "@/data/programs";

export interface ProgressionSuggestion {
  weight: number | null;
  reps: string;
  reason: string;
  trend: "up" | "same" | "down" | "new";
}

export interface ExerciseHistory {
  date: string;
  sets: LoggedSet[];
  avgRpe: number;
  topSet: { reps: number; weight: number };
  totalVolume: number;
}

/**
 * Get the last N sessions for a given exercise name.
 */
export function getExerciseHistory(exerciseName: string, limit = 5): ExerciseHistory[] {
  const sessions = getSessions().filter((s) => s.completed);
  const history: ExerciseHistory[] = [];

  // Walk sessions from most recent
  for (let i = sessions.length - 1; i >= 0 && history.length < limit; i--) {
    const session = sessions[i];
    const exercise = session.exercises.find(
      (e) => e.name === exerciseName && !e.skipped && e.sets.length > 0
    );
    if (exercise) {
      const sets = exercise.sets;
      const rpes = sets.filter((s) => s.rpe).map((s) => s.rpe!);
      const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;

      let topSet = { reps: 0, weight: 0 };
      let totalVolume = 0;
      for (const set of sets) {
        const w = set.weight || 0;
        totalVolume += set.reps * w;
        if (w > topSet.weight || (w === topSet.weight && set.reps > topSet.reps)) {
          topSet = { reps: set.reps, weight: w };
        }
      }

      history.push({
        date: session.date,
        sets,
        avgRpe,
        topSet,
        totalVolume,
      });
    }
  }

  return history;
}

/**
 * Get a smart weight/reps suggestion for an exercise.
 * Rules:
 * - Compounds upper: +2.5kg if RPE<8
 * - Compounds lower: +5kg if RPE<8
 * - Accessories: increase reps first until top of range, then +weight
 * - If RPE>9 for 2+ sessions: maintain or decrease
 * - Never jump more than +5kg on anything
 */
export function getSuggestion(
  exerciseName: string,
  programExercise: ProgramExercise
): ProgressionSuggestion {
  const history = getExerciseHistory(exerciseName, 3);

  if (history.length === 0) {
    return {
      weight: null,
      reps: programExercise.reps,
      reason: "Primera vez. Empezá liviano, enfocate en técnica.",
      trend: "new",
    };
  }

  const last = history[0];
  const lastWeight = last.topSet.weight;
  const lastReps = last.topSet.reps;
  const lastRpe = last.avgRpe;

  // Parse rep range from program
  const repRange = parseRepRange(programExercise.reps);

  // Check if RPE has been too high for multiple sessions
  if (history.length >= 2) {
    const recentHighRpe = history.slice(0, 2).every((h) => h.avgRpe >= 9);
    if (recentHighRpe) {
      return {
        weight: lastWeight,
        reps: programExercise.reps,
        reason: `RPE alto (${lastRpe.toFixed(1)}) las últimas sesiones. Mantené el peso.`,
        trend: "same",
      };
    }
  }

  // If RPE was very high single session
  if (lastRpe >= 9.5) {
    return {
      weight: lastWeight,
      reps: programExercise.reps,
      reason: `RPE ${lastRpe.toFixed(1)} — muy pesado. Mantené ${lastWeight}kg.`,
      trend: "same",
    };
  }

  // If RPE is moderate to high, maintain
  if (lastRpe >= 8.5) {
    return {
      weight: lastWeight,
      reps: programExercise.reps,
      reason: `RPE ${lastRpe.toFixed(1)} — buen esfuerzo. Mantené y buscá más reps.`,
      trend: "same",
    };
  }

  // RPE < 8.5 — room to progress
  if (programExercise.isCompound) {
    // Compound: increase weight
    const increment = isLowerBodyExercise(programExercise) ? 5 : 2.5;
    const newWeight = lastWeight + increment;
    return {
      weight: newWeight,
      reps: repRange ? `${repRange.min}-${repRange.max}` : programExercise.reps,
      reason: `RPE ${lastRpe.toFixed(1)} — subí a ${newWeight}kg (+${increment}kg).`,
      trend: "up",
    };
  } else {
    // Accessory: increase reps first, then weight
    if (repRange && lastReps < repRange.max) {
      return {
        weight: lastWeight,
        reps: `${lastReps + 1}-${repRange.max}`,
        reason: `Buscá ${lastReps + 1}+ reps con ${lastWeight}kg antes de subir peso.`,
        trend: "up",
      };
    } else {
      // At top of rep range — increase weight, drop reps
      const increment = 2.5;
      const newWeight = lastWeight + increment;
      return {
        weight: newWeight,
        reps: repRange ? `${repRange.min}-${repRange.max}` : programExercise.reps,
        reason: `Llegaste a ${lastReps} reps. Subí a ${newWeight}kg, arrancá de ${repRange?.min || 8} reps.`,
        trend: "up",
      };
    }
  }
}

/**
 * Detect Personal Records from all sessions.
 */
export interface PersonalRecord {
  exerciseName: string;
  type: "weight" | "reps" | "volume" | "e1rm";
  value: number;
  date: string;
  detail: string;
}

export function getPersonalRecords(): PersonalRecord[] {
  const sessions = getSessions().filter((s) => s.completed);
  const records: Map<string, PersonalRecord[]> = new Map();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.skipped || exercise.sets.length === 0) continue;

      const name = exercise.name;
      if (!records.has(name)) records.set(name, []);

      for (const set of exercise.sets) {
        const w = set.weight || 0;
        const r = set.reps;

        // Estimated 1RM (Epley formula)
        const e1rm = r > 0 && w > 0 ? w * (1 + r / 30) : 0;

        const existing = records.get(name)!;

        // Check weight PR
        const weightPr = existing.find((pr) => pr.type === "weight");
        if (!weightPr || w > weightPr.value) {
          const idx = existing.findIndex((pr) => pr.type === "weight");
          const pr: PersonalRecord = {
            exerciseName: name,
            type: "weight",
            value: w,
            date: session.date,
            detail: `${w}kg × ${r}`,
          };
          if (idx >= 0) existing[idx] = pr;
          else existing.push(pr);
        }

        // Check e1RM PR
        const e1rmPr = existing.find((pr) => pr.type === "e1rm");
        if (!e1rmPr || e1rm > e1rmPr.value) {
          const idx = existing.findIndex((pr) => pr.type === "e1rm");
          const pr: PersonalRecord = {
            exerciseName: name,
            type: "e1rm",
            value: Math.round(e1rm * 10) / 10,
            date: session.date,
            detail: `${w}kg × ${r} = ~${Math.round(e1rm)}kg e1RM`,
          };
          if (idx >= 0) existing[idx] = pr;
          else existing.push(pr);
        }
      }
    }
  }

  // Flatten
  const allPrs: PersonalRecord[] = [];
  records.forEach((prs) => allPrs.push(...prs));
  return allPrs;
}

/**
 * Check if a set is a new PR for the given exercise.
 */
export function isNewPR(exerciseName: string, set: LoggedSet): { isPR: boolean; type?: string } {
  const history = getExerciseHistory(exerciseName, 50);

  if (history.length === 0) return { isPR: false };

  const maxWeight = Math.max(...history.flatMap((h) => h.sets.map((s) => s.weight || 0)));
  if ((set.weight || 0) > maxWeight && maxWeight > 0) {
    return { isPR: true, type: "weight" };
  }

  // Check e1RM
  const currentE1rm = (set.weight || 0) * (1 + set.reps / 30);
  const maxE1rm = Math.max(
    ...history.flatMap((h) =>
      h.sets.map((s) => (s.weight || 0) * (1 + s.reps / 30))
    )
  );
  if (currentE1rm > maxE1rm && maxE1rm > 0) {
    return { isPR: true, type: "e1rm" };
  }

  return { isPR: false };
}

// === Helpers ===

function parseRepRange(reps: string): { min: number; max: number } | null {
  const match = reps.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };

  const single = parseInt(reps);
  if (!isNaN(single)) return { min: single, max: single };

  return null;
}

function isLowerBodyExercise(exercise: ProgramExercise): boolean {
  const lowerMuscles: string[] = ["quads", "hamstrings", "glutes", "calves", "adductors"];
  return exercise.primaryMuscles.some((m) => lowerMuscles.includes(m));
}

/**
 * Calculate warmup sets for a compound exercise.
 * Returns warmup sets before working weight.
 */
export function getWarmupSets(workingWeight: number): { weight: number; reps: number }[] {
  if (workingWeight <= 10) return []; // No warmup for light accessories

  const sets: { weight: number; reps: number }[] = [];

  // Bar/empty: 10 reps
  sets.push({ weight: 0, reps: 10 });

  if (workingWeight >= 20) {
    // 50% for 5 reps
    sets.push({ weight: Math.round(workingWeight * 0.5 / 2.5) * 2.5, reps: 5 });
  }

  if (workingWeight >= 40) {
    // 70% for 3 reps
    sets.push({ weight: Math.round(workingWeight * 0.7 / 2.5) * 2.5, reps: 3 });
  }

  return sets;
}

// =============================================
// 3.5 — Configurable Progression Rules + Batch
// =============================================

export interface ProgressionRuleConfig {
  id: string;
  label: string;
  description: string;
  minSessionsToTrigger: number;
  maxAvgRpe: number;
  barbellIncrement: number;
  otherIncrement: number;
}

export const PROGRESSION_RULES: ProgressionRuleConfig[] = [
  {
    id: "linear-beginner",
    label: "Lineal Principiante",
    description: "RPE ≤ 7 en 1 sesión → +2.5kg barra / +2kg accesorio",
    minSessionsToTrigger: 1,
    maxAvgRpe: 7,
    barbellIncrement: 2.5,
    otherIncrement: 2,
  },
  {
    id: "double-progression",
    label: "Doble Progresión",
    description: "RPE ≤ 8 en 2 sesiones consecutivas → sube peso",
    minSessionsToTrigger: 2,
    maxAvgRpe: 8,
    barbellIncrement: 2.5,
    otherIncrement: 2,
  },
  {
    id: "rpe-conservative",
    label: "Conservador RPE",
    description: "RPE ≤ 7 por 3 sesiones → +2.5kg",
    minSessionsToTrigger: 3,
    maxAvgRpe: 7,
    barbellIncrement: 2.5,
    otherIncrement: 1,
  },
];

const ACTIVE_RULE_KEY = "mark-pt-progression-rule";

export function getActiveRuleId(): string {
  if (typeof window === "undefined") return PROGRESSION_RULES[0].id;
  return localStorage.getItem(ACTIVE_RULE_KEY) || PROGRESSION_RULES[0].id;
}

export function setActiveRuleId(ruleId: string): void {
  localStorage.setItem(ACTIVE_RULE_KEY, ruleId);
}

export function getActiveRuleConfig(): ProgressionRuleConfig {
  const id = getActiveRuleId();
  return PROGRESSION_RULES.find((r) => r.id === id) || PROGRESSION_RULES[0];
}

export interface BatchSuggestion {
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  currentReps: string;
  suggestedReps: string | null;
  reason: string;
  trend: "up" | "same" | "new";
}

/**
 * Batch progression suggestions for a list of exercise names
 * using the currently active progression rule.
 */
export function getBatchSuggestions(exerciseNames: string[]): BatchSuggestion[] {
  const rule = getActiveRuleConfig();
  const suggestions: BatchSuggestion[] = [];

  for (const name of exerciseNames) {
    const history = getExerciseHistory(name, rule.minSessionsToTrigger + 1);
    if (history.length === 0) continue;
    if (history.length < rule.minSessionsToTrigger) continue;

    const recentSlice = history.slice(0, rule.minSessionsToTrigger);
    const allBelowRpe = recentSlice.every((h) => h.avgRpe > 0 && h.avgRpe <= rule.maxAvgRpe);

    if (!allBelowRpe) continue;

    const last = history[0];
    const w = last.topSet.weight;
    if (w <= 0) continue;

    const isBarbell = /barra|barbell|press banca|sentadilla|peso muerto|squat|bench|deadlift|ohp|militar/i.test(name);
    const inc = isBarbell ? rule.barbellIncrement : rule.otherIncrement;

    suggestions.push({
      exerciseName: name,
      currentWeight: w,
      suggestedWeight: w + inc,
      currentReps: last.sets.length > 0 ? `${last.topSet.reps}` : "",
      suggestedReps: null,
      reason: `RPE ≤ ${rule.maxAvgRpe} × ${rule.minSessionsToTrigger} sesión(es) → +${inc}kg`,
      trend: "up",
    });
  }

  return suggestions;
}
