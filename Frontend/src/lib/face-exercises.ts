import { safeGetItem, safeSetItem, generateId, today } from "./storage";
import type { TimeOfDay } from "./habits";

// ── Types ──

export interface FaceExercise {
  id: string;
  name: string;
  description: string;
  type: "timed" | "reps" | "check";
  defaultDuration?: number; // seconds (for timed)
  defaultReps?: number;
  imageUrl?: string;
}

export interface FaceRoutine {
  id: string;
  name: string;
  icon: string;
  timesPerDay: number; // 1 or 3
  exercises: FaceRoutineExercise[];
  isTemplate: boolean;
  archived: boolean;
  createdAt: string;
}

export interface FaceRoutineExercise {
  exerciseId: string;
  sets?: number;
  reps?: number;
  duration?: number; // seconds
  order: number;
}

export interface FaceSession {
  id: string;
  routineId: string;
  date: string;
  timeOfDay: TimeOfDay | null;
  startedAt: string;
  completedAt?: string;
  exercises: FaceSessionExercise[];
  completed: boolean;
  totalDuration: number; // seconds
}

export interface FaceSessionExercise {
  exerciseId: string;
  completed: boolean;
  actualReps?: number;
  actualDuration?: number;
}

// ── Storage Keys ──
const FACE_EXERCISES_KEY = "mark-pt-face-exercises";
const FACE_ROUTINES_KEY = "mark-pt-face-routines";
const FACE_SESSIONS_KEY = "mark-pt-face-sessions";

// ── Default Templates ──

const DEFAULT_EXERCISES: FaceExercise[] = [
  {
    id: "thumbpull",
    name: "Thumb Pull",
    description: "Coloca los pulgares dentro de la boca en las mejillas y estira suavemente hacia afuera mientras resistes con los músculos faciales.",
    type: "timed",
    defaultDuration: 30,
  },
  {
    id: "mewing",
    name: "Mewing",
    description: "Presiona la lengua completa contra el paladar y mantén. Asegura que la parte posterior de la lengua también esté presionando.",
    type: "timed",
    defaultDuration: 60,
  },
  {
    id: "jaw-clench",
    name: "Jaw Clench",
    description: "Aprieta los dientes suavemente y mantén la posición. Siente la contracción en los maseteros.",
    type: "timed",
    defaultDuration: 15,
  },
  {
    id: "chin-tuck",
    name: "Chin Tuck",
    description: "Retrae la barbilla hacia atrás creando 'doble papada' intencional. Mantén la posición.",
    type: "reps",
    defaultReps: 15,
  },
  {
    id: "cheek-puff",
    name: "Cheek Puff",
    description: "Infla las mejillas con aire y alterna de lado a lado. Ayuda a tonificar los buccinadores.",
    type: "reps",
    defaultReps: 20,
  },
  {
    id: "brow-raise",
    name: "Brow Raise",
    description: "Levanta las cejas lo más alto posible y mantén. Luego relaja. Tonifica la frente.",
    type: "reps",
    defaultReps: 15,
  },
  {
    id: "lip-press",
    name: "Lip Press",
    description: "Presiona los labios juntos firmemente y mantén. Trabaja el orbicular de los labios.",
    type: "timed",
    defaultDuration: 20,
  },
  {
    id: "neck-stretch",
    name: "Neck Stretch",
    description: "Inclina la cabeza hacia un lado, mantén 15s, luego al otro. Estira el esternocleidomastoideo.",
    type: "timed",
    defaultDuration: 30,
  },
];

const DEFAULT_ROUTINES: FaceRoutine[] = [
  {
    id: "thumbpull-daily",
    name: "Thumbpull Diario",
    icon: "👍",
    timesPerDay: 1,
    isTemplate: true,
    archived: false,
    createdAt: new Date().toISOString(),
    exercises: [
      { exerciseId: "thumbpull", sets: 3, duration: 30, order: 0 },
    ],
  },
  {
    id: "face-routine-3x",
    name: "Rutina Facial 3x/día",
    icon: "🧘",
    timesPerDay: 3,
    isTemplate: true,
    archived: false,
    createdAt: new Date().toISOString(),
    exercises: [
      { exerciseId: "mewing", duration: 60, order: 0 },
      { exerciseId: "jaw-clench", duration: 15, sets: 3, order: 1 },
      { exerciseId: "chin-tuck", reps: 15, order: 2 },
      { exerciseId: "cheek-puff", reps: 20, order: 3 },
      { exerciseId: "brow-raise", reps: 15, order: 4 },
    ],
  },
  {
    id: "quick-mewing",
    name: "Quick Mewing",
    icon: "👅",
    timesPerDay: 3,
    isTemplate: true,
    archived: false,
    createdAt: new Date().toISOString(),
    exercises: [
      { exerciseId: "mewing", duration: 120, order: 0 },
    ],
  },
];

