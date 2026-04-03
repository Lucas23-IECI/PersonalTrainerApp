import { getCurrentPhase, getPhaseProgress, getPhaseWeek, getPhaseTotalWeeks, type Phase } from "./phases";
import { getProfile as getStoredProfile, type UserProfile } from "@/lib/storage";

const DEFAULTS: UserProfile = {
  name: "Lucas Gabriel Méndez Risopatrón",
  age: 22,
  height: 177,
  weight: 81.2,
  goalWeight: 74.5,
  bodyFatEstimate: 26.5,
  goalBodyFat: 13,
  bmr: 1813,
  tdee: 2810,
  targetCalories: 2300,
  brazilDate: "2027-02-01",
  heavyWeightsDate: "2026-04-21",
  startDate: "2026-04-02",
};

/** Read profile from localStorage, falling back to defaults */
export function getProfileData(): UserProfile {
  const stored = getStoredProfile();
  return stored ? { ...DEFAULTS, ...stored } : DEFAULTS;
}

/** Legacy export — reads dynamically now */
export const profile = typeof window !== "undefined" ? getProfileData() : DEFAULTS;

export const profileDefaults = DEFAULTS;

export const profileMeasurements = {
  date: "2026-04-02",
  chest: 105,
  waist: 97,
  hip: 103,
  armR: 34,
  armL: 33,
  thighR: 55,
  thighL: 53,
  calfR: 36,
  calfL: 35,
  neck: 38,
};

export const historicLifts = {
  squat: 140,
  bench: 100,
  deadlift: 200,
};

export const equipment = {
  pullUpBar: true,
  barbell: true,
  rackImprovised: true,
  dumbbellsMaxKg: 12.5,
  barbellWeights: [35, 50],
  cables: false,
  bands: false,
  gym: true,
  gymAvailableFrom: "2026-04-21",
};

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCurrentPhaseLabel(): string {
  const phase = getCurrentPhase();
  return `FASE ${phase.id} — ${phase.name}`;
}

export function getCurrentPhaseInfo(): {
  phase: Phase;
  progress: number;
  week: number;
  totalWeeks: number;
  label: string;
} {
  const phase = getCurrentPhase();
  return {
    phase,
    progress: getPhaseProgress(phase),
    week: getPhaseWeek(phase),
    totalWeeks: getPhaseTotalWeeks(phase),
    label: `FASE ${phase.id} — ${phase.name}`,
  };
}
