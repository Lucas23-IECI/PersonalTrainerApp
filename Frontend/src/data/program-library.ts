// =============================================
// Pre-built Program Library — 20 programs
// Users can browse, preview, and clone to routines
// =============================================

import type { MuscleGroup } from "./exercises";

export interface LibraryProgramExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: string;
  notes?: string;
  superset?: string;
  primaryMuscles: MuscleGroup[];
  isCompound: boolean;
}

export interface LibraryProgramDay {
  name: string;
  focus: string;
  type: "upper" | "lower" | "pull" | "push" | "full" | "football" | "rest" | "optional" | "legs" | "arms" | "chest" | "back" | "shoulders";
  exercises: LibraryProgramExercise[];
}

export interface LibraryProgram {
  id: string;
  name: string;
  description: string;
  category: "strength" | "hypertrophy" | "powerbuilding" | "bodyweight" | "beginner" | "sport" | "conditioning";
  level: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  split: string;
  duration: string; // e.g. "8-12 semanas"
  tags: string[];
  author?: string;
  days: LibraryProgramDay[];
}

// ── Helpers ──

function ex(
  name: string,
  sets: number,
  reps: string,
  rest: string,
  rpe: string,
  primaryMuscles: MuscleGroup[],
  isCompound: boolean,
  opts?: { notes?: string; superset?: string }
): LibraryProgramExercise {
  return { name, sets, reps, rest, rpe, primaryMuscles, isCompound, ...opts };
}

