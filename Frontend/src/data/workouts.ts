import { MuscleGroup } from "./exercises";
import { getCurrentPhase } from "./phases";
import { getProgramForPhase, getTodayProgramWorkout, getProgramWorkoutById, getProgramDayMuscles, type ProgramDay, type ProgramExercise } from "./programs";

export interface Exercise {
  name: string;
  exerciseId?: string; // links to exerciseLibrary
  sets: number;
  reps: string;
  rest: string;
  load: string;
  rpe: string;
  notes?: string;
  superset?: string;
  primaryMuscles: MuscleGroup[];
}

export interface WorkoutDay {
  id: string;
  day: string;
  name: string;
  focus: string;
  duration: string;
  type: "upper" | "lower" | "pull" | "push" | "full" | "football" | "rest" | "optional";
  color: string;
  note?: string;
  exercises: Exercise[];
}

const DAY_NAMES: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

/**
 * Convert a ProgramDay to the WorkoutDay format used by existing UI.
 */
function programDayToWorkoutDay(pd: ProgramDay): WorkoutDay {
  return {
    id: pd.id,
    day: DAY_NAMES[pd.dayOfWeek] || "",
    name: pd.name,
    focus: pd.focus,
    duration: pd.duration,
    type: pd.type as WorkoutDay["type"],
    color: pd.color,
    note: pd.note,
    exercises: pd.exercises.map((e) => ({
      name: e.name,
      exerciseId: e.exerciseId,
      sets: e.sets,
      reps: e.reps,
      rest: e.rest,
      load: e.load,
      rpe: e.rpe,
      notes: e.notes,
      superset: e.superset,
      primaryMuscles: e.primaryMuscles,
    })),
  };
}

const WEEK_OVERRIDES_KEY = "mark-pt-week-overrides";

