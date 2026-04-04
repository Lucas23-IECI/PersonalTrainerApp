// =============================================
// Custom Exercises CRUD (3.8) + Clone (3.10)
// User-created exercises stored in localStorage
// =============================================

import type { MuscleGroup, ExerciseCategory, LibraryExercise } from "../data/exercises";
import { exerciseLibrary } from "../data/exercises";

const STORAGE_KEY = "mark-pt-custom-exercises";

export interface CustomExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  instructions?: string;
  tips?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isCustom: true;
  createdAt: number;
}

// ── Helpers ──

function generateId(): string {
  return "custom_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function load(): CustomExercise[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(data: CustomExercise[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── CRUD ──

export function getCustomExercises(): CustomExercise[] {
  return load();
}

export function getCustomExercise(id: string): CustomExercise | undefined {
  return load().find((e) => e.id === id);
}

export function saveCustomExercise(exercise: CustomExercise): CustomExercise {
  const all = load();
  const idx = all.findIndex((e) => e.id === exercise.id);
  if (idx >= 0) {
    all[idx] = exercise;
  } else {
    all.push(exercise);
  }
  persist(all);
  return exercise;
}

export function createCustomExercise(data: {
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  instructions?: string;
  tips?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}): CustomExercise {
  const exercise: CustomExercise = {
    id: generateId(),
    name: data.name,
    category: data.category,
    primaryMuscles: data.primaryMuscles,
    secondaryMuscles: data.secondaryMuscles || [],
    instructions: data.instructions,
    tips: data.tips,
    difficulty: data.difficulty || "intermediate",
    isCustom: true,
    createdAt: Date.now(),
  };
  return saveCustomExercise(exercise);
}

export function deleteCustomExercise(id: string): void {
  persist(load().filter((e) => e.id !== id));
}

// ── Clone from library (3.10) ──

export function cloneExerciseFromLibrary(libraryId: string, newName?: string): CustomExercise | undefined {
  const source = exerciseLibrary.find((e) => e.id === libraryId);
  if (!source) return undefined;
  return createCustomExercise({
    name: newName || `${source.name} (Custom)`,
    category: source.category,
    primaryMuscles: [...source.primaryMuscles],
    secondaryMuscles: [...source.secondaryMuscles],
    instructions: source.instructions,
    tips: source.tips,
    difficulty: source.difficulty,
  });
}

// ── Merged library (library + custom) ──

export function getAllExercises(): (LibraryExercise | CustomExercise)[] {
  return [...exerciseLibrary, ...getCustomExercises()];
}

export function findExerciseByName(name: string): LibraryExercise | CustomExercise | undefined {
  return getAllExercises().find((e) => e.name === name);
}