// =============================================
// 1. PPL (Push Pull Legs) — Clásico
// =============================================
const PPL_CLASSIC: LibraryProgram = {
  id: "ppl-classic",
  name: "Push Pull Legs Clásico",
  description: "Split de 6 días popular para hipertrofia. Cada grupo se entrena 2x/semana.",
  category: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 6,
  split: "Push / Pull / Legs × 2",
  duration: "8-12 semanas",
  tags: ["hipertrofia", "6 días", "alto volumen"],
  days: [
    {
      name: "Push A", focus: "Pecho, hombros, tríceps", type: "push",
      exercises: [
        ex("Press Banca", 4, "6-8", "180s", "8-9", ["chest", "front_delts", "triceps"], true),
        ex("Press Militar", 3, "8-10", "120s", "8", ["front_delts", "side_delts", "triceps"], true),
        ex("Aperturas Inclinado", 3, "10-12", "90s", "7-8", ["chest"], false),
        ex("Elevaciones Laterales", 4, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Fondos", 3, "8-12", "90s", "8", ["chest", "triceps"], true),
        ex("Extensión Tríceps Cuerda", 3, "12-15", "60s", "7-8", ["triceps"], false),
      ],
    },
    {
      name: "Pull A", focus: "Espalda, bíceps", type: "pull",
      exercises: [
        ex("Peso Muerto", 3, "5-6", "180s", "8-9", ["hamstrings", "lower_back", "glutes", "lats"], true),
        ex("Dominadas", 4, "6-10", "120s", "8", ["lats", "upper_back", "biceps"], true),
        ex("Remo con Barra", 4, "8-10", "120s", "8", ["upper_back", "lats", "biceps"], true),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts", "upper_back"], false),
        ex("Curl Barra", 3, "10-12", "60s", "7-8", ["biceps"], false),
        ex("Curl Martillo", 3, "10-12", "60s", "7-8", ["biceps", "forearms"], false),
      ],
    },
    {
      name: "Legs A", focus: "Cuádriceps, isquios, glúteos", type: "lower",
      exercises: [
        ex("Sentadilla", 4, "6-8", "180s", "8-9", ["quads", "glutes"], true),
        ex("Prensa", 3, "10-12", "120s", "8", ["quads", "glutes"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7-8", ["quads"], false),
        ex("Curl Femoral", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Hip Thrust", 3, "10-12", "90s", "8", ["glutes", "hamstrings"], true),
        ex("Elevación de Gemelos", 4, "15-20", "60s", "7-8", ["calves"], false),
      ],
    },
    {
      name: "Push B", focus: "Pecho, hombros, tríceps", type: "push",
      exercises: [
        ex("Press Inclinado Mancuernas", 4, "8-10", "120s", "8", ["chest", "front_delts"], true),
        ex("Press Militar Mancuernas", 3, "10-12", "90s", "7-8", ["front_delts", "side_delts"], true),
        ex("Aperturas Cable", 3, "12-15", "60s", "7-8", ["chest"], false),
        ex("Elevaciones Laterales Cable", 4, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Press Francés", 3, "10-12", "90s", "7-8", ["triceps"], false),
        ex("Pushdown Tríceps", 3, "12-15", "60s", "7-8", ["triceps"], false),
      ],
    },
    {
      name: "Pull B", focus: "Espalda, bíceps", type: "pull",
      exercises: [
        ex("Remo Mancuerna", 4, "8-10", "90s", "8", ["upper_back", "lats"], true),
        ex("Jalón al Pecho", 4, "10-12", "90s", "7-8", ["lats", "biceps"], true),
        ex("Remo Cable Sentado", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Pájaro Inverso", 3, "15-20", "60s", "7", ["rear_delts"], false),
        ex("Curl Inclinado", 3, "10-12", "60s", "7-8", ["biceps"], false),
        ex("Curl Concentrado", 2, "12-15", "60s", "7", ["biceps"], false),
      ],
    },
    {
      name: "Legs B", focus: "Isquios, glúteos, cuádriceps", type: "lower",
      exercises: [
        ex("RDL", 4, "8-10", "120s", "8", ["hamstrings", "glutes", "lower_back"], true),
        ex("Hack Squat", 3, "10-12", "120s", "8", ["quads"], true),
        ex("Zancadas", 3, "10-12", "90s", "7-8", ["quads", "glutes"], true),
        ex("Curl Femoral Acostado", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Abducción Cadera", 3, "12-15", "60s", "7", ["glutes"], false),
        ex("Elevación de Gemelos Sentado", 4, "15-20", "60s", "7-8", ["calves"], false),
      ],
    },
  ],
};

// =============================================
// 2. Upper/Lower 4 Días
// =============================================
const UPPER_LOWER_4: LibraryProgram = {
  id: "upper-lower-4",
  name: "Upper Lower 4 Días",
  description: "Split eficiente para intermedios. Frecuencia 2x por grupo con buen balance de volumen.",
  category: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 4,
  split: "Upper / Lower × 2",
  duration: "8-12 semanas",
  tags: ["hipertrofia", "4 días", "equilibrado"],
  days: [
    {
      name: "Upper A — Fuerza", focus: "Pecho, espalda, hombros", type: "upper",
      exercises: [
        ex("Press Banca", 4, "5-7", "180s", "8-9", ["chest", "front_delts", "triceps"], true),
        ex("Remo con Barra", 4, "6-8", "120s", "8-9", ["upper_back", "lats", "biceps"], true),
        ex("Press Militar", 3, "8-10", "120s", "8", ["front_delts", "side_delts"], true),
        ex("Jalón al Pecho", 3, "10-12", "90s", "7-8", ["lats", "biceps"], true),
        ex("Curl Barra", 2, "10-12", "60s", "7-8", ["biceps"], false),
        ex("Extensión Tríceps", 2, "10-12", "60s", "7-8", ["triceps"], false),
      ],
    },
    {
      name: "Lower A — Fuerza", focus: "Cuádriceps, isquios, core", type: "lower",
      exercises: [
        ex("Sentadilla", 4, "5-7", "180s", "8-9", ["quads", "glutes"], true),
        ex("RDL", 3, "8-10", "120s", "8", ["hamstrings", "glutes", "lower_back"], true),
        ex("Prensa", 3, "10-12", "120s", "7-8", ["quads", "glutes"], true),
        ex("Curl Femoral", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Elevación Gemelos", 4, "12-15", "60s", "7-8", ["calves"], false),
        ex("Plancha", 3, "30-45s", "60s", "7", ["abs"], false),
      ],
    },
    {
      name: "Upper B — Volumen", focus: "Pecho, espalda, brazos", type: "upper",
      exercises: [
        ex("Press Inclinado Mancuernas", 4, "8-10", "120s", "8", ["chest", "front_delts"], true),
        ex("Remo Mancuerna", 4, "8-10", "90s", "8", ["upper_back", "lats"], true),
        ex("Aperturas Cable", 3, "12-15", "60s", "7-8", ["chest"], false),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts", "upper_back"], false),
        ex("Elevaciones Laterales", 3, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Curl Martillo", 3, "10-12", "60s", "7-8", ["biceps", "forearms"], false),
        ex("Pushdown Tríceps", 3, "12-15", "60s", "7-8", ["triceps"], false),
      ],
    },
    {
      name: "Lower B — Volumen", focus: "Isquios, glúteos, core", type: "lower",
      exercises: [
        ex("Hip Thrust", 4, "8-10", "120s", "8", ["glutes", "hamstrings"], true),
        ex("Hack Squat", 3, "10-12", "120s", "8", ["quads"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7-8", ["quads"], false),
        ex("Curl Femoral Acostado", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Zancadas", 3, "10-12", "90s", "7-8", ["quads", "glutes"], true),
        ex("Crunch Cable", 3, "12-15", "60s", "7-8", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 3. Full Body 3 Días
// =============================================
const FULL_BODY_3: LibraryProgram = {
  id: "full-body-3",
  name: "Full Body 3 Días",
  description: "Ideal para principiantes o quienes entrenan poco. Cuerpo completo cada sesión.",
  category: "beginner",
  level: "beginner",
  daysPerWeek: 3,
  split: "Full Body × 3",
  duration: "8-12 semanas",
  tags: ["principiante", "3 días", "full body"],
  days: [
    {
      name: "Full Body A", focus: "Compuestos principales", type: "full",
      exercises: [
        ex("Sentadilla", 3, "8-10", "120s", "7-8", ["quads", "glutes"], true),
        ex("Press Banca", 3, "8-10", "120s", "7-8", ["chest", "front_delts", "triceps"], true),
        ex("Remo con Barra", 3, "8-10", "120s", "7-8", ["upper_back", "lats", "biceps"], true),
        ex("Press Militar", 2, "10-12", "90s", "7-8", ["front_delts", "side_delts"], true),
        ex("Curl Barra", 2, "10-12", "60s", "7", ["biceps"], false),
        ex("Plancha", 3, "30-45s", "60s", "7", ["abs"], false),
      ],
    },
    {
      name: "Full Body B", focus: "Posterior + empuje", type: "full",
      exercises: [
        ex("Peso Muerto", 3, "6-8", "150s", "8", ["hamstrings", "lower_back", "glutes"], true),
        ex("Press Inclinado Mancuernas", 3, "8-10", "120s", "7-8", ["chest", "front_delts"], true),
        ex("Dominadas", 3, "6-10", "120s", "7-8", ["lats", "upper_back", "biceps"], true),
        ex("Elevaciones Laterales", 3, "12-15", "60s", "7", ["side_delts"], false),
        ex("Fondos", 2, "8-12", "90s", "7-8", ["chest", "triceps"], true),
        ex("Elevación Gemelos", 3, "15-20", "60s", "7", ["calves"], false),
      ],
    },
    {
      name: "Full Body C", focus: "Variantes + accesorios", type: "full",
      exercises: [
        ex("Prensa", 3, "10-12", "120s", "7-8", ["quads", "glutes"], true),
        ex("Remo Mancuerna", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Aperturas Mancuernas", 3, "12-15", "60s", "7", ["chest"], false),
        ex("RDL", 3, "10-12", "120s", "7-8", ["hamstrings", "glutes"], true),
        ex("Press Arnold", 2, "10-12", "90s", "7-8", ["front_delts", "side_delts"], true),
        ex("Crunch", 3, "15-20", "60s", "7", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 4. PHUL (Power Hypertrophy Upper Lower)
// =============================================
const PHUL: LibraryProgram = {
  id: "phul",
  name: "PHUL",
  description: "Power Hypertrophy Upper Lower. Combina fuerza y volumen en 4 días.",
  category: "powerbuilding",
  level: "intermediate",
  daysPerWeek: 4,
  split: "Power Upper / Power Lower / Hyper Upper / Hyper Lower",
  duration: "10-12 semanas",
  tags: ["powerbuilding", "4 días", "fuerza + hiper"],
  days: [
    {
      name: "Power Upper", focus: "Fuerza tren superior", type: "upper",
      exercises: [
        ex("Press Banca", 4, "3-5", "180s", "9", ["chest", "front_delts", "triceps"], true),
        ex("Remo con Barra", 4, "3-5", "180s", "9", ["upper_back", "lats", "biceps"], true),
        ex("Press Militar", 3, "6-8", "120s", "8-9", ["front_delts", "side_delts"], true),
        ex("Dominadas Lastradas", 3, "6-8", "120s", "8-9", ["lats", "biceps"], true),
        ex("Curl Barra", 2, "8-10", "60s", "7-8", ["biceps"], false),
        ex("Press Francés", 2, "8-10", "60s", "7-8", ["triceps"], false),
      ],
    },
    {
      name: "Power Lower", focus: "Fuerza tren inferior", type: "lower",
      exercises: [
        ex("Sentadilla", 4, "3-5", "180s", "9", ["quads", "glutes"], true),
        ex("Peso Muerto", 3, "3-5", "180s", "9", ["hamstrings", "lower_back", "glutes"], true),
        ex("Prensa", 3, "8-10", "120s", "8", ["quads", "glutes"], true),
        ex("Curl Femoral", 3, "8-10", "60s", "7-8", ["hamstrings"], false),
        ex("Elevación Gemelos", 4, "10-12", "60s", "7-8", ["calves"], false),
      ],
    },
    {
      name: "Hypertrophy Upper", focus: "Volumen tren superior", type: "upper",
      exercises: [
        ex("Press Inclinado Mancuernas", 4, "8-12", "90s", "7-8", ["chest", "front_delts"], true),
        ex("Remo Cable Sentado", 4, "8-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Aperturas Cable", 3, "12-15", "60s", "7", ["chest"], false),
        ex("Elevaciones Laterales", 3, "12-15", "60s", "7", ["side_delts"], false),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts", "upper_back"], false),
        ex("Curl Inclinado", 3, "10-12", "60s", "7", ["biceps"], false),
        ex("Pushdown Tríceps", 3, "10-12", "60s", "7", ["triceps"], false),
      ],
    },
    {
      name: "Hypertrophy Lower", focus: "Volumen tren inferior", type: "lower",
      exercises: [
        ex("Sentadilla Frontal", 4, "8-12", "120s", "7-8", ["quads"], true),
        ex("RDL", 4, "8-12", "120s", "7-8", ["hamstrings", "glutes"], true),
        ex("Hack Squat", 3, "10-12", "90s", "7-8", ["quads"], true),
        ex("Hip Thrust", 3, "10-12", "90s", "7-8", ["glutes", "hamstrings"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7", ["quads"], false),
        ex("Elevación Gemelos Sentado", 4, "15-20", "60s", "7", ["calves"], false),
      ],
    },
  ],
};

// =============================================
// 5. Starting Strength (Principiante)
// =============================================
const STARTING_STRENGTH: LibraryProgram = {
  id: "starting-strength",
  name: "Starting Strength",
  description: "Programa clásico de fuerza para principiantes. Progresión lineal con compuestos.",
  category: "strength",
  level: "beginner",
  daysPerWeek: 3,
  split: "A/B alterno",
  duration: "12-16 semanas",
  tags: ["fuerza", "principiante", "3 días", "progresión lineal"],
  author: "Mark Rippetoe",
  days: [
    {
      name: "Workout A", focus: "Sentadilla, press, peso muerto", type: "full",
      exercises: [
        ex("Sentadilla", 3, "5", "180s", "8-9", ["quads", "glutes"], true),
        ex("Press Banca", 3, "5", "180s", "8-9", ["chest", "front_delts", "triceps"], true),
        ex("Peso Muerto", 1, "5", "180s", "9", ["hamstrings", "lower_back", "glutes", "lats"], true),
      ],
    },
    {
      name: "Workout B", focus: "Sentadilla, press militar, limpieza", type: "full",
      exercises: [
        ex("Sentadilla", 3, "5", "180s", "8-9", ["quads", "glutes"], true),
        ex("Press Militar", 3, "5", "180s", "8-9", ["front_delts", "side_delts", "triceps"], true),
        ex("Remo con Barra", 3, "5", "180s", "8-9", ["upper_back", "lats", "biceps"], true),
      ],
    },
  ],
};

// =============================================
// 6. Arnold Split (6 días)
// =============================================
const ARNOLD_SPLIT: LibraryProgram = {
  id: "arnold-split",
  name: "Arnold Split",
  description: "Split de alto volumen estilo Arnold. Pecho+Espalda, Hombros+Brazos, Piernas.",
  category: "hypertrophy",
  level: "advanced",
  daysPerWeek: 6,
  split: "Pecho+Espalda / Hombros+Brazos / Piernas × 2",
  duration: "8-10 semanas",
  tags: ["hipertrofia", "avanzado", "6 días", "alto volumen"],
  days: [
    {
      name: "Pecho + Espalda A", focus: "Pecho, espalda", type: "upper",
      exercises: [
        ex("Press Banca", 4, "8-10", "120s", "8", ["chest", "front_delts", "triceps"], true),
        ex("Dominadas", 4, "8-12", "120s", "8", ["lats", "upper_back", "biceps"], true),
        ex("Press Inclinado", 3, "10-12", "90s", "7-8", ["chest", "front_delts"], true),
        ex("Remo con Barra", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Aperturas Mancuernas", 3, "12-15", "60s", "7", ["chest"], false),
        ex("Jalón al Pecho Agarre Cerrado", 3, "12-15", "60s", "7", ["lats", "biceps"], false),
      ],
    },
    {
      name: "Hombros + Brazos A", focus: "Hombros, bíceps, tríceps", type: "upper",
      exercises: [
        ex("Press Militar", 4, "8-10", "120s", "8", ["front_delts", "side_delts"], true),
        ex("Elevaciones Laterales", 4, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Curl Barra", 3, "10-12", "60s", "7-8", ["biceps"], false),
        ex("Press Francés", 3, "10-12", "60s", "7-8", ["triceps"], false),
        ex("Curl Martillo", 3, "10-12", "60s", "7", ["biceps", "forearms"], false),
        ex("Pushdown Tríceps", 3, "12-15", "60s", "7", ["triceps"], false),
        ex("Encogimientos", 3, "12-15", "60s", "7", ["traps"], false),
      ],
    },
    {
      name: "Piernas A", focus: "Cuádriceps, isquios, gemelos", type: "lower",
      exercises: [
        ex("Sentadilla", 4, "8-10", "150s", "8-9", ["quads", "glutes"], true),
        ex("Prensa", 3, "10-12", "120s", "8", ["quads", "glutes"], true),
        ex("Curl Femoral", 4, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7", ["quads"], false),
        ex("Zancadas", 3, "10-12", "90s", "7-8", ["quads", "glutes"], true),
        ex("Elevación Gemelos de Pie", 4, "15-20", "60s", "7-8", ["calves"], false),
      ],
    },
    {
      name: "Pecho + Espalda B", focus: "Pecho, espalda", type: "upper",
      exercises: [
        ex("Press Inclinado Mancuernas", 4, "8-10", "120s", "8", ["chest", "front_delts"], true),
        ex("Remo Mancuerna", 4, "8-10", "90s", "8", ["upper_back", "lats"], true),
        ex("Aperturas Cable", 3, "12-15", "60s", "7", ["chest"], false),
        ex("Remo Cable Sentado", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Pullover", 3, "12-15", "60s", "7", ["lats", "chest"], false),
      ],
    },
    {
      name: "Hombros + Brazos B", focus: "Hombros, bíceps, tríceps", type: "upper",
      exercises: [
        ex("Press Arnold", 4, "8-10", "90s", "8", ["front_delts", "side_delts"], true),
        ex("Pájaro Inverso", 3, "12-15", "60s", "7", ["rear_delts"], false),
        ex("Curl Inclinado", 3, "10-12", "60s", "7-8", ["biceps"], false),
        ex("Dips", 3, "8-12", "90s", "7-8", ["triceps", "chest"], true),
        ex("Curl Concentrado", 2, "12-15", "60s", "7", ["biceps"], false),
        ex("Extensión Tríceps Overhead", 3, "10-12", "60s", "7-8", ["triceps"], false),
      ],
    },
    {
      name: "Piernas B", focus: "Isquios, glúteos, gemelos", type: "lower",
      exercises: [
        ex("RDL", 4, "8-10", "120s", "8", ["hamstrings", "glutes", "lower_back"], true),
        ex("Hack Squat", 3, "10-12", "120s", "8", ["quads"], true),
        ex("Hip Thrust", 3, "10-12", "90s", "8", ["glutes", "hamstrings"], true),
        ex("Zancadas Búlgaras", 3, "10-12", "90s", "7-8", ["quads", "glutes"], true),
        ex("Elevación Gemelos Sentado", 4, "15-20", "60s", "7-8", ["calves"], false),
        ex("Crunch Cable", 3, "15-20", "60s", "7", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 7. 5/3/1 (Wendler)
// =============================================
const WENDLER_531: LibraryProgram = {
  id: "wendler-531",
  name: "5/3/1 Wendler",
  description: "Programa de fuerza probado. 4 días con progresión mensual. Accesorios BBB.",
  category: "strength",
  level: "intermediate",
  daysPerWeek: 4,
  split: "Bench / Squat / OHP / Deadlift",
  duration: "Ciclos de 4 semanas",
  tags: ["fuerza", "4 días", "progresión lenta"],
  author: "Jim Wendler",
  days: [
    {
      name: "Bench Day", focus: "Press banca + accesorios", type: "push",
      exercises: [
        ex("Press Banca", 3, "5/3/1", "180s", "Varía", ["chest", "front_delts", "triceps"], true, { notes: "Semana 1: 5×65/75/85%. Semana 2: 3×70/80/90%. Semana 3: 5/3/1×75/85/95%." }),
        ex("Press Banca BBB", 5, "10", "90s", "7", ["chest", "front_delts", "triceps"], true, { notes: "50-60% de 1RM" }),
        ex("Remo Mancuerna", 4, "10-12", "60s", "7-8", ["upper_back", "lats"], true),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts", "upper_back"], false),
        ex("Curl Barra", 3, "10-12", "60s", "7", ["biceps"], false),
      ],
    },
    {
      name: "Squat Day", focus: "Sentadilla + accesorios", type: "lower",
      exercises: [
        ex("Sentadilla", 3, "5/3/1", "180s", "Varía", ["quads", "glutes"], true, { notes: "Progresión 5/3/1" }),
        ex("Sentadilla BBB", 5, "10", "120s", "7", ["quads", "glutes"], true, { notes: "50-60% de 1RM" }),
        ex("RDL", 3, "10-12", "90s", "7-8", ["hamstrings", "glutes"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7", ["quads"], false),
        ex("Elevación Gemelos", 4, "15-20", "60s", "7", ["calves"], false),
      ],
    },
    {
      name: "OHP Day", focus: "Press militar + accesorios", type: "push",
      exercises: [
        ex("Press Militar", 3, "5/3/1", "180s", "Varía", ["front_delts", "side_delts", "triceps"], true, { notes: "Progresión 5/3/1" }),
        ex("Press Militar BBB", 5, "10", "90s", "7", ["front_delts", "side_delts"], true, { notes: "50-60% de 1RM" }),
        ex("Dominadas", 4, "6-10", "120s", "7-8", ["lats", "biceps"], true),
        ex("Elevaciones Laterales", 3, "12-15", "60s", "7", ["side_delts"], false),
        ex("Pushdown Tríceps", 3, "10-12", "60s", "7", ["triceps"], false),
      ],
    },
    {
      name: "Deadlift Day", focus: "Peso muerto + accesorios", type: "lower",
      exercises: [
        ex("Peso Muerto", 3, "5/3/1", "180s", "Varía", ["hamstrings", "lower_back", "glutes", "lats"], true, { notes: "Progresión 5/3/1" }),
        ex("Peso Muerto BBB", 5, "10", "120s", "7", ["hamstrings", "lower_back", "glutes"], true, { notes: "50-60% de 1RM" }),
        ex("Prensa", 3, "10-12", "120s", "7-8", ["quads", "glutes"], true),
        ex("Curl Femoral", 3, "10-12", "60s", "7", ["hamstrings"], false),
        ex("Plancha", 3, "30-60s", "60s", "7", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 8. Bro Split 5 Días
// =============================================
const BRO_SPLIT: LibraryProgram = {
  id: "bro-split-5",
  name: "Bro Split 5 Días",
  description: "Split clásico de bodybuilding. Un grupo muscular por día, máximo volumen por sesión.",
  category: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 5,
  split: "Pecho / Espalda / Hombros / Piernas / Brazos",
  duration: "8-10 semanas",
  tags: ["hipertrofia", "5 días", "bodybuilding"],
  days: [
    {
      name: "Pecho", focus: "Pecho completo", type: "push",
      exercises: [
        ex("Press Banca", 4, "8-10", "120s", "8", ["chest", "front_delts", "triceps"], true),
        ex("Press Inclinado Mancuernas", 4, "8-10", "90s", "8", ["chest", "front_delts"], true),
        ex("Aperturas Cable", 3, "12-15", "60s", "7-8", ["chest"], false),
        ex("Aperturas Inclinado", 3, "12-15", "60s", "7", ["chest"], false),
        ex("Fondos", 3, "10-15", "90s", "7-8", ["chest", "triceps"], true),
      ],
    },
    {
      name: "Espalda", focus: "Espalda completa", type: "pull",
      exercises: [
        ex("Peso Muerto", 4, "6-8", "180s", "8-9", ["hamstrings", "lower_back", "glutes", "lats"], true),
        ex("Dominadas", 4, "6-10", "120s", "8", ["lats", "upper_back", "biceps"], true),
        ex("Remo con Barra", 4, "8-10", "120s", "8", ["upper_back", "lats"], true),
        ex("Jalón al Pecho", 3, "10-12", "90s", "7-8", ["lats", "biceps"], false),
        ex("Remo Cable Sentado", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], false),
      ],
    },
    {
      name: "Hombros", focus: "Deltoides completo", type: "shoulders",
      exercises: [
        ex("Press Militar", 4, "8-10", "120s", "8", ["front_delts", "side_delts"], true),
        ex("Elevaciones Laterales", 4, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts", "upper_back"], false),
        ex("Press Arnold", 3, "10-12", "90s", "7-8", ["front_delts", "side_delts"], true),
        ex("Pájaro Inverso", 3, "12-15", "60s", "7", ["rear_delts"], false),
        ex("Encogimientos", 3, "12-15", "60s", "7", ["traps"], false),
      ],
    },
    {
      name: "Piernas", focus: "Cuádriceps, isquios, glúteos", type: "lower",
      exercises: [
        ex("Sentadilla", 4, "8-10", "150s", "8-9", ["quads", "glutes"], true),
        ex("Prensa", 3, "10-12", "120s", "8", ["quads", "glutes"], true),
        ex("RDL", 3, "10-12", "120s", "8", ["hamstrings", "glutes"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7-8", ["quads"], false),
        ex("Curl Femoral", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Elevación Gemelos", 4, "15-20", "60s", "7-8", ["calves"], false),
      ],
    },
    {
      name: "Brazos", focus: "Bíceps, tríceps, antebrazos", type: "arms",
      exercises: [
        ex("Curl Barra", 4, "8-10", "60s", "8", ["biceps"], false),
        ex("Press Francés", 4, "8-10", "60s", "8", ["triceps"], false),
        ex("Curl Martillo", 3, "10-12", "60s", "7-8", ["biceps", "forearms"], false),
        ex("Pushdown Tríceps", 3, "10-12", "60s", "7-8", ["triceps"], false),
        ex("Curl Concentrado", 2, "12-15", "60s", "7", ["biceps"], false),
        ex("Extensión Tríceps Overhead", 2, "12-15", "60s", "7", ["triceps"], false),
        ex("Curl Muñeca", 2, "15-20", "45s", "7", ["forearms"], false),
      ],
    },
  ],
};

// =============================================
// 9. Calistenia Principiante
// =============================================
const CALISTENIA_BEGINNER: LibraryProgram = {
  id: "calistenia-beginner",
  name: "Calistenia Principiante",
  description: "Sin equipamiento. Progresión con peso corporal para empezar desde cero.",
  category: "bodyweight",
  level: "beginner",
  daysPerWeek: 3,
  split: "Full Body × 3",
  duration: "8-12 semanas",
  tags: ["calistenia", "sin equipo", "principiante"],
  days: [
    {
      name: "Día 1 — Push + Core", focus: "Empuje y core", type: "push",
      exercises: [
        ex("Flexiones", 3, "8-15", "90s", "7-8", ["chest", "front_delts", "triceps"], true),
        ex("Flexiones Diamante", 3, "6-10", "90s", "8", ["triceps", "chest"], true),
        ex("Dips en Silla", 3, "8-12", "60s", "7-8", ["triceps", "chest"], true),
        ex("Pike Push Ups", 3, "6-10", "90s", "8", ["front_delts", "triceps"], true),
        ex("Plancha", 3, "30-60s", "60s", "7", ["abs"], false),
        ex("Mountain Climbers", 3, "20-30", "60s", "7", ["abs", "hip_flexors"], false),
      ],
    },
    {
      name: "Día 2 — Pull + Piernas", focus: "Tirón y piernas", type: "pull",
      exercises: [
        ex("Remo Invertido", 3, "8-12", "90s", "7-8", ["upper_back", "lats", "biceps"], true),
        ex("Dominadas Asistidas", 3, "4-8", "120s", "8", ["lats", "biceps"], true),
        ex("Sentadilla Corporal", 3, "15-20", "60s", "7", ["quads", "glutes"], true),
        ex("Zancadas", 3, "10-12", "60s", "7-8", ["quads", "glutes"], true),
        ex("Puente Glúteo", 3, "15-20", "60s", "7", ["glutes", "hamstrings"], false),
        ex("Elevación Gemelos", 3, "15-20", "45s", "7", ["calves"], false),
      ],
    },
    {
      name: "Día 3 — Full + Core", focus: "Cuerpo completo", type: "full",
      exercises: [
        ex("Flexiones Inclinadas", 3, "10-15", "60s", "7", ["chest", "triceps"], true),
        ex("Dominadas Negativas", 3, "4-6", "120s", "8", ["lats", "biceps"], true),
        ex("Sentadilla Búlgara", 3, "8-10", "90s", "7-8", ["quads", "glutes"], true),
        ex("Dead Bug", 3, "10-12", "60s", "7", ["abs"], false),
        ex("Superman", 3, "12-15", "60s", "7", ["lower_back", "glutes"], false),
        ex("Burpees", 3, "8-12", "90s", "8", ["quads", "chest", "front_delts"], true),
      ],
    },
  ],
};

// =============================================
// 10. Calistenia Intermedio
// =============================================
const CALISTENIA_INTER: LibraryProgram = {
  id: "calistenia-inter",
  name: "Calistenia Intermedio",
  description: "Skills y progresiones avanzadas. Muscle ups, handstand, pistol squats.",
  category: "bodyweight",
  level: "intermediate",
  daysPerWeek: 4,
  split: "Push/Pull/Legs/Skills",
  duration: "8-12 semanas",
  tags: ["calistenia", "skills", "intermedio"],
  days: [
    {
      name: "Push", focus: "Empuje avanzado", type: "push",
      exercises: [
        ex("Flexiones Arquero", 3, "6-8", "120s", "8", ["chest", "front_delts", "triceps"], true),
        ex("Dips", 4, "8-12", "90s", "8", ["chest", "triceps"], true),
        ex("Pike Push Ups Elevados", 3, "6-8", "120s", "8", ["front_delts", "triceps"], true),
        ex("Flexiones Explosivas", 3, "6-10", "90s", "8", ["chest", "triceps"], true),
        ex("Plancha Lateral", 3, "20-30s", "60s", "7", ["obliques", "abs"], false),
      ],
    },
    {
      name: "Pull", focus: "Tirón avanzado", type: "pull",
      exercises: [
        ex("Dominadas", 4, "6-10", "120s", "8", ["lats", "upper_back", "biceps"], true),
        ex("Dominadas Agarre Cerrado", 3, "6-8", "120s", "8", ["lats", "biceps"], true),
        ex("Remo Invertido Elevado", 3, "8-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Curl de Bíceps (Remo Supino)", 3, "8-12", "60s", "7-8", ["biceps"], false),
        ex("Hang (Colgarse)", 3, "20-30s", "60s", "7", ["forearms", "lats"], false),
      ],
    },
    {
      name: "Legs", focus: "Piernas con peso corporal", type: "lower",
      exercises: [
        ex("Pistol Squat (Asistida)", 3, "4-6", "120s", "8-9", ["quads", "glutes"], true),
        ex("Sentadilla Búlgara", 3, "8-10", "90s", "8", ["quads", "glutes"], true),
        ex("Nordic Curl (Excéntrico)", 3, "3-5", "120s", "9", ["hamstrings"], true),
        ex("Step Up Explosivo", 3, "8-10", "90s", "7-8", ["quads", "glutes"], true),
        ex("Elevación Gemelos Una Pierna", 3, "12-15", "60s", "7-8", ["calves"], false),
        ex("Puente Glúteo Una Pierna", 3, "10-12", "60s", "7-8", ["glutes"], false),
      ],
    },
    {
      name: "Skills + Core", focus: "Habilidades y core", type: "full",
      exercises: [
        ex("Handstand Hold (Pared)", 5, "15-30s", "120s", "7-8", ["front_delts", "triceps", "abs"], true),
        ex("L-Sit Hold", 3, "10-20s", "90s", "8", ["abs", "hip_flexors"], false),
        ex("Muscle Up Negativas", 3, "3-5", "180s", "9", ["lats", "chest", "triceps"], true),
        ex("Dragon Flag (Excéntrica)", 3, "3-5", "120s", "9", ["abs"], false),
        ex("Hollow Body Hold", 3, "20-30s", "60s", "7", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 11. GZCLP (Principiante Fuerza)
// =============================================
const GZCLP: LibraryProgram = {
  id: "gzclp",
  name: "GZCLP",
  description: "Programa de fuerza para principiantes basado en el método GZCL. 3 tiers de trabajo.",
  category: "strength",
  level: "beginner",
  daysPerWeek: 4,
  split: "4 días rotativos",
  duration: "12-16 semanas",
  tags: ["fuerza", "principiante", "4 días", "GZCL"],
  author: "Cody Lefever",
  days: [
    {
      name: "Day 1 — Squat Focus", focus: "Sentadilla T1, Press T2", type: "full",
      exercises: [
        ex("Sentadilla", 5, "3", "180s", "9", ["quads", "glutes"], true, { notes: "T1: 5×3 al 85%" }),
        ex("Press Banca", 3, "10", "120s", "7-8", ["chest", "front_delts", "triceps"], true, { notes: "T2: 3×10" }),
        ex("Jalón al Pecho", 3, "15", "60s", "7", ["lats", "biceps"], false, { notes: "T3" }),
      ],
    },
    {
      name: "Day 2 — OHP Focus", focus: "Press militar T1, Peso muerto T2", type: "full",
      exercises: [
        ex("Press Militar", 5, "3", "180s", "9", ["front_delts", "side_delts", "triceps"], true, { notes: "T1: 5×3 al 85%" }),
        ex("Peso Muerto", 3, "10", "120s", "7-8", ["hamstrings", "lower_back", "glutes"], true, { notes: "T2: 3×10" }),
        ex("Remo Mancuerna", 3, "15", "60s", "7", ["upper_back", "lats"], false, { notes: "T3" }),
      ],
    },
    {
      name: "Day 3 — Bench Focus", focus: "Press banca T1, Sentadilla T2", type: "full",
      exercises: [
        ex("Press Banca", 5, "3", "180s", "9", ["chest", "front_delts", "triceps"], true, { notes: "T1: 5×3 al 85%" }),
        ex("Sentadilla", 3, "10", "120s", "7-8", ["quads", "glutes"], true, { notes: "T2: 3×10" }),
        ex("Face Pull", 3, "15", "60s", "7", ["rear_delts", "upper_back"], false, { notes: "T3" }),
      ],
    },
    {
      name: "Day 4 — Deadlift Focus", focus: "Peso muerto T1, Press militar T2", type: "full",
      exercises: [
        ex("Peso Muerto", 5, "3", "180s", "9", ["hamstrings", "lower_back", "glutes", "lats"], true, { notes: "T1: 5×3 al 85%" }),
        ex("Press Militar", 3, "10", "120s", "7-8", ["front_delts", "side_delts"], true, { notes: "T2: 3×10" }),
        ex("Curl Barra", 3, "15", "60s", "7", ["biceps"], false, { notes: "T3" }),
      ],
    },
  ],
};

// =============================================
// 12. nSuns 531 LP (5 días)
// =============================================
const NSUNS_5: LibraryProgram = {
  id: "nsuns-531-5day",
  name: "nSuns 5/3/1 LP (5 días)",
  description: "Progresión lineal agresiva basada en 5/3/1. Alto volumen de compuestos.",
  category: "powerbuilding",
  level: "intermediate",
  daysPerWeek: 5,
  split: "Bench / Squat / OHP / Deadlift / Bench Vol",
  duration: "Indefinido (LP)",
  tags: ["fuerza", "5 días", "alta frecuencia", "progresión lineal"],
  days: [
    {
      name: "Bench + OHP", focus: "Press banca principal", type: "push",
      exercises: [
        ex("Press Banca", 9, "Varía", "120s", "Varía", ["chest", "front_delts", "triceps"], true, { notes: "8 sets progresivos + 1 AMRAP" }),
        ex("Press Militar", 8, "Varía", "90s", "7-8", ["front_delts", "side_delts"], true),
        ex("Remo Mancuerna", 4, "8-10", "60s", "7-8", ["upper_back", "lats"], true),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts"], false),
      ],
    },
    {
      name: "Squat + Sumo DL", focus: "Sentadilla principal", type: "lower",
      exercises: [
        ex("Sentadilla", 9, "Varía", "120s", "Varía", ["quads", "glutes"], true, { notes: "8 sets progresivos + 1 AMRAP" }),
        ex("Peso Muerto Sumo", 8, "Varía", "120s", "7-8", ["hamstrings", "glutes", "quads"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7", ["quads"], false),
        ex("Curl Femoral", 3, "12-15", "60s", "7", ["hamstrings"], false),
      ],
    },
    {
      name: "OHP + Incline", focus: "Press militar principal", type: "push",
      exercises: [
        ex("Press Militar", 9, "Varía", "120s", "Varía", ["front_delts", "side_delts", "triceps"], true, { notes: "8 sets progresivos + 1 AMRAP" }),
        ex("Press Inclinado", 8, "Varía", "90s", "7-8", ["chest", "front_delts"], true),
        ex("Jalón al Pecho", 4, "8-10", "60s", "7-8", ["lats", "biceps"], true),
        ex("Elevaciones Laterales", 4, "12-15", "60s", "7", ["side_delts"], false),
      ],
    },
    {
      name: "Deadlift + Front Squat", focus: "Peso muerto principal", type: "lower",
      exercises: [
        ex("Peso Muerto", 9, "Varía", "150s", "Varía", ["hamstrings", "lower_back", "glutes"], true, { notes: "8 sets progresivos + 1 AMRAP" }),
        ex("Sentadilla Frontal", 8, "Varía", "120s", "7-8", ["quads"], true),
        ex("Hip Thrust", 3, "10-12", "90s", "7-8", ["glutes"], true),
        ex("Elevación Gemelos", 4, "15-20", "60s", "7", ["calves"], false),
      ],
    },
    {
      name: "Bench Volume + CG", focus: "Press banca volumen", type: "push",
      exercises: [
        ex("Press Banca", 9, "Varía", "90s", "7-8", ["chest", "front_delts", "triceps"], true, { notes: "Volúmen complementario" }),
        ex("Press Banca Agarre Cerrado", 8, "Varía", "90s", "7-8", ["triceps", "chest"], true),
        ex("Remo con Barra", 4, "8-10", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Curl Barra", 3, "10-12", "60s", "7", ["biceps"], false),
      ],
    },
  ],
};

// =============================================
// 13. Torso/Piernas 4 días
// =============================================
const TORSO_LEGS_4: LibraryProgram = {
  id: "torso-legs-4",
  name: "Torso / Piernas",
  description: "Variante de Upper/Lower con foco en volumen por sesión. Ideal post-principiante.",
  category: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 4,
  split: "Torso / Piernas × 2",
  duration: "8-12 semanas",
  tags: ["hipertrofia", "4 días", "post-principiante"],
  days: [
    {
      name: "Torso A", focus: "Empuje y tirón", type: "upper",
      exercises: [
        ex("Press Banca", 4, "8-10", "120s", "8", ["chest", "front_delts", "triceps"], true),
        ex("Remo con Barra", 4, "8-10", "120s", "8", ["upper_back", "lats", "biceps"], true),
        ex("Press Inclinado Mancuernas", 3, "10-12", "90s", "7-8", ["chest", "front_delts"], true),
        ex("Jalón al Pecho", 3, "10-12", "90s", "7-8", ["lats", "biceps"], true),
        ex("Elevaciones Laterales", 3, "12-15", "60s", "7", ["side_delts"], false),
        ex("Curl Barra", 2, "10-12", "60s", "7", ["biceps"], false),
        ex("Pushdown Tríceps", 2, "10-12", "60s", "7", ["triceps"], false),
      ],
    },
    {
      name: "Piernas A", focus: "Cuádriceps focus", type: "lower",
      exercises: [
        ex("Sentadilla", 4, "6-8", "180s", "8-9", ["quads", "glutes"], true),
        ex("Prensa", 3, "10-12", "120s", "8", ["quads", "glutes"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7-8", ["quads"], false),
        ex("Curl Femoral", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Elevación Gemelos", 4, "12-15", "60s", "7", ["calves"], false),
        ex("Crunch", 3, "15-20", "60s", "7", ["abs"], false),
      ],
    },
    {
      name: "Torso B", focus: "Volumen hiper", type: "upper",
      exercises: [
        ex("Dominadas", 4, "6-10", "120s", "8", ["lats", "upper_back", "biceps"], true),
        ex("Press Militar", 3, "8-10", "120s", "8", ["front_delts", "side_delts"], true),
        ex("Aperturas Cable", 3, "12-15", "60s", "7", ["chest"], false),
        ex("Remo Cable Sentado", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts", "upper_back"], false),
        ex("Curl Martillo", 2, "10-12", "60s", "7", ["biceps", "forearms"], false),
        ex("Fondos", 2, "10-15", "90s", "7-8", ["chest", "triceps"], true),
      ],
    },
    {
      name: "Piernas B", focus: "Posterior focus", type: "lower",
      exercises: [
        ex("RDL", 4, "8-10", "120s", "8", ["hamstrings", "glutes", "lower_back"], true),
        ex("Hack Squat", 3, "10-12", "120s", "8", ["quads"], true),
        ex("Hip Thrust", 3, "10-12", "90s", "8", ["glutes", "hamstrings"], true),
        ex("Zancadas", 3, "10-12", "90s", "7-8", ["quads", "glutes"], true),
        ex("Elevación Gemelos Sentado", 3, "15-20", "60s", "7", ["calves"], false),
        ex("Plancha", 3, "30-60s", "60s", "7", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 14. Stronglifts 5×5
// =============================================
const STRONGLIFTS_5X5: LibraryProgram = {
  id: "stronglifts-5x5",
  name: "StrongLifts 5×5",
  description: "El programa de fuerza más simple. 3 días, 3 ejercicios, 5×5. Progresión cada sesión.",
  category: "strength",
  level: "beginner",
  daysPerWeek: 3,
  split: "A/B alterno",
  duration: "12-20 semanas",
  tags: ["fuerza", "principiante", "3 días", "simple"],
  author: "Mehdi Hadim",
  days: [
    {
      name: "Workout A", focus: "Sentadilla, bench, remo", type: "full",
      exercises: [
        ex("Sentadilla", 5, "5", "180s", "8", ["quads", "glutes"], true),
        ex("Press Banca", 5, "5", "180s", "8", ["chest", "front_delts", "triceps"], true),
        ex("Remo con Barra", 5, "5", "180s", "8", ["upper_back", "lats", "biceps"], true),
      ],
    },
    {
      name: "Workout B", focus: "Sentadilla, OHP, peso muerto", type: "full",
      exercises: [
        ex("Sentadilla", 5, "5", "180s", "8", ["quads", "glutes"], true),
        ex("Press Militar", 5, "5", "180s", "8", ["front_delts", "side_delts", "triceps"], true),
        ex("Peso Muerto", 1, "5", "180s", "9", ["hamstrings", "lower_back", "glutes"], true),
      ],
    },
  ],
};

// =============================================
// 15. Programa Fútbol + Gym
// =============================================
const FUTBOL_GYM: LibraryProgram = {
  id: "futbol-gym",
  name: "Fútbol + Gym 3 Días",
  description: "Para los que juegan fútbol. Entrenos de gym compatibles con 2 partidos/semana.",
  category: "sport",
  level: "intermediate",
  daysPerWeek: 3,
  split: "Upper / Lower / Full (+ 2 fútbol)",
  duration: "Temporada",
  tags: ["fútbol", "deporte", "3 gym + 2 fútbol"],
  days: [
    {
      name: "Upper", focus: "Tren superior completo", type: "upper",
      exercises: [
        ex("Press Banca", 3, "8-10", "120s", "7-8", ["chest", "front_delts", "triceps"], true),
        ex("Dominadas", 3, "6-10", "120s", "7-8", ["lats", "upper_back", "biceps"], true),
        ex("Press Militar", 2, "10-12", "90s", "7-8", ["front_delts", "side_delts"], true),
        ex("Remo Mancuerna", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Face Pull", 2, "15-20", "60s", "7", ["rear_delts"], false),
        ex("Curl Barra", 2, "10-12", "60s", "7", ["biceps"], false),
      ],
    },
    {
      name: "Lower", focus: "Piernas (evitar pre-partido)", type: "lower",
      exercises: [
        ex("Sentadilla", 3, "6-8", "150s", "8", ["quads", "glutes"], true),
        ex("RDL", 3, "8-10", "120s", "7-8", ["hamstrings", "glutes"], true),
        ex("Prensa", 2, "10-12", "120s", "7-8", ["quads"], true),
        ex("Nordic Curl", 3, "4-6", "90s", "8", ["hamstrings"], true, { notes: "Prevención de lesiones" }),
        ex("Elevación Gemelos", 3, "12-15", "60s", "7", ["calves"], false),
        ex("Plancha", 3, "30-45s", "60s", "7", ["abs"], false),
      ],
    },
    {
      name: "Full (opcional)", focus: "Mantenimiento", type: "full",
      exercises: [
        ex("Press Inclinado Mancuernas", 3, "10-12", "90s", "7", ["chest", "front_delts"], true),
        ex("Jalón al Pecho", 3, "10-12", "90s", "7", ["lats", "biceps"], true),
        ex("Zancadas", 3, "10-12", "90s", "7", ["quads", "glutes"], true),
        ex("Elevaciones Laterales", 3, "12-15", "60s", "7", ["side_delts"], false),
        ex("Curl Femoral", 2, "12-15", "60s", "7", ["hamstrings"], false),
        ex("Crunch Cable", 2, "15-20", "60s", "7", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 16. Cutting (Déficit calórico)
// =============================================
const CUTTING_PROGRAM: LibraryProgram = {
  id: "cutting-deficit",
  name: "Cutting — Mantener Fuerza",
  description: "Programa para fase de déficit. Volumen reducido, intensidad alta para preservar músculo.",
  category: "conditioning",
  level: "intermediate",
  daysPerWeek: 4,
  split: "Upper / Lower × 2 (volumen reducido)",
  duration: "6-12 semanas",
  tags: ["cutting", "déficit", "preservar músculo"],
  days: [
    {
      name: "Upper Heavy", focus: "Fuerza tren superior", type: "upper",
      exercises: [
        ex("Press Banca", 3, "5-6", "180s", "8-9", ["chest", "front_delts", "triceps"], true),
        ex("Remo con Barra", 3, "5-6", "180s", "8-9", ["upper_back", "lats", "biceps"], true),
        ex("Press Militar", 2, "8-10", "120s", "8", ["front_delts", "side_delts"], true),
        ex("Jalón al Pecho", 2, "8-10", "90s", "7-8", ["lats", "biceps"], true),
        ex("Curl Barra", 2, "10-12", "60s", "7", ["biceps"], false),
      ],
    },
    {
      name: "Lower Heavy", focus: "Fuerza tren inferior", type: "lower",
      exercises: [
        ex("Sentadilla", 3, "5-6", "180s", "8-9", ["quads", "glutes"], true),
        ex("RDL", 3, "6-8", "150s", "8-9", ["hamstrings", "glutes"], true),
        ex("Prensa", 2, "10-12", "120s", "7-8", ["quads"], true),
        ex("Curl Femoral", 2, "10-12", "60s", "7", ["hamstrings"], false),
        ex("Elevación Gemelos", 3, "12-15", "60s", "7", ["calves"], false),
      ],
    },
    {
      name: "Upper Volume", focus: "Volumen moderado", type: "upper",
      exercises: [
        ex("Press Inclinado Mancuernas", 3, "8-10", "90s", "7-8", ["chest", "front_delts"], true),
        ex("Remo Mancuerna", 3, "8-10", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Aperturas Cable", 2, "12-15", "60s", "7", ["chest"], false),
        ex("Face Pull", 2, "15-20", "60s", "7", ["rear_delts"], false),
        ex("Elevaciones Laterales", 2, "12-15", "60s", "7", ["side_delts"], false),
      ],
    },
    {
      name: "Lower Volume", focus: "Volumen moderado", type: "lower",
      exercises: [
        ex("Hip Thrust", 3, "8-10", "90s", "7-8", ["glutes", "hamstrings"], true),
        ex("Hack Squat", 3, "10-12", "90s", "7-8", ["quads"], true),
        ex("Extensión Cuádriceps", 2, "12-15", "60s", "7", ["quads"], false),
        ex("Curl Femoral Acostado", 2, "10-12", "60s", "7", ["hamstrings"], false),
        ex("Plancha", 3, "30-60s", "60s", "7", ["abs"], false),
      ],
    },
  ],
};

// =============================================
// 17. PPL 3 días (frecuencia 1x)
// =============================================
const PPL_3DAY: LibraryProgram = {
  id: "ppl-3day",
  name: "Push Pull Legs 3 Días",
  description: "PPL con frecuencia 1x semanal. Buen volumen por sesión, ideal con poco tiempo.",
  category: "hypertrophy",
  level: "beginner",
  daysPerWeek: 3,
  split: "Push / Pull / Legs",
  duration: "8-12 semanas",
  tags: ["hipertrofia", "3 días", "PPL"],
  days: [
    {
      name: "Push", focus: "Pecho, hombros, tríceps", type: "push",
      exercises: [
        ex("Press Banca", 4, "6-8", "150s", "8-9", ["chest", "front_delts", "triceps"], true),
        ex("Press Inclinado Mancuernas", 3, "8-10", "120s", "8", ["chest", "front_delts"], true),
        ex("Press Militar", 3, "8-10", "120s", "8", ["front_delts", "side_delts"], true),
        ex("Elevaciones Laterales", 4, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Aperturas Cable", 3, "12-15", "60s", "7", ["chest"], false),
        ex("Press Francés", 3, "10-12", "60s", "7-8", ["triceps"], false),
        ex("Pushdown Tríceps", 3, "12-15", "60s", "7", ["triceps"], false),
      ],
    },
    {
      name: "Pull", focus: "Espalda, bíceps", type: "pull",
      exercises: [
        ex("Peso Muerto", 3, "5-6", "180s", "9", ["hamstrings", "lower_back", "glutes", "lats"], true),
        ex("Dominadas", 4, "6-10", "120s", "8", ["lats", "upper_back", "biceps"], true),
        ex("Remo con Barra", 4, "8-10", "120s", "8", ["upper_back", "lats"], true),
        ex("Jalón al Pecho", 3, "10-12", "90s", "7-8", ["lats", "biceps"], false),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts"], false),
        ex("Curl Barra", 3, "10-12", "60s", "7-8", ["biceps"], false),
        ex("Curl Martillo", 3, "10-12", "60s", "7", ["biceps", "forearms"], false),
      ],
    },
    {
      name: "Legs", focus: "Cuádriceps, isquios, glúteos", type: "lower",
      exercises: [
        ex("Sentadilla", 4, "6-8", "180s", "8-9", ["quads", "glutes"], true),
        ex("Prensa", 3, "10-12", "120s", "8", ["quads", "glutes"], true),
        ex("RDL", 3, "8-10", "120s", "8", ["hamstrings", "glutes"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7-8", ["quads"], false),
        ex("Curl Femoral", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Hip Thrust", 3, "10-12", "90s", "7-8", ["glutes"], true),
        ex("Elevación Gemelos", 4, "15-20", "60s", "7-8", ["calves"], false),
      ],
    },
  ],
};

// =============================================
// 18. Phat (Power Hypertrophy Adaptive Training)
// =============================================
const PHAT: LibraryProgram = {
  id: "phat",
  name: "PHAT",
  description: "5 días de Layne Norton. 2 power + 3 hypertrophy. Máxima estimulación.",
  category: "powerbuilding",
  level: "advanced",
  daysPerWeek: 5,
  split: "Power Upper / Power Lower / Hyper Back+Shoulders / Hyper Lower / Hyper Chest+Arms",
  duration: "10-12 semanas",
  tags: ["powerbuilding", "avanzado", "5 días"],
  author: "Layne Norton",
  days: [
    {
      name: "Power Upper", focus: "Fuerza tren superior", type: "upper",
      exercises: [
        ex("Remo con Barra", 3, "3-5", "180s", "9", ["upper_back", "lats", "biceps"], true),
        ex("Dominadas Lastradas", 2, "3-5", "180s", "9", ["lats", "biceps"], true),
        ex("Press Banca", 3, "3-5", "180s", "9", ["chest", "front_delts", "triceps"], true),
        ex("Press Militar", 2, "6-8", "120s", "8-9", ["front_delts", "side_delts"], true),
        ex("Curl Barra", 2, "6-8", "60s", "8", ["biceps"], false),
        ex("Press Francés", 2, "6-8", "60s", "8", ["triceps"], false),
      ],
    },
    {
      name: "Power Lower", focus: "Fuerza tren inferior", type: "lower",
      exercises: [
        ex("Sentadilla", 3, "3-5", "180s", "9", ["quads", "glutes"], true),
        ex("Hack Squat", 2, "6-8", "150s", "8-9", ["quads"], true),
        ex("Extensión Cuádriceps", 2, "6-8", "60s", "8", ["quads"], false),
        ex("RDL", 3, "5-8", "150s", "8-9", ["hamstrings", "glutes"], true),
        ex("Curl Femoral", 2, "6-8", "60s", "8", ["hamstrings"], false),
        ex("Elevación Gemelos", 3, "6-8", "90s", "8", ["calves"], false),
      ],
    },
    {
      name: "Hyper Espalda + Hombros", focus: "Volumen espalda y hombros", type: "pull",
      exercises: [
        ex("Remo Mancuerna", 3, "8-12", "60s", "7-8", ["upper_back", "lats"], true),
        ex("Remo Cable Sentado", 3, "8-12", "60s", "7-8", ["upper_back"], true),
        ex("Jalón al Pecho Agarre Cerrado", 2, "10-15", "60s", "7", ["lats", "biceps"], false),
        ex("Elevaciones Laterales", 3, "12-20", "45s", "7", ["side_delts"], false),
        ex("Face Pull", 2, "15-20", "45s", "7", ["rear_delts"], false),
      ],
    },
    {
      name: "Hyper Lower", focus: "Volumen piernas", type: "lower",
      exercises: [
        ex("Sentadilla Frontal", 3, "8-12", "120s", "7-8", ["quads"], true),
        ex("Prensa", 2, "12-15", "90s", "7-8", ["quads", "glutes"], true),
        ex("Extensión Cuádriceps", 2, "12-20", "60s", "7", ["quads"], false),
        ex("RDL Mancuernas", 3, "8-12", "90s", "7-8", ["hamstrings", "glutes"], true),
        ex("Curl Femoral", 2, "12-20", "60s", "7", ["hamstrings"], false),
        ex("Elevación Gemelos Sentado", 3, "12-20", "60s", "7", ["calves"], false),
      ],
    },
    {
      name: "Hyper Pecho + Brazos", focus: "Volumen pecho y brazos", type: "push",
      exercises: [
        ex("Press Inclinado Mancuernas", 3, "8-12", "90s", "7-8", ["chest", "front_delts"], true),
        ex("Aperturas Cable", 3, "12-15", "60s", "7", ["chest"], false),
        ex("Press Mancuernas Plano", 2, "12-15", "60s", "7", ["chest", "triceps"], true),
        ex("Curl Inclinado", 3, "8-12", "60s", "7-8", ["biceps"], false),
        ex("Curl Martillo", 2, "12-15", "60s", "7", ["biceps", "forearms"], false),
        ex("Pushdown Tríceps", 3, "8-12", "60s", "7-8", ["triceps"], false),
        ex("Extensión Tríceps Overhead", 2, "12-15", "60s", "7", ["triceps"], false),
      ],
    },
  ],
};

// =============================================
// 19. Minimalista 2 Días
// =============================================
const MINIMALIST_2: LibraryProgram = {
  id: "minimalist-2day",
  name: "Minimalista 2 Días",
  description: "Solo 2 días. Full body con compuestos esenciales. Para agenda apretada.",
  category: "beginner",
  level: "beginner",
  daysPerWeek: 2,
  split: "Full Body A / Full Body B",
  duration: "Indefinido",
  tags: ["minimalista", "2 días", "poco tiempo"],
  days: [
    {
      name: "Full Body A", focus: "Empuje + cuádriceps", type: "full",
      exercises: [
        ex("Sentadilla", 3, "6-8", "150s", "8", ["quads", "glutes"], true),
        ex("Press Banca", 3, "6-8", "150s", "8", ["chest", "front_delts", "triceps"], true),
        ex("Remo con Barra", 3, "8-10", "120s", "8", ["upper_back", "lats", "biceps"], true),
        ex("Elevaciones Laterales", 2, "12-15", "60s", "7", ["side_delts"], false),
        ex("Curl Barra", 2, "10-12", "60s", "7", ["biceps"], false),
        ex("Plancha", 3, "30-45s", "60s", "7", ["abs"], false),
      ],
    },
    {
      name: "Full Body B", focus: "Tirón + posterior", type: "full",
      exercises: [
        ex("Peso Muerto", 3, "5-6", "180s", "8-9", ["hamstrings", "lower_back", "glutes"], true),
        ex("Press Militar", 3, "6-8", "150s", "8", ["front_delts", "side_delts", "triceps"], true),
        ex("Dominadas", 3, "6-10", "120s", "8", ["lats", "upper_back", "biceps"], true),
        ex("Prensa", 2, "10-12", "120s", "7-8", ["quads", "glutes"], true),
        ex("Face Pull", 2, "15-20", "60s", "7", ["rear_delts"], false),
        ex("Elevación Gemelos", 3, "15-20", "60s", "7", ["calves"], false),
      ],
    },
  ],
};

// =============================================
// 20. Hipertrofia Científica (Jeff Nippard style)
// =============================================
const HYPERTROPHY_SCI: LibraryProgram = {
  id: "hypertrophy-science",
  name: "Hipertrofia Científica",
  description: "6 días basado en evidencia. Frecuencia 2x, volumen óptimo por grupo, variedad de estímulos.",
  category: "hypertrophy",
  level: "advanced",
  daysPerWeek: 6,
  split: "Push A / Pull A / Legs A / Push B / Pull B / Legs B",
  duration: "8-12 semanas",
  tags: ["hipertrofia", "avanzado", "6 días", "ciencia"],
  days: [
    {
      name: "Push A — Pecho", focus: "Pecho, hombros, tríceps", type: "push",
      exercises: [
        ex("Press Banca", 3, "6-8", "150s", "8-9", ["chest", "front_delts", "triceps"], true),
        ex("Press Inclinado Mancuernas", 3, "8-10", "120s", "8", ["chest", "front_delts"], true),
        ex("Aperturas Cable", 3, "10-12", "60s", "7-8", ["chest"], false),
        ex("Press Militar", 3, "8-10", "120s", "8", ["front_delts", "side_delts"], true),
        ex("Elevaciones Laterales", 4, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Pushdown Tríceps", 3, "10-12", "60s", "7-8", ["triceps"], false),
      ],
    },
    {
      name: "Pull A — Espalda Ancho", focus: "Lats, bíceps", type: "pull",
      exercises: [
        ex("Dominadas", 3, "6-8", "150s", "8-9", ["lats", "upper_back", "biceps"], true),
        ex("Jalón al Pecho", 3, "10-12", "90s", "7-8", ["lats", "biceps"], false),
        ex("Remo Cable Sentado", 3, "10-12", "90s", "7-8", ["upper_back", "lats"], true),
        ex("Face Pull", 3, "15-20", "60s", "7", ["rear_delts", "upper_back"], false),
        ex("Curl Barra", 3, "8-10", "60s", "7-8", ["biceps"], false),
        ex("Curl Martillo", 2, "10-12", "60s", "7", ["biceps", "forearms"], false),
      ],
    },
    {
      name: "Legs A — Quad Focus", focus: "Cuádriceps, glúteos", type: "lower",
      exercises: [
        ex("Sentadilla", 3, "6-8", "180s", "8-9", ["quads", "glutes"], true),
        ex("Prensa", 3, "10-12", "120s", "8", ["quads", "glutes"], true),
        ex("Extensión Cuádriceps", 3, "12-15", "60s", "7-8", ["quads"], false),
        ex("RDL", 3, "8-10", "120s", "8", ["hamstrings", "glutes"], true),
        ex("Curl Femoral", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Elevación Gemelos de Pie", 4, "10-12", "60s", "7-8", ["calves"], false),
      ],
    },
    {
      name: "Push B — Hombro", focus: "Hombros, pecho, tríceps", type: "push",
      exercises: [
        ex("Press Militar", 3, "6-8", "150s", "8-9", ["front_delts", "side_delts", "triceps"], true),
        ex("Press Inclinado", 3, "8-10", "120s", "8", ["chest", "front_delts"], true),
        ex("Elevaciones Laterales Cable", 4, "12-15", "60s", "7-8", ["side_delts"], false),
        ex("Aperturas Mancuernas", 3, "10-12", "60s", "7", ["chest"], false),
        ex("Press Francés", 3, "8-10", "60s", "7-8", ["triceps"], false),
        ex("Extensión Tríceps Overhead", 2, "10-12", "60s", "7", ["triceps"], false),
      ],
    },
    {
      name: "Pull B — Espalda Grosor", focus: "Upper back, bíceps", type: "pull",
      exercises: [
        ex("Remo con Barra", 3, "6-8", "150s", "8-9", ["upper_back", "lats", "biceps"], true),
        ex("Remo Mancuerna", 3, "8-10", "90s", "8", ["upper_back", "lats"], true),
        ex("Jalón al Pecho Agarre Cerrado", 3, "10-12", "90s", "7-8", ["lats", "biceps"], false),
        ex("Pájaro Inverso", 3, "12-15", "60s", "7", ["rear_delts"], false),
        ex("Curl Inclinado", 3, "8-10", "60s", "7-8", ["biceps"], false),
        ex("Curl Concentrado", 2, "12-15", "60s", "7", ["biceps"], false),
      ],
    },
    {
      name: "Legs B — Posterior", focus: "Isquios, glúteos", type: "lower",
      exercises: [
        ex("RDL", 3, "8-10", "150s", "8-9", ["hamstrings", "glutes", "lower_back"], true),
        ex("Hip Thrust", 3, "8-10", "120s", "8", ["glutes", "hamstrings"], true),
        ex("Hack Squat", 3, "10-12", "120s", "8", ["quads"], true),
        ex("Curl Femoral Acostado", 3, "10-12", "60s", "7-8", ["hamstrings"], false),
        ex("Zancadas Búlgaras", 3, "8-10", "90s", "7-8", ["quads", "glutes"], true),
        ex("Elevación Gemelos Sentado", 4, "12-15", "60s", "7-8", ["calves"], false),
      ],
    },
  ],
};

// =============================================
// Registry
// =============================================

export const PROGRAM_LIBRARY: LibraryProgram[] = [
  PPL_CLASSIC,
  UPPER_LOWER_4,
  FULL_BODY_3,
  PHUL,
  STARTING_STRENGTH,
  ARNOLD_SPLIT,
  WENDLER_531,
  BRO_SPLIT,
  CALISTENIA_BEGINNER,
  CALISTENIA_INTER,
  GZCLP,
  NSUNS_5,
  TORSO_LEGS_4,
  STRONGLIFTS_5X5,
  FUTBOL_GYM,
  CUTTING_PROGRAM,
  PPL_3DAY,
  PHAT,
  MINIMALIST_2,
  HYPERTROPHY_SCI,
];

export function getLibraryProgram(id: string): LibraryProgram | undefined {
  return PROGRAM_LIBRARY.find((p) => p.id === id);
}

export function getLibraryProgramsByCategory(category: LibraryProgram["category"]): LibraryProgram[] {
  return PROGRAM_LIBRARY.filter((p) => p.category === category);
}

export function getLibraryProgramsByLevel(level: LibraryProgram["level"]): LibraryProgram[] {
  return PROGRAM_LIBRARY.filter((p) => p.level === level);
}
