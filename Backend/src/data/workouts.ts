import { MuscleGroup } from "./exercises.js";

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
  type: "upper" | "lower" | "full" | "football" | "rest" | "optional";
  color: string;
  note?: string;
  exercises: Exercise[];
}

// =============================================
// PROGRAMA: VUELTA AL RUEDO — Light 3-4 días
// Objetivo: reactivar patrones, ir liviano,
// preparar tendones. Fútbol miércoles 20hs.
// =============================================

export const weeklyPlan: WorkoutDay[] = [
  {
    id: "mon",
    day: "Lunes",
    name: "Upper Body A — Push Focus",
    focus: "Pecho, hombros, tríceps",
    duration: "35–40 min",
    type: "upper",
    color: "#0A84FF",
    note: "Empezar liviano. Enfocarse en técnica y conexión mente-músculo.",
    exercises: [
      {
        name: "Press Mancuernas",
        exerciseId: "db_bench",
        sets: 3,
        reps: "10–12",
        rest: "60s",
        load: "10–12.5 kg/mano",
        rpe: "6-7",
        notes: "Acostado en banco/piso. Full ROM, pecho al piso. Tempo controlado.",
        primaryMuscles: ["chest", "front_delts", "triceps"],
        superset: "A",
      },
      {
        name: "Elevación Lateral",
        exerciseId: "lateral_raise",
        sets: 3,
        reps: "15–20",
        rest: "30s",
        load: "5–7 kg",
        rpe: "7",
        notes: "Sin impulso, subir hasta paralelo. Pausa 1s arriba.",
        primaryMuscles: ["side_delts"],
        superset: "A",
      },
      {
        name: "Flexiones",
        exerciseId: "pushup",
        sets: 3,
        reps: "12–15",
        rest: "45s",
        load: "Bodyweight",
        rpe: "6",
        notes: "Full ROM. Si es fácil → pies elevados.",
        primaryMuscles: ["chest", "front_delts", "triceps"],
        superset: "B",
      },
      {
        name: "Extensión Tríceps Overhead",
        exerciseId: "overhead_ext",
        sets: 3,
        reps: "12–15",
        rest: "45s",
        load: "8–10 kg",
        rpe: "7",
        notes: "Con una mancuerna, dos manos. Codo fijo apuntando al techo.",
        primaryMuscles: ["triceps"],
        superset: "B",
      },
      {
        name: "Plancha",
        exerciseId: "plank",
        sets: 2,
        reps: "45s",
        rest: "30s",
        load: "Bodyweight",
        rpe: "6",
        notes: "Apretar glúteos y core. Cuerpo recto.",
        primaryMuscles: ["abs", "obliques"],
      },
    ],
  },
  {
    id: "tue",
    day: "Martes",
    name: "Lower Body A — Quad Focus",
    focus: "Cuádriceps, glúteos, core",
    duration: "35–40 min",
    type: "lower",
    color: "#f59e0b",
    note: "Piernas liviano. No olvidar gemelos. Mañana es fútbol → no reventar.",
    exercises: [
      {
        name: "Goblet Squat",
        exerciseId: "goblet_squat",
        sets: 3,
        reps: "12–15",
        rest: "60s",
        load: "12.5 kg",
        rpe: "6-7",
        notes: "DB al pecho. Bajar profundo, codos entre rodillas.",
        primaryMuscles: ["quads", "glutes"],
        superset: "A",
      },
      {
        name: "Elevación de Talones",
        exerciseId: "calf_raise",
        sets: 3,
        reps: "20/pierna",
        rest: "30s",
        load: "Bodyweight",
        rpe: "7",
        notes: "En escalón, una pierna. Full stretch abajo, pausa arriba.",
        primaryMuscles: ["calves"],
        superset: "A",
      },
      {
        name: "Zancadas con Mancuernas",
        exerciseId: "db_lunge",
        sets: 3,
        reps: "10/pierna",
        rest: "60s",
        load: "8–10 kg/mano",
        rpe: "6-7",
        notes: "Paso largo, rodilla trasera casi toca el piso. Alternar.",
        primaryMuscles: ["quads", "glutes", "hamstrings"],
        superset: "B",
      },
      {
        name: "RDL Mancuernas",
        exerciseId: "db_rdl",
        sets: 3,
        reps: "12–15",
        rest: "60s",
        load: "10–12.5 kg/mano",
        rpe: "6",
        notes: "Sentir el estiramiento en isquios. Espalda neutra siempre.",
        primaryMuscles: ["hamstrings", "glutes"],
        superset: "B",
      },
      {
        name: "Dead Bug",
        exerciseId: "dead_bug",
        sets: 2,
        reps: "10/lado",
        rest: "30s",
        load: "Bodyweight",
        rpe: "5",
        notes: "Core estabilizado, lumbar pegada al piso.",
        primaryMuscles: ["abs"],
      },
    ],
  },
  {
    id: "wed",
    day: "Miércoles",
    name: "Fútbol ⚽",
    focus: "Cardio, piernas, agilidad",
    duration: "90 min",
    type: "football",
    color: "#22c55e",
    note: "Partido a las 20hs. Movilidad dinámica antes, estiramientos después.",
    exercises: [
      {
        name: "Movilidad dinámica (pre)",
        sets: 1,
        reps: "5 min",
        rest: "—",
        load: "—",
        rpe: "3",
        notes: "Leg swings, hip circles, walking lunges, high knees.",
        primaryMuscles: ["hip_flexors", "quads", "hamstrings"],
      },
      {
        name: "Fútbol",
        sets: 1,
        reps: "60–90 min",
        rest: "—",
        load: "—",
        rpe: "7-8",
        notes: "Hidratarse cada 15 min. Cuidar tobillos.",
        primaryMuscles: ["quads", "hamstrings", "calves", "glutes"],
      },
      {
        name: "Estiramientos estáticos (post)",
        sets: 1,
        reps: "10 min",
        rest: "—",
        load: "—",
        rpe: "3",
        notes: "Cuádriceps, isquios, aductores, gemelos, hip flexors. 30s cada uno.",
        primaryMuscles: ["quads", "hamstrings", "calves", "hip_flexors"],
      },
    ],
  },
  {
    id: "thu",
    day: "Jueves",
    name: "Upper Body B — Pull Focus",
    focus: "Espalda, bíceps, trapecio",
    duration: "35–40 min",
    type: "upper",
    color: "#0A84FF",
    note: "Recuperación de fútbol. Predomina tirón. Si hay dolor → reducir volumen.",
    exercises: [
      {
        name: "Dominadas",
        exerciseId: "pullup",
        sets: 3,
        reps: "AMRAP",
        rest: "90s",
        load: "Bodyweight",
        rpe: "7-8",
        notes: "Pronación. Bajar completo. Si < 5 reps → negativas 4s.",
        primaryMuscles: ["lats", "upper_back", "biceps"],
        superset: "A",
      },
      {
        name: "Face Pull (Banda)",
        exerciseId: "face_pull_band",
        sets: 3,
        reps: "15–20",
        rest: "30s",
        load: "Banda media",
        rpe: "6",
        notes: "Deltoides posterior + rotadores. Abrir bien al tirar.",
        primaryMuscles: ["rear_delts", "upper_back"],
        superset: "A",
      },
      {
        name: "Remo Mancuerna",
        exerciseId: "db_row",
        sets: 3,
        reps: "10–12/lado",
        rest: "60s",
        load: "12.5 kg",
        rpe: "7",
        notes: "Apoyado en banco. Tirar con codo, apretar escápula arriba.",
        primaryMuscles: ["lats", "upper_back", "biceps"],
        superset: "B",
      },
      {
        name: "Curl Martillo",
        exerciseId: "hammer_curl",
        sets: 3,
        reps: "12–15",
        rest: "45s",
        load: "8–10 kg",
        rpe: "7",
        notes: "Palmas enfrentadas. Sin balanceo. Controlar bajada.",
        primaryMuscles: ["biceps", "forearms"],
        superset: "B",
      },
      {
        name: "Plancha Lateral",
        exerciseId: "side_plank",
        sets: 2,
        reps: "30s/lado",
        rest: "30s",
        load: "Bodyweight",
        rpe: "6",
        notes: "Cuerpo recto, desde codo. Apretar oblicuos.",
        primaryMuscles: ["obliques", "abs"],
      },
    ],
  },
  {
    id: "fri",
    day: "Viernes",
    name: "Lower Body B + Core",
    focus: "Isquios, glúteos, core",
    duration: "30–35 min",
    type: "lower",
    color: "#f59e0b",
    note: "Sesión más corta. Foco en posterior y core. Terminar la semana bien.",
    exercises: [
      {
        name: "Hip Thrust",
        exerciseId: "hip_thrust",
        sets: 3,
        reps: "15–20",
        rest: "45s",
        load: "Bodyweight",
        rpe: "6-7",
        notes: "Espalda alta en banco, pies a la altura de cadera. Apretar glúteos arriba.",
        primaryMuscles: ["glutes", "hamstrings"],
        superset: "A",
      },
      {
        name: "Sentadilla Búlgara",
        exerciseId: "bulgarian_split",
        sets: 3,
        reps: "10/pierna",
        rest: "60s",
        load: "Bodyweight o 5–8 kg/mano",
        rpe: "7",
        notes: "Pie trasero en banco. Rodilla delantera no pase la punta del pie.",
        primaryMuscles: ["quads", "glutes", "hamstrings"],
        superset: "A",
      },
      {
        name: "Superman",
        exerciseId: "superman",
        sets: 3,
        reps: "12–15",
        rest: "30s",
        load: "Bodyweight",
        rpe: "5",
        notes: "Acostado boca abajo. Levantar brazos y piernas. Mantener 2s arriba.",
        primaryMuscles: ["lower_back", "glutes"],
        superset: "B",
      },
      {
        name: "Mountain Climbers",
        exerciseId: "mountain_climber",
        sets: 3,
        reps: "20/lado",
        rest: "30s",
        load: "Bodyweight",
        rpe: "7",
        notes: "Ritmo controlado. No dejar caer la cadera.",
        primaryMuscles: ["abs", "hip_flexors"],
        superset: "B",
      },
      {
        name: "Elevación Piernas Colgado",
        exerciseId: "hanging_leg_raise",
        sets: 2,
        reps: "10–12",
        rest: "45s",
        load: "Bodyweight",
        rpe: "7",
        notes: "Sin swing. Rodillas al pecho si recto es difícil.",
        primaryMuscles: ["abs", "hip_flexors"],
      },
    ],
  },
  {
    id: "sat",
    day: "Sábado",
    name: "Descanso / Fútbol Opcional",
    focus: "Recuperación activa",
    duration: "—",
    type: "optional",
    color: "#64748b",
    note: "Si hay fútbol, jugarlo. Si no, descansar o caminar 30 min.",
    exercises: [],
  },
  {
    id: "sun",
    day: "Domingo",
    name: "Descanso Total",
    focus: "Recuperación",
    duration: "—",
    type: "rest",
    color: "#64748b",
    note: "Descanso completo. Dormir bien, comer bien, preparar la semana.",
    exercises: [],
  },
];

// Get all targeted muscles for a workout day
export function getWorkoutMuscles(day: WorkoutDay): MuscleGroup[] {
  const muscles = new Set<MuscleGroup>();
  day.exercises.forEach((ex) => {
    ex.primaryMuscles.forEach((m) => muscles.add(m));
  });
  return Array.from(muscles);
}

// Get workout by id
export function getWorkoutById(id: string): WorkoutDay | undefined {
  return weeklyPlan.find((w) => w.id === id);
}

// Get today's workout
export function getTodayWorkout(): WorkoutDay | undefined {
  const dayMap: Record<number, string> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  const today = dayMap[new Date().getDay()];
  return weeklyPlan.find((w) => w.id === today);
}
