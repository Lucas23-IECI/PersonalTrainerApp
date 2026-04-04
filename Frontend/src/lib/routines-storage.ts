// =============================================
// Routines storage — CRUD, Folders, Clone
// Independent from the phase-based program system
// =============================================

import type { MuscleGroup } from "../data/exercises";
import type { LibraryProgram, LibraryProgramDay, LibraryProgramExercise } from "../data/program-library";

// ── Types ──

export interface RoutineExercise {
  name: string;
  exerciseId?: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: string;
  notes?: string;
  superset?: string;
  primaryMuscles: MuscleGroup[];
  isCompound: boolean;
}

export interface RoutineDay {
  id: string;
  name: string;
  focus: string;
  type: string;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  folderId?: string;        // optional folder grouping
  sourceLibraryId?: string; // if cloned from library
  daysPerWeek: number;
  split: string;
  days: RoutineDay[];
  createdAt: number;
  updatedAt: number;
}

export interface RoutineFolder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// ── Keys ──

const STORAGE_KEYS = {
  routines: "mark-pt-routines",
  folders: "mark-pt-routine-folders",
} as const;

// ── Helpers ──

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// =============================================
// Routine CRUD
// =============================================

export function getRoutines(): Routine[] {
  return load<Routine>(STORAGE_KEYS.routines);
}

export function getRoutine(id: string): Routine | undefined {
  return getRoutines().find((r) => r.id === id);
}

export function saveRoutine(routine: Routine): Routine {
  const all = getRoutines();
  const idx = all.findIndex((r) => r.id === routine.id);
  routine.updatedAt = Date.now();
  if (idx >= 0) {
    all[idx] = routine;
  } else {
    all.push(routine);
  }
  persist(STORAGE_KEYS.routines, all);
  return routine;
}

export function deleteRoutine(id: string): void {
  persist(STORAGE_KEYS.routines, getRoutines().filter((r) => r.id !== id));
}

// =============================================
// Create from scratch
// =============================================

export function createEmptyRoutine(name: string): Routine {
  const routine: Routine = {
    id: generateId(),
    name,
    description: "",
    daysPerWeek: 0,
    split: "",
    days: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return saveRoutine(routine);
}

// =============================================
// Clone from Library (3.1) or from existing routine (3.4)
// =============================================

function convertLibraryDay(day: LibraryProgramDay, index: number): RoutineDay {
  return {
    id: `day-${index}-${Date.now().toString(36)}`,
    name: day.name,
    focus: day.focus,
    type: day.type,
    exercises: day.exercises.map((e) => ({ ...e })),
  };
}

export function cloneFromLibrary(program: LibraryProgram): Routine {
  const routine: Routine = {
    id: generateId(),
    name: program.name,
    description: program.description,
    sourceLibraryId: program.id,
    daysPerWeek: program.daysPerWeek,
    split: program.split,
    days: program.days.map((d, i) => convertLibraryDay(d, i)),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return saveRoutine(routine);
}

export function cloneRoutine(id: string): Routine | undefined {
  const source = getRoutine(id);
  if (!source) return undefined;
  const clone: Routine = {
    ...structuredClone(source),
    id: generateId(),
    name: `${source.name} (Copia)`,
    folderId: source.folderId,
    sourceLibraryId: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  // Re-generate day ids
  clone.days = clone.days.map((d, i) => ({
    ...d,
    id: `day-${i}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
  }));
  return saveRoutine(clone);
}

// =============================================
// Folder CRUD
// =============================================

const FOLDER_COLORS = ["#0A84FF", "#30D158", "#FF9F0A", "#FF453A", "#BF5AF2", "#64D2FF", "#FFD60A", "#AC8E68"];

export function getFolders(): RoutineFolder[] {
  return load<RoutineFolder>(STORAGE_KEYS.folders);
}

export function getFolder(id: string): RoutineFolder | undefined {
  return getFolders().find((f) => f.id === id);
}

export function createFolder(name: string): RoutineFolder {
  const all = getFolders();
  const colorIdx = all.length % FOLDER_COLORS.length;
  const folder: RoutineFolder = {
    id: generateId(),
    name,
    color: FOLDER_COLORS[colorIdx],
    createdAt: Date.now(),
  };
  all.push(folder);
  persist(STORAGE_KEYS.folders, all);
  return folder;
}

export function updateFolder(id: string, updates: Partial<Pick<RoutineFolder, "name" | "color">>): void {
  const all = getFolders();
  const idx = all.findIndex((f) => f.id === id);
  if (idx >= 0) {
    Object.assign(all[idx], updates);
    persist(STORAGE_KEYS.folders, all);
  }
}

export function deleteFolder(id: string): void {
  // Unassign routines from the deleted folder
  const routines = getRoutines();
  routines.forEach((r) => {
    if (r.folderId === id) r.folderId = undefined;
  });
  persist(STORAGE_KEYS.routines, routines);
  persist(STORAGE_KEYS.folders, getFolders().filter((f) => f.id !== id));
}

export function moveRoutineToFolder(routineId: string, folderId: string | undefined): void {
  const all = getRoutines();
  const idx = all.findIndex((r) => r.id === routineId);
  if (idx >= 0) {
    all[idx].folderId = folderId;
    all[idx].updatedAt = Date.now();
    persist(STORAGE_KEYS.routines, all);
  }
}

// =============================================
// Query helpers
// =============================================

export function getRoutinesByFolder(folderId: string | undefined): Routine[] {
  return getRoutines().filter((r) => r.folderId === folderId);
}

export function getRoutinesWithoutFolder(): Routine[] {
  return getRoutines().filter((r) => !r.folderId);
}