interface WeekOverrides {
  /** ISO date of the Monday this override applies to */
  weekStart: string;
  /** Maps original dayId → new position index (0=Mon, 6=Sun) */
  swaps: Record<string, number>;
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function getWeekOverrides(): WeekOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WEEK_OVERRIDES_KEY);
    if (!raw) return null;
    const data: WeekOverrides = JSON.parse(raw);
    // Only valid if same week
    if (data.weekStart !== getMonday()) {
      localStorage.removeItem(WEEK_OVERRIDES_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveWeekSwap(orderedDayIds: string[]): void {
  const swaps: Record<string, number> = {};
  orderedDayIds.forEach((id, i) => { swaps[id] = i; });
  const data: WeekOverrides = { weekStart: getMonday(), swaps };
  localStorage.setItem(WEEK_OVERRIDES_KEY, JSON.stringify(data));
}

export function resetWeekOverrides(): void {
  localStorage.removeItem(WEEK_OVERRIDES_KEY);
}

export function hasWeekOverrides(): boolean {
  return getWeekOverrides() !== null;
}

/**
 * Get the full weekly plan for the current phase.
 * Applies any week overrides (day swaps).
 */
export function getWeeklyPlan(): WorkoutDay[] {
  const phase = getCurrentPhase();
  const program = getProgramForPhase(phase.id);
  // Sort days by dayOfWeek: Mon(1) → Sun(0)
  const sorted = [...program.days].sort((a, b) => {
    const aIdx = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const bIdx = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return aIdx - bIdx;
  });
  const plan = sorted.map(programDayToWorkoutDay);

  // Apply week overrides
  const overrides = getWeekOverrides();
  if (overrides) {
    plan.sort((a, b) => {
      const aIdx = overrides.swaps[a.id] ?? plan.indexOf(a);
      const bIdx = overrides.swaps[b.id] ?? plan.indexOf(b);
      return aIdx - bIdx;
    });
    // Update day names to match new positions
    const dayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    plan.forEach((w, i) => { w.day = dayOrder[i] || w.day; });
  }

  return plan;
}

// Keep backward compat — weeklyPlan is now dynamic
export const weeklyPlan: WorkoutDay[] = typeof window !== "undefined" ? getWeeklyPlan() : [];

// Get all targeted muscles for a workout day
export function getWorkoutMuscles(day: WorkoutDay): MuscleGroup[] {
  const muscles = new Set<MuscleGroup>();
  day.exercises.forEach((ex) => {
    ex.primaryMuscles.forEach((m) => muscles.add(m));
  });
  return Array.from(muscles);
}

// Get workout by id (searches current phase program)
export function getWorkoutById(id: string): WorkoutDay | undefined {
  const plan = getWeeklyPlan();
  return plan.find((w) => w.id === id);
}

// Get today's workout from current phase
export function getTodayWorkout(): WorkoutDay | undefined {
  const phase = getCurrentPhase();
  const pd = getTodayProgramWorkout(phase.id);
  return pd ? programDayToWorkoutDay(pd) : undefined;
}

/**
 * Get the next upcoming workout day (tomorrow or later).
 * Searches up to 7 days ahead, skipping rest days.
 */
export function getNextWorkoutDay(): { workout: WorkoutDay; daysFromNow: number; dayName: string } | undefined {
  const phase = getCurrentPhase();
  const program = getProgramForPhase(phase.id);

  for (let offset = 1; offset <= 7; offset++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + offset);
    const futureDow = futureDate.getDay();
    const pd = program.days.find((d) => d.dayOfWeek === futureDow);
    if (pd && pd.type !== "rest" && pd.exercises.length > 0) {
      return {
        workout: programDayToWorkoutDay(pd),
        daysFromNow: offset,
        dayName: DAY_NAMES[futureDow] || "",
      };
    }
  }
  return undefined;
}

// =============================================
// 5.4 — Exercise Transfer Between Days
// =============================================

const EXERCISE_TRANSFERS_KEY = "mark-pt-exercise-transfers";

export interface ExerciseTransfer {
  weekStart: string;
  /** Maps: "fromDayId:exerciseIndex" → "toDayId" */
  moves: Record<string, string>;
}

function getExerciseTransfers(): ExerciseTransfer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EXERCISE_TRANSFERS_KEY);
    if (!raw) return null;
    const data: ExerciseTransfer = JSON.parse(raw);
    if (data.weekStart !== getMonday()) {
      localStorage.removeItem(EXERCISE_TRANSFERS_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Move an exercise from one day to another for this week.
 */
export function transferExercise(fromDayId: string, exerciseIndex: number, toDayId: string): void {
  const existing = getExerciseTransfers() || { weekStart: getMonday(), moves: {} };
  const key = `${fromDayId}:${exerciseIndex}`;
  existing.moves[key] = toDayId;
  localStorage.setItem(EXERCISE_TRANSFERS_KEY, JSON.stringify(existing));
}

/**
 * Remove a transfer for an exercise.
 */
export function undoTransfer(fromDayId: string, exerciseIndex: number): void {
  const existing = getExerciseTransfers();
  if (!existing) return;
  delete existing.moves[`${fromDayId}:${exerciseIndex}`];
  if (Object.keys(existing.moves).length === 0) {
    localStorage.removeItem(EXERCISE_TRANSFERS_KEY);
  } else {
    localStorage.setItem(EXERCISE_TRANSFERS_KEY, JSON.stringify(existing));
  }
}

export function resetExerciseTransfers(): void {
  localStorage.removeItem(EXERCISE_TRANSFERS_KEY);
}

export function hasExerciseTransfers(): boolean {
  return getExerciseTransfers() !== null;
}

/**
 * Get weekly plan with exercise transfers applied.
 * Exercises moved from one day appear in the target day.
 */
export function getWeeklyPlanWithTransfers(): WorkoutDay[] {
  const plan = getWeeklyPlan();
  const transfers = getExerciseTransfers();
  if (!transfers || Object.keys(transfers.moves).length === 0) return plan;

  // Clone plan deeply
  const cloned = plan.map((day) => ({
    ...day,
    exercises: [...day.exercises],
  }));

  // Collect exercises to move (process in reverse index order to avoid shifting)
  const toAdd: { toDayId: string; exercise: Exercise }[] = [];
  const toRemove: { dayId: string; index: number }[] = [];

  for (const [key, toDayId] of Object.entries(transfers.moves)) {
    const [fromDayId, indexStr] = key.split(":");
    const index = parseInt(indexStr, 10);
    const fromDay = cloned.find((d) => d.id === fromDayId);
    if (!fromDay || index >= fromDay.exercises.length) continue;
    toRemove.push({ dayId: fromDayId, index });
    toAdd.push({ toDayId, exercise: fromDay.exercises[index] });
  }

  // Remove in reverse order so indices stay valid
  toRemove.sort((a, b) => b.index - a.index);
  for (const { dayId, index } of toRemove) {
    const day = cloned.find((d) => d.id === dayId);
    if (day) day.exercises.splice(index, 1);
  }

  // Add to target days
  for (const { toDayId, exercise } of toAdd) {
    const day = cloned.find((d) => d.id === toDayId);
    if (day) day.exercises.push(exercise);
  }

  return cloned;
}
