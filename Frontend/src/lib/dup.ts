// =============================================
// 5.5 — DUP (Daily Undulating Periodization)
// Auto-rotates rep/load/RPE schemes per session
// =============================================

const DUP_KEY = "mark-pt-dup-state";

export type DUPScheme = "heavy" | "moderate" | "light";

export interface DUPConfig {
  reps: string;
  rpe: string;
  load: string;
  label: string;
  color: string;
}

export const DUP_SCHEMES: Record<DUPScheme, DUPConfig> = {
  heavy: {
    reps: "3-5",
    rpe: "8-9",
    load: "85-90%",
    label: "Pesado",
    color: "#FF453A",
  },
  moderate: {
    reps: "6-10",
    rpe: "7-8",
    load: "70-80%",
    label: "Moderado",
    color: "#FF9500",
  },
  light: {
    reps: "10-15",
    rpe: "6-7",
    load: "55-65%",
    label: "Liviano",
    color: "#34C759",
  },
};

const ROTATION: DUPScheme[] = ["heavy", "moderate", "light"];

interface DUPState {
  enabled: boolean;
  /** Maps dayId → number of completed sessions (for rotation) */
  counters: Record<string, number>;
}

function getState(): DUPState {
  if (typeof window === "undefined") return { enabled: false, counters: {} };
  try {
    const raw = localStorage.getItem(DUP_KEY);
    if (!raw) return { enabled: false, counters: {} };
    return JSON.parse(raw);
  } catch {
    return { enabled: false, counters: {} };
  }
}

function saveState(state: DUPState): void {
  localStorage.setItem(DUP_KEY, JSON.stringify(state));
}

export function isDUPEnabled(): boolean {
  return getState().enabled;
}

export function toggleDUP(enabled: boolean): void {
  const state = getState();
  state.enabled = enabled;
  saveState(state);
}

/**
 * Get the current DUP scheme for a given workout day.
 * Rotates through heavy → moderate → light based on session count.
 */
export function getDUPScheme(dayId: string): DUPScheme {
  const state = getState();
  const count = state.counters[dayId] || 0;
  return ROTATION[count % 3];
}

/**
 * Get full config for a workout day.
 */
export function getDUPConfig(dayId: string): DUPConfig {
  return DUP_SCHEMES[getDUPScheme(dayId)];
}

/**
 * Advance the rotation counter after completing a session.
 */
export function advanceDUPCounter(dayId: string): void {
  const state = getState();
  state.counters[dayId] = (state.counters[dayId] || 0) + 1;
  saveState(state);
}

/**
 * Reset all DUP counters.
 */
export function resetDUPCounters(): void {
  const state = getState();
  state.counters = {};
  saveState(state);
}

/**
 * Apply DUP scheme to an exercise (only compounds).
 * Returns modified reps/rpe/load or null if DUP is disabled or exercise is accessory.
 */
export function applyDUP(
  dayId: string,
  exercise: { reps: string; rpe: string; load: string; isCompound?: boolean }
): { reps: string; rpe: string; load: string } | null {
  if (!isDUPEnabled()) return null;
  if (!exercise.isCompound) return null;

  const scheme = getDUPConfig(dayId);
  return {
    reps: scheme.reps,
    rpe: scheme.rpe,
    load: scheme.load,
  };
}

/**
 * Get a preview of the next 3 sessions for a day.
 */
export function getDUPPreview(dayId: string): { scheme: DUPScheme; config: DUPConfig }[] {
  const state = getState();
  const base = state.counters[dayId] || 0;
  return [0, 1, 2].map((offset) => {
    const scheme = ROTATION[(base + offset) % 3];
    return { scheme, config: DUP_SCHEMES[scheme] };
  });
}
