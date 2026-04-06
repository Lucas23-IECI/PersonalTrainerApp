import type { Exercise } from "@/data/workouts";
import type { LoggedSet, SetType } from "@/lib/storage";

export interface SessionSet extends LoggedSet {
  completed: boolean;
  isWarmup: boolean;
  setType: SetType;
  note?: string;
}

export interface SessionExercise {
  name: string;
  exerciseRef: Exercise;
  exIndex: number;
  notes: string;
  restSeconds: number;
  isCompound: boolean;
  sets: SessionSet[];
  supersetTag?: string;
  previousSets: { weight: number; reps: number }[];
}

export const SUPERSET_COLORS: Record<string, string> = {
  A: "#0A84FF",
  B: "#AF52DE",
  C: "#30D158",
  D: "#FF9500",
  E: "#FF375F",
  F: "#64D2FF",
};

export const SUPERSET_TAGS = Object.keys(SUPERSET_COLORS);

export function formatDuration(ms: number) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRest(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
}
