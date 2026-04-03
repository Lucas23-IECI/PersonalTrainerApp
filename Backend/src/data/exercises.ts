// =============================================
// Exercise Library — Every exercise with muscle targeting
// Inspired by Hevy's exercise database
// =============================================

export type MuscleGroup =
  | "chest"
  | "front_delts"
  | "side_delts"
  | "rear_delts"
  | "triceps"
  | "biceps"
  | "forearms"
  | "upper_back"
  | "lats"
  | "lower_back"
  | "traps"
  | "abs"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "hip_flexors"
  | "adductors";

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Pecho",
  front_delts: "Deltoides Anterior",
  side_delts: "Deltoides Lateral",
  rear_delts: "Deltoides Posterior",
  triceps: "Tríceps",
  biceps: "Bíceps",
  forearms: "Antebrazos",
  upper_back: "Espalda Alta",
  lats: "Dorsales",
  lower_back: "Lumbar",
  traps: "Trapecios",
  abs: "Abdominales",
  obliques: "Oblicuos",
  quads: "Cuádriceps",
  hamstrings: "Isquiotibiales",
  glutes: "Glúteos",
  calves: "Pantorrillas",
  hip_flexors: "Flexores Cadera",
  adductors: "Aductores",
};

export type ExerciseCategory = "barbell" | "dumbbell" | "bodyweight" | "cable" | "machine" | "band" | "cardio";

export interface LibraryExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  instructions?: string;
  tips?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