// ── CRUD: Exercises ──

export function getFaceExercises(): FaceExercise[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(FACE_EXERCISES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Initialize with defaults
  safeSetItem(FACE_EXERCISES_KEY, JSON.stringify(DEFAULT_EXERCISES));
  return [...DEFAULT_EXERCISES];
}

export function getFaceExerciseById(id: string): FaceExercise | undefined {
  return getFaceExercises().find(e => e.id === id);
}

export function saveFaceExercise(exercise: FaceExercise): void {
  const exercises = getFaceExercises();
  const idx = exercises.findIndex(e => e.id === exercise.id);
  if (idx >= 0) exercises[idx] = exercise;
  else exercises.push(exercise);
  safeSetItem(FACE_EXERCISES_KEY, JSON.stringify(exercises));
}

// ── CRUD: Routines ──

export function getFaceRoutines(): FaceRoutine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(FACE_ROUTINES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Initialize templates
  safeSetItem(FACE_ROUTINES_KEY, JSON.stringify(DEFAULT_ROUTINES));
  return [...DEFAULT_ROUTINES];
}

export function getActiveFaceRoutines(): FaceRoutine[] {
  return getFaceRoutines().filter(r => !r.archived);
}

export function getFaceRoutineById(id: string): FaceRoutine | undefined {
  return getFaceRoutines().find(r => r.id === id);
}

export function saveFaceRoutine(routine: FaceRoutine): void {
  const routines = getFaceRoutines();
  const idx = routines.findIndex(r => r.id === routine.id);
  if (idx >= 0) routines[idx] = routine;
  else routines.push(routine);
  safeSetItem(FACE_ROUTINES_KEY, JSON.stringify(routines));
}

export function createFaceRoutine(data: Omit<FaceRoutine, "id" | "createdAt" | "archived" | "isTemplate">): FaceRoutine {
  const routine: FaceRoutine = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    archived: false,
    isTemplate: false,
  };
  const routines = getFaceRoutines();
  routines.push(routine);
  safeSetItem(FACE_ROUTINES_KEY, JSON.stringify(routines));
  return routine;
}

export function deleteFaceRoutine(id: string): void {
  const routines = getFaceRoutines().filter(r => r.id !== id);
  safeSetItem(FACE_ROUTINES_KEY, JSON.stringify(routines));
}

// ── CRUD: Sessions ──

export function getFaceSessions(): FaceSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(FACE_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getFaceSessionsForDate(date: string): FaceSession[] {
  return getFaceSessions().filter(s => s.date === date);
}

export function saveFaceSession(session: FaceSession): void {
  const sessions = getFaceSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.push(session);
  safeSetItem(FACE_SESSIONS_KEY, JSON.stringify(sessions));
}

export function startFaceSession(routineId: string, timeOfDay: TimeOfDay | null): FaceSession {
  const routine = getFaceRoutineById(routineId);
  if (!routine) throw new Error("Routine not found");
  const session: FaceSession = {
    id: generateId(),
    routineId,
    date: today(),
    timeOfDay,
    startedAt: new Date().toISOString(),
    exercises: routine.exercises.map(e => ({
      exerciseId: e.exerciseId,
      completed: false,
    })),
    completed: false,
    totalDuration: 0,
  };
  saveFaceSession(session);
  return session;
}

export function completeFaceSession(sessionId: string, totalDuration: number): void {
  const sessions = getFaceSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    session.completed = true;
    session.completedAt = new Date().toISOString();
    session.totalDuration = totalDuration;
    session.exercises.forEach(e => { e.completed = true; });
    safeSetItem(FACE_SESSIONS_KEY, JSON.stringify(sessions));
  }
}

// ── Stats ──

export function getFaceSessionCount(): number {
  return getFaceSessions().filter(s => s.completed).length;
}

export function getFaceTotalMinutes(): number {
  return Math.round(
    getFaceSessions()
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.totalDuration, 0) / 60
  );
}

export function isFaceRoutineCompletedForSlot(routineId: string, date: string, timeOfDay: TimeOfDay | null): boolean {
  return getFaceSessionsForDate(date).some(
    s => s.routineId === routineId && s.timeOfDay === timeOfDay && s.completed
  );
}

export function getFaceRoutineCompletionForDate(routineId: string, date: string): { done: number; total: number } {
  const routine = getFaceRoutineById(routineId);
  if (!routine) return { done: 0, total: 0 };
  const total = routine.timesPerDay;
  const sessions = getFaceSessionsForDate(date).filter(
    s => s.routineId === routineId && s.completed
  );
  let done: number;
  if (routine.timesPerDay === 1) {
    done = sessions.length > 0 ? 1 : 0;
  } else {
    const completedSlots = new Set(sessions.map(s => s.timeOfDay));
    done = completedSlots.size;
  }
  return { done, total };
}
