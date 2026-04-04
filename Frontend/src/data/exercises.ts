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

  // === MACHINE / CABLE — Gym exercises ===
  {
    id: "neutral_lat_pulldown",
    name: "Jalón Agarre Neutro",
    category: "cable",
    primaryMuscles: ["lats", "upper_back"],
    secondaryMuscles: ["biceps"],
    difficulty: "beginner",
  },
  {
    id: "lat_pulldown",
    name: "Jalón al Pecho",
    category: "cable",
    primaryMuscles: ["lats", "upper_back"],
    secondaryMuscles: ["biceps", "rear_delts"],
    difficulty: "beginner",
  },
  {
    id: "chest_fly",
    name: "Chest Fly (Cable/Máquina)",
    category: "cable",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts"],
    difficulty: "beginner",
  },
  {
    id: "cable_row",
    name: "Remo en Cable",
    category: "cable",
    primaryMuscles: ["upper_back", "lats"],
    secondaryMuscles: ["biceps", "rear_delts"],
    difficulty: "beginner",
  },
  {
    id: "seated_row",
    name: "Remo Sentado",
    category: "cable",
    primaryMuscles: ["upper_back", "lats"],
    secondaryMuscles: ["biceps", "rear_delts"],
    difficulty: "beginner",
  },
  {
    id: "overhead_cable_ext",
    name: "Extensión Tríceps en Cable (Overhead)",
    category: "cable",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "rope_pulldown",
    name: "Pulldown Cuerda Brazos Rectos",
    category: "cable",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["rear_delts", "triceps"],
    difficulty: "beginner",
  },
  {
    id: "cable_bicep_curl",
    name: "Curl Bíceps en Cable",
    category: "cable",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    difficulty: "beginner",
  },
  {
    id: "cable_lateral_raise",
    name: "Elevación Lateral en Cable",
    category: "cable",
    primaryMuscles: ["side_delts"],
    secondaryMuscles: ["traps"],
    difficulty: "beginner",
  },
  {
    id: "cable_rope_crunch",
    name: "Crunch en Polea con Cuerda",
    category: "cable",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["obliques"],
    difficulty: "beginner",
  },
  {
    id: "cross_cable_triceps",
    name: "Extensión Tríceps Cruzada en Cable",
    category: "cable",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "rear_delt_fly",
    name: "Vuelo Posterior (Deltoides)",
    category: "machine",
    primaryMuscles: ["rear_delts"],
    secondaryMuscles: ["upper_back", "traps"],
    difficulty: "beginner",
  },
  {
    id: "leg_press",
    name: "Prensa de Piernas",
    category: "machine",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings"],
    difficulty: "beginner",
  },
  {
    id: "single_leg_press",
    name: "Prensa Una Pierna",
    category: "machine",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings"],
    difficulty: "intermediate",
  },
  {
    id: "leg_extension",
    name: "Extensión de Cuádriceps",
    category: "machine",
    primaryMuscles: ["quads"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "leg_curl",
    name: "Curl de Isquiotibiales",
    category: "machine",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["calves"],
    difficulty: "beginner",
  },
  {
    id: "hack_squat",
    name: "Hack Squat",
    category: "machine",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings"],
    difficulty: "intermediate",
  },
  {
    id: "hack_calf_raise",
    name: "Elevación de Talones en Hack",
    category: "machine",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "seated_calf_raise",
    name: "Elevación de Talones Sentado",
    category: "machine",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "incline_db_press",
    name: "Press Inclinado Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["chest", "front_delts"],
    secondaryMuscles: ["triceps"],
    difficulty: "intermediate",
  },
  {
    id: "overhead_db_press",
    name: "Press Hombro Mancuernas (Overhead)",
    category: "dumbbell",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps"],
    difficulty: "intermediate",
  },
  {
    id: "preacher_curl",
    name: "Curl Predicador con Mancuerna",
    category: "dumbbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    difficulty: "beginner",
  },
  {
    id: "hammer_curl_x",
    name: "Curl Martillo Cruzado",
    category: "dumbbell",
    primaryMuscles: ["biceps", "forearms"],
    secondaryMuscles: [],
    difficulty: "beginner",
  },
  {
    id: "face_pull_db",
    name: "Face Pull con Mancuernas",
    category: "dumbbell",
    primaryMuscles: ["rear_delts"],
    secondaryMuscles: ["upper_back", "traps"],
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

  // ═══════════════════════════════════════
  // EXPANDED DATABASE (200+ exercises)
  // ═══════════════════════════════════════

  // === CHEST (expanded) ===
  { id: "decline_bench_press", name: "Press Declinado", category: "barbell", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front_delts"], difficulty: "intermediate" },
  { id: "close_grip_bench", name: "Press Agarre Cerrado", category: "barbell", primaryMuscles: ["triceps", "chest"], secondaryMuscles: ["front_delts"], difficulty: "intermediate" },
  { id: "machine_chest_press", name: "Press de Pecho (Máquina)", category: "machine", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front_delts"], difficulty: "beginner" },
  { id: "cable_crossover", name: "Cruce de Cables", category: "cable", primaryMuscles: ["chest"], secondaryMuscles: ["front_delts"], difficulty: "beginner" },
  { id: "incline_db_fly", name: "Aperturas Inclinadas", category: "dumbbell", primaryMuscles: ["chest", "front_delts"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "landmine_press_chest", name: "Landmine Press", category: "barbell", primaryMuscles: ["chest", "front_delts"], secondaryMuscles: ["triceps"], difficulty: "intermediate" },
  { id: "chest_dip", name: "Fondos para Pecho", category: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front_delts"], difficulty: "intermediate" },
  { id: "decline_db_press", name: "Press Declinado Mancuernas", category: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], difficulty: "intermediate" },
  { id: "smith_bench_press", name: "Press Banca Smith", category: "machine", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front_delts"], difficulty: "beginner" },
  { id: "pec_deck", name: "Pec Deck", category: "machine", primaryMuscles: ["chest"], secondaryMuscles: ["front_delts"], difficulty: "beginner" },

  // === SHOULDERS (expanded) ===
  { id: "arnold_press", name: "Arnold Press", category: "dumbbell", primaryMuscles: ["front_delts", "side_delts"], secondaryMuscles: ["triceps"], difficulty: "intermediate" },
  { id: "upright_row_bb", name: "Remo al Mentón", category: "barbell", primaryMuscles: ["side_delts", "traps"], secondaryMuscles: ["front_delts", "biceps"], difficulty: "intermediate" },
  { id: "cable_face_pull", name: "Face Pull (Cable)", category: "cable", primaryMuscles: ["rear_delts", "upper_back"], secondaryMuscles: ["traps"], difficulty: "beginner" },
  { id: "db_rear_delt_fly", name: "Vuelo Posterior Mancuernas", category: "dumbbell", primaryMuscles: ["rear_delts"], secondaryMuscles: ["upper_back", "traps"], difficulty: "beginner" },
  { id: "machine_shoulder_press", name: "Press Hombro (Máquina)", category: "machine", primaryMuscles: ["front_delts", "side_delts"], secondaryMuscles: ["triceps"], difficulty: "beginner" },
  { id: "behind_neck_press", name: "Press Tras Nuca", category: "barbell", primaryMuscles: ["side_delts", "front_delts"], secondaryMuscles: ["triceps", "traps"], difficulty: "advanced" },
  { id: "reverse_cable_fly", name: "Vuelo Posterior en Cable", category: "cable", primaryMuscles: ["rear_delts"], secondaryMuscles: ["upper_back"], difficulty: "beginner" },
  { id: "db_y_raise", name: "Elevación en Y", category: "dumbbell", primaryMuscles: ["side_delts", "rear_delts"], secondaryMuscles: ["traps"], difficulty: "beginner" },
  { id: "plate_front_raise", name: "Elevación Frontal con Disco", category: "barbell", primaryMuscles: ["front_delts"], secondaryMuscles: ["side_delts"], difficulty: "beginner" },
  { id: "landmine_press_shoulder", name: "Landmine Press Hombro", category: "barbell", primaryMuscles: ["front_delts"], secondaryMuscles: ["triceps", "chest"], difficulty: "intermediate" },

  // === TRICEPS (expanded) ===
  { id: "skull_crushers", name: "Rompecráneos (Skull Crushers)", category: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: [], difficulty: "intermediate" },
  { id: "cable_pushdown", name: "Press Tríceps en Cable", category: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "rope_pushdown", name: "Press Tríceps con Cuerda", category: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "bench_dips", name: "Fondos en Banco", category: "bodyweight", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front_delts"], difficulty: "beginner" },
  { id: "single_arm_pushdown", name: "Extensión Tríceps Un Brazo", category: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "close_grip_pushup", name: "Flexiones Agarre Cerrado", category: "bodyweight", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front_delts"], difficulty: "intermediate" },
  { id: "french_press", name: "Press Francés", category: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: [], difficulty: "intermediate" },
  { id: "dip_machine", name: "Fondos en Máquina", category: "machine", primaryMuscles: ["triceps"], secondaryMuscles: ["chest"], difficulty: "beginner" },

  // === BICEPS (expanded) ===
  { id: "concentration_curl", name: "Curl Concentrado", category: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "spider_curl", name: "Spider Curl", category: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: [], difficulty: "intermediate" },
  { id: "incline_db_curl", name: "Curl Inclinado", category: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "reverse_curl", name: "Curl Reverso", category: "barbell", primaryMuscles: ["forearms", "biceps"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "ez_bar_curl", name: "Curl Barra EZ", category: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"], difficulty: "beginner" },
  { id: "cable_hammer_curl", name: "Curl Martillo en Cable", category: "cable", primaryMuscles: ["biceps", "forearms"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "drag_curl", name: "Drag Curl", category: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: [], difficulty: "intermediate" },
  { id: "bayesian_curl", name: "Bayesian Curl", category: "cable", primaryMuscles: ["biceps"], secondaryMuscles: [], difficulty: "intermediate" },

  // === BACK (expanded) ===
  { id: "pendlay_row", name: "Pendlay Row", category: "barbell", primaryMuscles: ["upper_back", "lats"], secondaryMuscles: ["biceps", "lower_back"], difficulty: "advanced" },
  { id: "tbar_row", name: "T-Bar Row", category: "barbell", primaryMuscles: ["upper_back", "lats"], secondaryMuscles: ["biceps", "rear_delts"], difficulty: "intermediate" },
  { id: "single_arm_cable_row", name: "Remo Un Brazo (Cable)", category: "cable", primaryMuscles: ["lats", "upper_back"], secondaryMuscles: ["biceps"], difficulty: "beginner" },
  { id: "wide_lat_pulldown", name: "Jalón Abierto", category: "cable", primaryMuscles: ["lats"], secondaryMuscles: ["upper_back", "biceps"], difficulty: "beginner" },
  { id: "reverse_grip_row", name: "Remo Agarre Supino", category: "barbell", primaryMuscles: ["lats", "upper_back"], secondaryMuscles: ["biceps"], difficulty: "intermediate" },
  { id: "rack_pull", name: "Rack Pull", category: "barbell", primaryMuscles: ["upper_back", "traps", "lower_back"], secondaryMuscles: ["glutes", "hamstrings", "forearms"], difficulty: "advanced" },
  { id: "trap_bar_deadlift", name: "Peso Muerto Trap Bar", category: "barbell", primaryMuscles: ["quads", "glutes", "lower_back"], secondaryMuscles: ["hamstrings", "traps", "forearms"], difficulty: "intermediate" },
  { id: "cable_pullover", name: "Pullover en Cable", category: "cable", primaryMuscles: ["lats"], secondaryMuscles: ["chest", "triceps"], difficulty: "beginner" },
  { id: "hyperextension", name: "Hiperextensión", category: "bodyweight", primaryMuscles: ["lower_back", "glutes"], secondaryMuscles: ["hamstrings"], difficulty: "beginner" },
  { id: "reverse_hyper", name: "Hiperextensión Inversa", category: "bodyweight", primaryMuscles: ["glutes", "lower_back"], secondaryMuscles: ["hamstrings"], difficulty: "intermediate" },
  { id: "seal_row", name: "Seal Row", category: "barbell", primaryMuscles: ["upper_back", "lats"], secondaryMuscles: ["biceps", "rear_delts"], difficulty: "intermediate" },
  { id: "meadows_row", name: "Meadows Row", category: "barbell", primaryMuscles: ["lats", "upper_back"], secondaryMuscles: ["biceps", "rear_delts"], difficulty: "intermediate" },

  // === LEGS (expanded) ===
  { id: "front_squat", name: "Sentadilla Frontal", category: "barbell", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "abs", "upper_back"], difficulty: "advanced" },
  { id: "sumo_squat", name: "Sentadilla Sumo", category: "barbell", primaryMuscles: ["quads", "glutes", "adductors"], secondaryMuscles: ["hamstrings"], difficulty: "intermediate" },
  { id: "smith_squat", name: "Sentadilla Smith", category: "machine", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"], difficulty: "beginner" },
  { id: "hip_adductor", name: "Aductora (Máquina)", category: "machine", primaryMuscles: ["adductors"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "hip_abductor", name: "Abductora (Máquina)", category: "machine", primaryMuscles: ["glutes"], secondaryMuscles: ["hip_flexors"], difficulty: "beginner" },
  { id: "nordic_curl", name: "Nordic Curl", category: "bodyweight", primaryMuscles: ["hamstrings"], secondaryMuscles: ["glutes"], difficulty: "advanced" },
  { id: "barbell_hip_thrust", name: "Hip Thrust con Barra", category: "barbell", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], difficulty: "intermediate" },
  { id: "stiff_leg_deadlift", name: "Peso Muerto Piernas Rígidas", category: "barbell", primaryMuscles: ["hamstrings", "lower_back"], secondaryMuscles: ["glutes"], difficulty: "intermediate" },
  { id: "good_morning", name: "Good Morning", category: "barbell", primaryMuscles: ["hamstrings", "lower_back"], secondaryMuscles: ["glutes"], difficulty: "intermediate" },
  { id: "walking_lunge", name: "Zancadas Caminando", category: "bodyweight", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings", "calves"], difficulty: "beginner" },
  { id: "reverse_lunge", name: "Zancada Inversa", category: "bodyweight", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"], difficulty: "beginner" },
  { id: "lateral_lunge", name: "Zancada Lateral", category: "bodyweight", primaryMuscles: ["quads", "adductors"], secondaryMuscles: ["glutes"], difficulty: "beginner" },
  { id: "single_leg_hip_thrust", name: "Hip Thrust Una Pierna", category: "bodyweight", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], difficulty: "intermediate" },
  { id: "pistol_squat", name: "Pistol Squat", category: "bodyweight", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings", "calves"], difficulty: "advanced" },
  { id: "jump_squat", name: "Sentadilla con Salto", category: "bodyweight", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["calves"], difficulty: "intermediate" },
  { id: "db_step_up", name: "Step Up con Mancuernas", category: "dumbbell", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"], difficulty: "beginner" },
  { id: "pendulum_squat", name: "Pendulum Squat", category: "machine", primaryMuscles: ["quads"], secondaryMuscles: ["glutes"], difficulty: "intermediate" },
  { id: "belt_squat", name: "Belt Squat", category: "machine", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"], difficulty: "intermediate" },
  { id: "db_bulgarian_split", name: "Búlgara con Mancuernas", category: "dumbbell", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings"], difficulty: "intermediate" },
  { id: "glute_ham_raise", name: "Glute Ham Raise", category: "bodyweight", primaryMuscles: ["hamstrings", "glutes"], secondaryMuscles: ["lower_back"], difficulty: "advanced" },
  { id: "lying_leg_curl", name: "Curl Isquio Tumbado", category: "machine", primaryMuscles: ["hamstrings"], secondaryMuscles: ["calves"], difficulty: "beginner" },
  { id: "seated_leg_curl", name: "Curl Isquio Sentado", category: "machine", primaryMuscles: ["hamstrings"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "cable_kickback_glute", name: "Patada Glúteo en Cable", category: "cable", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], difficulty: "beginner" },
  { id: "smith_rdl", name: "RDL Smith", category: "machine", primaryMuscles: ["hamstrings", "glutes"], secondaryMuscles: ["lower_back"], difficulty: "beginner" },
  { id: "donkey_calf_raise", name: "Elevación Talones Donkey", category: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], difficulty: "beginner" },

  // === CORE (expanded) ===
  { id: "ab_wheel", name: "Rueda Abdominal", category: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques", "lower_back", "front_delts"], difficulty: "intermediate" },
  { id: "russian_twist", name: "Giro Ruso", category: "bodyweight", primaryMuscles: ["obliques", "abs"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "bicycle_crunch", name: "Crunch Bicicleta", category: "bodyweight", primaryMuscles: ["abs", "obliques"], secondaryMuscles: ["hip_flexors"], difficulty: "beginner" },
  { id: "hollow_hold", name: "Hollow Body Hold", category: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["hip_flexors"], difficulty: "intermediate" },
  { id: "v_up", name: "V-Up", category: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["hip_flexors"], difficulty: "intermediate" },
  { id: "dragon_flag", name: "Dragon Flag", category: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques", "lower_back"], difficulty: "advanced" },
  { id: "cable_woodchop", name: "Cable Woodchop", category: "cable", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], difficulty: "beginner" },
  { id: "pallof_press", name: "Pallof Press", category: "cable", primaryMuscles: ["abs", "obliques"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "decline_situp", name: "Sit-up Declinado", category: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["hip_flexors"], difficulty: "intermediate" },
  { id: "flutter_kicks", name: "Flutter Kicks", category: "bodyweight", primaryMuscles: ["abs", "hip_flexors"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "bird_dog", name: "Bird Dog", category: "bodyweight", primaryMuscles: ["lower_back", "abs"], secondaryMuscles: ["glutes"], difficulty: "beginner" },
  { id: "reverse_crunch", name: "Crunch Inverso", category: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], difficulty: "beginner" },
  { id: "landmine_rotation", name: "Rotación Landmine", category: "barbell", primaryMuscles: ["obliques", "abs"], secondaryMuscles: ["front_delts"], difficulty: "intermediate" },
  { id: "toe_touches", name: "Toque de Puntas", category: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "copenhagen_plank", name: "Plancha Copenhagen", category: "bodyweight", primaryMuscles: ["obliques", "adductors"], secondaryMuscles: ["abs"], difficulty: "advanced" },

  // === FOREARMS ===
  { id: "wrist_curl", name: "Curl de Muñeca", category: "dumbbell", primaryMuscles: ["forearms"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "reverse_wrist_curl", name: "Curl de Muñeca Reverso", category: "dumbbell", primaryMuscles: ["forearms"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "dead_hang", name: "Dead Hang", category: "bodyweight", primaryMuscles: ["forearms"], secondaryMuscles: ["lats", "upper_back"], difficulty: "beginner" },
  { id: "plate_pinch", name: "Pinch de Disco", category: "bodyweight", primaryMuscles: ["forearms"], secondaryMuscles: [], difficulty: "intermediate" },

  // === TRAPS ===
  { id: "barbell_shrug", name: "Encogimientos con Barra", category: "barbell", primaryMuscles: ["traps"], secondaryMuscles: ["upper_back"], difficulty: "beginner" },
  { id: "db_shrug", name: "Encogimientos con Mancuernas", category: "dumbbell", primaryMuscles: ["traps"], secondaryMuscles: ["upper_back"], difficulty: "beginner" },
  { id: "cable_shrug", name: "Encogimientos en Cable", category: "cable", primaryMuscles: ["traps"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "behind_back_shrug", name: "Encogimiento Tras Espalda", category: "barbell", primaryMuscles: ["traps"], secondaryMuscles: ["rear_delts"], difficulty: "intermediate" },
  { id: "farmer_carry", name: "Farmer's Carry", category: "dumbbell", primaryMuscles: ["traps", "forearms"], secondaryMuscles: ["abs", "obliques"], difficulty: "beginner" },

  // === CARDIO / CONDITIONING ===
  { id: "burpee", name: "Burpees", category: "cardio", primaryMuscles: ["quads", "chest", "abs"], secondaryMuscles: ["front_delts", "triceps", "glutes"], difficulty: "intermediate" },
  { id: "box_jump", name: "Box Jump", category: "cardio", primaryMuscles: ["quads", "glutes", "calves"], secondaryMuscles: [], difficulty: "intermediate" },
  { id: "jump_rope", name: "Salto de Cuerda", category: "cardio", primaryMuscles: ["calves"], secondaryMuscles: ["quads", "forearms"], difficulty: "beginner" },
  { id: "rowing_machine", name: "Máquina de Remo", category: "cardio", primaryMuscles: ["upper_back", "lats", "quads"], secondaryMuscles: ["biceps", "glutes"], difficulty: "beginner" },
  { id: "assault_bike", name: "Assault Bike", category: "cardio", primaryMuscles: ["quads", "hamstrings"], secondaryMuscles: ["front_delts", "biceps", "triceps"], difficulty: "intermediate" },
  { id: "stair_climber", name: "Escaladora", category: "cardio", primaryMuscles: ["quads", "glutes", "calves"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "treadmill_run", name: "Cinta de Correr", category: "cardio", primaryMuscles: ["quads", "hamstrings", "calves"], secondaryMuscles: ["glutes"], difficulty: "beginner" },
  { id: "sled_push", name: "Sled Push", category: "cardio", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings", "calves", "front_delts"], difficulty: "intermediate" },
  { id: "battle_ropes", name: "Battle Ropes", category: "cardio", primaryMuscles: ["front_delts", "abs"], secondaryMuscles: ["biceps", "forearms"], difficulty: "intermediate" },
  { id: "kettlebell_swing", name: "Kettlebell Swing", category: "cardio", primaryMuscles: ["glutes", "hamstrings"], secondaryMuscles: ["lower_back", "abs", "front_delts"], difficulty: "intermediate" },

  // === OLYMPIC / FULL-BODY ===
  { id: "power_clean", name: "Power Clean", category: "barbell", primaryMuscles: ["quads", "glutes", "traps"], secondaryMuscles: ["hamstrings", "upper_back", "forearms"], difficulty: "advanced" },
  { id: "hang_clean", name: "Hang Clean", category: "barbell", primaryMuscles: ["quads", "traps", "upper_back"], secondaryMuscles: ["glutes", "hamstrings", "forearms"], difficulty: "advanced" },
  { id: "push_press", name: "Push Press", category: "barbell", primaryMuscles: ["front_delts", "side_delts", "quads"], secondaryMuscles: ["triceps", "glutes"], difficulty: "intermediate" },
  { id: "thruster", name: "Thruster", category: "barbell", primaryMuscles: ["quads", "front_delts"], secondaryMuscles: ["glutes", "triceps", "abs"], difficulty: "intermediate" },
  { id: "clean_and_press", name: "Clean and Press", category: "barbell", primaryMuscles: ["quads", "front_delts", "traps"], secondaryMuscles: ["glutes", "upper_back", "triceps"], difficulty: "advanced" },
  { id: "snatch", name: "Snatch", category: "barbell", primaryMuscles: ["quads", "glutes", "traps"], secondaryMuscles: ["hamstrings", "front_delts", "upper_back"], difficulty: "advanced" },
  { id: "turkish_getup", name: "Turkish Get Up", category: "dumbbell", primaryMuscles: ["abs", "front_delts", "glutes"], secondaryMuscles: ["obliques", "quads", "triceps"], difficulty: "advanced" },
  { id: "man_maker", name: "Man Maker", category: "dumbbell", primaryMuscles: ["chest", "front_delts", "quads"], secondaryMuscles: ["triceps", "upper_back", "abs"], difficulty: "advanced" },

  // === MACHINE EXTRAS ===
  { id: "assisted_pullup", name: "Dominadas Asistidas", category: "machine", primaryMuscles: ["lats", "upper_back"], secondaryMuscles: ["biceps"], difficulty: "beginner" },
  { id: "assisted_dip", name: "Fondos Asistidos", category: "machine", primaryMuscles: ["triceps", "chest"], secondaryMuscles: ["front_delts"], difficulty: "beginner" },
  { id: "smith_incline_press", name: "Press Inclinado Smith", category: "machine", primaryMuscles: ["chest", "front_delts"], secondaryMuscles: ["triceps"], difficulty: "beginner" },
  { id: "cable_fly_low", name: "Cruce Cable Bajo", category: "cable", primaryMuscles: ["chest"], secondaryMuscles: ["front_delts"], difficulty: "beginner" },
  { id: "cable_fly_high", name: "Cruce Cable Alto", category: "cable", primaryMuscles: ["chest"], secondaryMuscles: ["front_delts"], difficulty: "beginner" },
  { id: "reverse_pec_deck", name: "Pec Deck Inverso", category: "machine", primaryMuscles: ["rear_delts"], secondaryMuscles: ["upper_back"], difficulty: "beginner" },
  { id: "pullover_machine", name: "Pullover (Máquina)", category: "machine", primaryMuscles: ["lats"], secondaryMuscles: ["chest", "triceps"], difficulty: "beginner" },
  { id: "cable_kickback_tri", name: "Kickback Tríceps Cable", category: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], difficulty: "beginner" },

  // === MISC / BODYWEIGHT ===
  { id: "pullover_db", name: "Pullover Mancuerna", category: "dumbbell", primaryMuscles: ["lats", "chest"], secondaryMuscles: ["triceps"], difficulty: "beginner" },
  { id: "zercher_squat", name: "Zercher Squat", category: "barbell", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["biceps", "abs", "upper_back"], difficulty: "advanced" },
  { id: "wide_pushup", name: "Flexiones Amplias", category: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["front_delts", "triceps"], difficulty: "beginner" },
  { id: "hindu_pushup", name: "Hindu Push Up", category: "bodyweight", primaryMuscles: ["chest", "front_delts"], secondaryMuscles: ["triceps", "hamstrings"], difficulty: "intermediate" },
  { id: "muscle_up", name: "Muscle Up", category: "bodyweight", primaryMuscles: ["lats", "chest", "triceps"], secondaryMuscles: ["biceps", "upper_back", "abs"], difficulty: "advanced" },
  { id: "glute_bridge", name: "Puente de Glúteos", category: "bodyweight", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], difficulty: "beginner" },
  { id: "seated_ohp", name: "Press Sentado con Barra", category: "barbell", primaryMuscles: ["front_delts", "side_delts"], secondaryMuscles: ["triceps"], difficulty: "intermediate" },
  { id: "deficit_pushup", name: "Flexiones con Déficit", category: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["front_delts", "triceps"], difficulty: "intermediate" },
  { id: "archer_pushup", name: "Flexiones Arquero", category: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front_delts"], difficulty: "advanced" },
  { id: "sumo_deadlift", name: "Peso Muerto Sumo", category: "barbell", primaryMuscles: ["glutes", "quads", "adductors"], secondaryMuscles: ["hamstrings", "lower_back", "traps"], difficulty: "intermediate" },
  { id: "barbell_calf_raise", name: "Elevación Talones con Barra", category: "barbell", primaryMuscles: ["calves"], secondaryMuscles: [], difficulty: "beginner" },
  { id: "db_lateral_lunge", name: "Zancada Lateral Mancuernas", category: "dumbbell", primaryMuscles: ["quads", "adductors"], secondaryMuscles: ["glutes"], difficulty: "intermediate" },
  { id: "single_leg_rdl", name: "RDL Una Pierna", category: "dumbbell", primaryMuscles: ["hamstrings", "glutes"], secondaryMuscles: ["lower_back"], difficulty: "intermediate" },
  { id: "db_pullover", name: "Pullover con Mancuerna", category: "dumbbell", primaryMuscles: ["lats", "chest"], secondaryMuscles: ["triceps"], difficulty: "beginner" },
  { id: "ez_skull_crusher", name: "Skull Crusher con EZ", category: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: [], difficulty: "intermediate" },
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