// Full exercise library
export const exerciseLibrary: LibraryExercise[] = [
  // === CHEST ===
  {
    id: "bench_press",
    name: "Press Banca",
    category: "barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts", "triceps"],
    instructions: "Acostarse en banco, bajar barra al pecho, empujar.",
    difficulty: "intermediate",
  },
  {
    id: "incline_bench",
    name: "Press Inclinado",
    category: "barbell",
    primaryMuscles: ["chest", "front_delts"],
    secondaryMuscles: ["triceps"],
    difficulty: "intermediate",
  },
  {
    id: "db_bench",
    name: "Press Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts", "triceps"],
    difficulty: "beginner",
  },
  {
    id: "pushup",
    name: "Flexiones",
    category: "bodyweight",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts", "triceps", "abs"],
    difficulty: "beginner",
  },
  {
    id: "incline_pushup",
    name: "Flexiones Inclinadas",
    category: "bodyweight",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts", "triceps"],
    difficulty: "beginner",
  },
  {
    id: "decline_pushup",
    name: "Flexiones Declinadas",
    category: "bodyweight",
    primaryMuscles: ["chest", "front_delts"],
    secondaryMuscles: ["triceps", "abs"],
    difficulty: "intermediate",
  },
  {
    id: "db_fly",
    name: "Aperturas Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts"],
    difficulty: "beginner",
  },

  // === SHOULDERS ===
  {
    id: "ohp",
    name: "Press Militar",
    category: "barbell",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps", "upper_back"],
    difficulty: "intermediate",
  },
  {
    id: "db_shoulder_press",
    name: "Press Hombro Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps"],
    difficulty: "beginner",
  },
  {
    id: "lateral_raise",
    name: "Elevación Lateral",
    category: "dumbbell",
    primaryMuscles: ["side_delts"],
    secondaryMuscles: ["traps"],
    difficulty: "beginner",
  },
  {
    id: "front_raise",
    name: "Elevación Frontal",
    category: "dumbbell",
    primaryMuscles: ["front_delts"],
    secondaryMuscles: ["side_delts"],
    difficulty: "beginner",
  },
  {
    id: "pike_pushup",
    name: "Pike Push-up",
    category: "bodyweight",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps", "upper_back"],
    difficulty: "intermediate",
  },
  {
    id: "face_pull_band",
    name: "Face Pull (Banda)",
    category: "band",
    primaryMuscles: ["rear_delts"],
    secondaryMuscles: ["upper_back", "traps"],
    difficulty: "beginner",
  },

  // === TRICEPS ===
  {
    id: "dip",
    name: "Fondos",
    category: "bodyweight",
    primaryMuscles: ["triceps", "chest"],
    secondaryMuscles: ["front_delts"],
    difficulty: "intermediate",
  },
  {
    id: "diamond_pushup",
    name: "Flexiones Diamante",
    category: "bodyweight",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["chest", "front_delts"],
    difficulty: "intermediate",
  },
  {
    id: "overhead_ext",
    name: "Extensión Tríceps Overhead",
    category: "dumbbell",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "kickback",
    name: "Kickback Tríceps",
    category: "dumbbell",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },

  // === BACK ===
  {
    id: "pullup",
    name: "Dominadas",
    category: "bodyweight",
    primaryMuscles: ["lats", "upper_back"],
    secondaryMuscles: ["biceps", "forearms", "rear_delts"],
    difficulty: "intermediate",
  },
  {
    id: "chinup",
    name: "Chin-ups",
    category: "bodyweight",
    primaryMuscles: ["lats", "biceps"],
    secondaryMuscles: ["upper_back", "forearms"],
    difficulty: "intermediate",
  },
  {
    id: "inverted_row",
    name: "Remo Invertido",
    category: "bodyweight",
    primaryMuscles: ["upper_back", "lats"],
    secondaryMuscles: ["biceps", "rear_delts"],
    difficulty: "beginner",
  },
  {
    id: "barbell_row",
    name: "Remo con Barra",
    category: "barbell",
    primaryMuscles: ["upper_back", "lats"],
    secondaryMuscles: ["biceps", "lower_back", "rear_delts"],
    difficulty: "intermediate",
  },
  {
    id: "db_row",
    name: "Remo Mancuerna",
    category: "dumbbell",
    primaryMuscles: ["lats", "upper_back"],
    secondaryMuscles: ["biceps", "rear_delts"],
    difficulty: "beginner",
  },
  {
    id: "deadlift",
    name: "Peso Muerto",
    category: "barbell",
    primaryMuscles: ["hamstrings", "glutes", "lower_back"],
    secondaryMuscles: ["upper_back", "traps", "forearms", "quads"],
    difficulty: "advanced",
  },

  // === BICEPS ===
  {
    id: "barbell_curl",
    name: "Curl con Barra",
    category: "barbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    difficulty: "beginner",
  },
  {
    id: "db_curl",
    name: "Curl Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    difficulty: "beginner",
  },
  {
    id: "hammer_curl",
    name: "Curl Martillo",
    category: "dumbbell",
    primaryMuscles: ["biceps", "forearms"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },

  // === LEGS ===
  {
    id: "squat",
    name: "Sentadilla",
    category: "barbell",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings", "lower_back", "abs"],
    difficulty: "intermediate",
  },
  {
    id: "goblet_squat",
    name: "Goblet Squat",
    category: "dumbbell",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["abs"],
    difficulty: "beginner",
  },
  {
    id: "bw_squat",
    name: "Sentadilla Bodyweight",
    category: "bodyweight",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings"],
    difficulty: "beginner",
  },
  {
    id: "lunge",
    name: "Zancadas",
    category: "bodyweight",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings", "calves"],
    difficulty: "beginner",
  },
  {
    id: "db_lunge",
    name: "Zancadas con Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings", "calves"],
    difficulty: "beginner",
  },
  {
    id: "rdl",
    name: "RDL (Peso Muerto Rumano)",
    category: "barbell",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["lower_back"],
    difficulty: "intermediate",
  },
  {
    id: "db_rdl",
    name: "RDL Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["lower_back"],
    difficulty: "beginner",
  },
  {
    id: "hip_thrust",
    name: "Hip Thrust",
    category: "bodyweight",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    difficulty: "beginner",
  },
  {
    id: "calf_raise",
    name: "Elevación de Talones",
    category: "bodyweight",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "step_up",
    name: "Step Up",
    category: "bodyweight",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings", "calves"],
    difficulty: "beginner",
  },
  {
    id: "bulgarian_split",
    name: "Sentadilla Búlgara",
    category: "bodyweight",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings", "hip_flexors"],
    difficulty: "intermediate",
  },
  {
    id: "wall_sit",
    name: "Wall Sit",
    category: "bodyweight",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
    difficulty: "beginner",
  },

  // === CORE ===
  {
    id: "plank",
    name: "Plancha",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["obliques", "lower_back"],
    difficulty: "beginner",
  },
  {
    id: "side_plank",
    name: "Plancha Lateral",
    category: "bodyweight",
    primaryMuscles: ["obliques"],
    secondaryMuscles: ["abs"],
    difficulty: "beginner",
  },
  {
    id: "crunch",
    name: "Crunches",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "leg_raise",
    name: "Elevación de Piernas",
    category: "bodyweight",
    primaryMuscles: ["abs", "hip_flexors"],
    secondaryMuscles: ["obliques"],
    difficulty: "intermediate",
  },
  {
    id: "hanging_leg_raise",
    name: "Elevación Piernas Colgado",
    category: "bodyweight",
    primaryMuscles: ["abs", "hip_flexors"],
    secondaryMuscles: ["obliques", "forearms"],
    difficulty: "intermediate",
  },
  {
    id: "mountain_climber",
    name: "Mountain Climbers",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["hip_flexors", "quads", "front_delts"],
    difficulty: "beginner",
  },
  {
    id: "dead_bug",
    name: "Dead Bug",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["hip_flexors"],
    difficulty: "beginner",
  },
  {
    id: "superman",
    name: "Superman",
    category: "bodyweight",
    primaryMuscles: ["lower_back"],
    secondaryMuscles: ["glutes"],
    difficulty: "beginner",
  },
];

// Helper: find exercise by id
export function getExercise(id: string): LibraryExercise | undefined {
  return exerciseLibrary.find((e) => e.id === id);
}

// Helper: get all exercises for a muscle group
export function getExercisesForMuscle(muscle: MuscleGroup): LibraryExercise[] {
  return exerciseLibrary.filter(
    (e) => e.primaryMuscles.includes(muscle) || e.secondaryMuscles.includes(muscle)
  );
}

// Helper: get primary exercises for muscle
export function getPrimaryExercisesForMuscle(muscle: MuscleGroup): LibraryExercise[] {
  return exerciseLibrary.filter((e) => e.primaryMuscles.includes(muscle));
}

// All muscle groups organized by body region
export const MUSCLE_REGIONS = {
  upper_front: ["chest", "front_delts", "side_delts", "biceps", "abs"] as MuscleGroup[],
  upper_back: ["upper_back", "lats", "rear_delts", "traps", "lower_back"] as MuscleGroup[],
  arms: ["triceps", "biceps", "forearms"] as MuscleGroup[],
  legs: ["quads", "hamstrings", "glutes", "calves", "adductors", "hip_flexors"] as MuscleGroup[],
  core: ["abs", "obliques", "lower_back"] as MuscleGroup[],
};
