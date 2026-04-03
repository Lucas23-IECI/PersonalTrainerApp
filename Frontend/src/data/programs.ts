// =============================================
// Dynamic Program Definitions
// Each phase has a program with weekly schedule
// =============================================

import { MuscleGroup } from "./exercises";

export interface ProgramExercise {
  name: string;
  exerciseId?: string;
  sets: number;
  reps: string;
  rest: string;
  load: string;
  rpe: string;
  notes?: string;
  superset?: string;
  primaryMuscles: MuscleGroup[];
  isCompound: boolean;
}

export interface ProgramDay {
  id: string;
  dayOfWeek: number; // 0=dom, 1=lun ... 6=sab
  name: string;
  focus: string;
  duration: string;
  type: "upper" | "lower" | "pull" | "push" | "full" | "football" | "rest" | "optional";
  color: string;
  note?: string;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  phaseId: number;
  name: string;
  description: string;
  days: ProgramDay[];
}

// =============================================
// FASE 0 — Reactivación (casa, sin gym)
// Upper/Lower 3-4 días + Fútbol
// =============================================

const PHASE_0_PROGRAM: Program = {
  id: "phase0-reactivation",
  phaseId: 0,
  name: "Vuelta al Ruedo",
  description: "Reactivación liviana. Casa con mancuernas + barra. 3-4 días.",
  days: [
    {
      id: "p0-mon",
      dayOfWeek: 1,
      name: "Upper Body A — Push Focus",
      focus: "Pecho, hombros, tríceps",
      duration: "35–40 min",
      type: "upper",
      color: "#0A84FF",
      note: "Empezar liviano. Técnica y conexión mente-músculo.",
      exercises: [
        {
          name: "Press Mancuernas",
          exerciseId: "db_bench",
          sets: 3,
          reps: "10-12",
          rest: "60s",
          load: "10–12.5 kg/mano",
          rpe: "6-7",
          notes: "Acostado en banco/piso. Full ROM, tempo controlado.",
          primaryMuscles: ["chest", "front_delts", "triceps"],
          superset: "A",
          isCompound: true,
        },
        {
          name: "Elevación Lateral",
          exerciseId: "lateral_raise",
          sets: 3,
          reps: "15-20",
          rest: "30s",
          load: "5–7 kg",
          rpe: "7",
          notes: "Sin impulso, subir hasta paralelo.",
          primaryMuscles: ["side_delts"],
          superset: "A",
          isCompound: false,
        },
        {
          name: "Flexiones",
          exerciseId: "pushup",
          sets: 3,
          reps: "12-15",
          rest: "45s",
          load: "Bodyweight",
          rpe: "6",
          notes: "Full ROM. Si es fácil → pies elevados.",
          primaryMuscles: ["chest", "front_delts", "triceps"],
          superset: "B",
          isCompound: true,
        },
        {
          name: "Extensión Tríceps Overhead",
          exerciseId: "overhead_ext",
          sets: 3,
          reps: "12-15",
          rest: "45s",
          load: "8–10 kg",
          rpe: "7",
          notes: "Con mancuerna, dos manos. Codo fijo.",
          primaryMuscles: ["triceps"],
          superset: "B",
          isCompound: false,
        },
        {
          name: "Plancha",
          exerciseId: "plank",
          sets: 2,
          reps: "45s",
          rest: "30s",
          load: "Bodyweight",
          rpe: "6",
          primaryMuscles: ["abs", "obliques"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p0-tue",
      dayOfWeek: 2,
      name: "Lower Body A — Quad Focus",
      focus: "Cuádriceps, glúteos, core",
      duration: "35–40 min",
      type: "lower",
      color: "#f59e0b",
      note: "Piernas liviano. Mañana es fútbol → no reventar.",
      exercises: [
        {
          name: "Goblet Squat",
          exerciseId: "goblet_squat",
          sets: 3,
          reps: "12-15",
          rest: "60s",
          load: "12.5 kg",
          rpe: "6-7",
          notes: "DB al pecho. Bajar profundo.",
          primaryMuscles: ["quads", "glutes"],
          superset: "A",
          isCompound: true,
        },
        {
          name: "Elevación de Talones",
          exerciseId: "calf_raise",
          sets: 3,
          reps: "20/pierna",
          rest: "30s",
          load: "Bodyweight",
          rpe: "7",
          notes: "En escalón, una pierna. Full stretch.",
          primaryMuscles: ["calves"],
          superset: "A",
          isCompound: false,
        },
        {
          name: "Zancadas con Mancuernas",
          exerciseId: "db_lunge",
          sets: 3,
          reps: "10/pierna",
          rest: "60s",
          load: "8–10 kg/mano",
          rpe: "6-7",
          notes: "Paso largo, rodilla trasera casi toca piso.",
          primaryMuscles: ["quads", "glutes", "hamstrings"],
          superset: "B",
          isCompound: true,
        },
        {
          name: "RDL Mancuernas",
          exerciseId: "db_rdl",
          sets: 3,
          reps: "12-15",
          rest: "60s",
          load: "10–12.5 kg/mano",
          rpe: "6",
          notes: "Sentir estiramiento en isquios. Espalda neutra.",
          primaryMuscles: ["hamstrings", "glutes"],
          superset: "B",
          isCompound: true,
        },
        {
          name: "Dead Bug",
          exerciseId: "dead_bug",
          sets: 2,
          reps: "10/lado",
          rest: "30s",
          load: "Bodyweight",
          rpe: "5",
          primaryMuscles: ["abs"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p0-wed",
      dayOfWeek: 3,
      name: "Fútbol ⚽",
      focus: "Cardio, piernas, agilidad",
      duration: "90 min",
      type: "football",
      color: "#22c55e",
      note: "Partido a las 20hs. Movilidad antes, estiramientos después.",
      exercises: [
        {
          name: "Movilidad dinámica (pre)",
          sets: 1,
          reps: "5 min",
          rest: "—",
          load: "—",
          rpe: "3",
          primaryMuscles: ["hip_flexors", "quads", "hamstrings"],
          isCompound: false,
        },
        {
          name: "Fútbol",
          sets: 1,
          reps: "60-90 min",
          rest: "—",
          load: "—",
          rpe: "7-8",
          primaryMuscles: ["quads", "hamstrings", "calves", "glutes"],
          isCompound: false,
        },
        {
          name: "Estiramientos estáticos (post)",
          sets: 1,
          reps: "10 min",
          rest: "—",
          load: "—",
          rpe: "3",
          primaryMuscles: ["quads", "hamstrings", "calves", "hip_flexors"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p0-thu",
      dayOfWeek: 4,
      name: "Upper Body B — Pull Focus",
      focus: "Espalda, bíceps, trapecio",
      duration: "35–40 min",
      type: "upper",
      color: "#0A84FF",
      note: "Post fútbol. Predomina tirón.",
      exercises: [
        {
          name: "Dominadas",
          exerciseId: "pullup",
          sets: 3,
          reps: "AMRAP",
          rest: "90s",
          load: "Bodyweight",
          rpe: "7-8",
          notes: "Pronación. Bajar completo. Si <5 → negativas.",
          primaryMuscles: ["lats", "upper_back", "biceps"],
          superset: "A",
          isCompound: true,
        },
        {
          name: "Face Pull con Mancuernas",
          exerciseId: "face_pull_db",
          sets: 3,
          reps: "15-20",
          rest: "30s",
          load: "5 kg/mano",
          rpe: "6",
          primaryMuscles: ["rear_delts", "upper_back"],
          superset: "A",
          isCompound: false,
        },
        {
          name: "Remo Mancuerna",
          exerciseId: "db_row",
          sets: 3,
          reps: "10-12/lado",
          rest: "60s",
          load: "12.5 kg",
          rpe: "7",
          notes: "Tirar con codo, apretar escápula.",
          primaryMuscles: ["lats", "upper_back", "biceps"],
          superset: "B",
          isCompound: true,
        },
        {
          name: "Curl Martillo",
          exerciseId: "hammer_curl",
          sets: 3,
          reps: "12-15",
          rest: "45s",
          load: "8–10 kg",
          rpe: "7",
          notes: "Sin balanceo. Controlar bajada.",
          primaryMuscles: ["biceps", "forearms"],
          superset: "B",
          isCompound: false,
        },
        {
          name: "Plancha Lateral",
          exerciseId: "side_plank",
          sets: 2,
          reps: "30s/lado",
          rest: "30s",
          load: "Bodyweight",
          rpe: "6",
          primaryMuscles: ["obliques", "abs"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p0-fri",
      dayOfWeek: 5,
      name: "Lower Body B + Core",
      focus: "Isquios, glúteos, core",
      duration: "30–35 min",
      type: "lower",
      color: "#f59e0b",
      note: "Sesión corta. Foco en posterior y core.",
      exercises: [
        {
          name: "Hip Thrust",
          exerciseId: "hip_thrust",
          sets: 3,
          reps: "15-20",
          rest: "45s",
          load: "Bodyweight",
          rpe: "6-7",
          primaryMuscles: ["glutes", "hamstrings"],
          superset: "A",
          isCompound: true,
        },
        {
          name: "Sentadilla Búlgara",
          exerciseId: "bulgarian_split",
          sets: 3,
          reps: "10/pierna",
          rest: "60s",
          load: "BW o 5-8 kg/mano",
          rpe: "7",
          primaryMuscles: ["quads", "glutes", "hamstrings"],
          superset: "A",
          isCompound: true,
        },
        {
          name: "Superman",
          exerciseId: "superman",
          sets: 3,
          reps: "12-15",
          rest: "30s",
          load: "Bodyweight",
          rpe: "5",
          primaryMuscles: ["lower_back", "glutes"],
          superset: "B",
          isCompound: false,
        },
        {
          name: "Mountain Climbers",
          exerciseId: "mountain_climber",
          sets: 3,
          reps: "20/lado",
          rest: "30s",
          load: "Bodyweight",
          rpe: "7",
          primaryMuscles: ["abs", "hip_flexors"],
          superset: "B",
          isCompound: false,
        },
        {
          name: "Elevación Piernas Colgado",
          exerciseId: "hanging_leg_raise",
          sets: 2,
          reps: "10-12",
          rest: "45s",
          load: "Bodyweight",
          rpe: "7",
          primaryMuscles: ["abs", "hip_flexors"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p0-sat",
      dayOfWeek: 6,
      name: "Descanso / Fútbol Opcional",
      focus: "Recuperación activa",
      duration: "—",
      type: "optional",
      color: "#64748b",
      note: "Si hay fútbol, jugarlo. Si no, descansar.",
      exercises: [],
    },
    {
      id: "p0-sun",
      dayOfWeek: 0,
      name: "Descanso Total",
      focus: "Recuperación",
      duration: "—",
      type: "rest",
      color: "#64748b",
      note: "Descanso completo. Dormir bien, comer bien.",
      exercises: [],
    },
  ],
};

// =============================================
// FASE 1 — Acumulación I (Gym, Split 5 días)
// Del Excel confirmado del usuario
// =============================================

const PHASE_1_PROGRAM: Program = {
  id: "phase1-accumulation",
  phaseId: 1,
  name: "Acumulación I — Split 5 Días",
  description: "Gym completo. Upper/Lower1/Pull/Push/Lower2 + Fútbol.",
  days: [
    {
      id: "p1-mon",
      dayOfWeek: 1,
      name: "UPPER",
      focus: "Pecho, espalda, tríceps, pantorrillas, abs",
      duration: "55–65 min",
      type: "upper",
      color: "#0A84FF",
      note: "28 sets. Primer día fuerte de la semana.",
      exercises: [
        {
          name: "DB Bench Press",
          exerciseId: "db_bench",
          sets: 4,
          reps: "8-12",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Full ROM, controlar excéntrica.",
          primaryMuscles: ["chest", "front_delts", "triceps"],
          isCompound: true,
        },
        {
          name: "Neutral Grip Lat Pulldown",
          exerciseId: "neutral_lat_pulldown",
          sets: 5,
          reps: "8-12",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Agarre neutro. Tirar con codos, apretar dorsales abajo.",
          primaryMuscles: ["lats", "upper_back", "biceps"],
          isCompound: true,
        },
        {
          name: "Chest Fly (Cable/Máquina)",
          exerciseId: "chest_fly",
          sets: 4,
          reps: "10-15",
          rest: "60s",
          load: "—",
          rpe: "7-8",
          notes: "Stretch al abrir, squeeze al cerrar.",
          primaryMuscles: ["chest"],
          isCompound: false,
        },
        {
          name: "Cable Row",
          exerciseId: "cable_row",
          sets: 3,
          reps: "10-15",
          rest: "60s",
          load: "—",
          rpe: "7-8",
          notes: "Pecho alto, escápulas juntas al final.",
          primaryMuscles: ["upper_back", "lats"],
          isCompound: true,
        },
        {
          name: "Overhead Cable Extension",
          exerciseId: "overhead_cable_ext",
          sets: 4,
          reps: "8-12",
          rest: "60s",
          load: "—",
          rpe: "7-8",
          notes: "Codos fijos, stretch completo atrás.",
          primaryMuscles: ["triceps"],
          isCompound: false,
        },
        {
          name: "Hack Squat Calf Raise",
          exerciseId: "hack_calf_raise",
          sets: 5,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "8",
          notes: "Full ROM. Pausa 2s arriba.",
          primaryMuscles: ["calves"],
          isCompound: false,
        },
        {
          name: "Hanging Leg Raise",
          exerciseId: "hanging_leg_raise",
          sets: 3,
          reps: "10-20",
          rest: "45s",
          load: "Bodyweight",
          rpe: "7-8",
          notes: "Sin swing. Controlar bajada.",
          primaryMuscles: ["abs", "hip_flexors"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p1-tue",
      dayOfWeek: 2,
      name: "LOWER 1",
      focus: "Cuádriceps, isquios, bíceps, deltoides lat, abs",
      duration: "50–60 min",
      type: "lower",
      color: "#f59e0b",
      note: "24 sets. Mañana es fútbol → no destruir piernas.",
      exercises: [
        {
          name: "Romanian Deadlift",
          exerciseId: "rdl",
          sets: 3,
          reps: "10-12",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Con barra o mancuernas. Espalda neutra, sentir isquios.",
          primaryMuscles: ["hamstrings", "glutes", "lower_back"],
          isCompound: true,
        },
        {
          name: "Leg Press",
          exerciseId: "leg_press",
          sets: 4,
          reps: "8-12",
          rest: "120s",
          load: "—",
          rpe: "7-8",
          notes: "Pies a la altura de hombros. No bloquear rodillas.",
          primaryMuscles: ["quads", "glutes"],
          isCompound: true,
        },
        {
          name: "Leg Extension",
          exerciseId: "leg_extension",
          sets: 3,
          reps: "8-12",
          rest: "60s",
          load: "—",
          rpe: "8",
          notes: "Squeeze arriba, controlar bajada.",
          primaryMuscles: ["quads"],
          isCompound: false,
        },
        {
          name: "Hack Squat",
          exerciseId: "hack_squat",
          sets: 3,
          reps: "10-15",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Profundidad completa. Pies juntos = más quads.",
          primaryMuscles: ["quads", "glutes"],
          isCompound: true,
        },
        {
          name: "Cable Bicep Curl",
          exerciseId: "cable_bicep_curl",
          sets: 4,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Tensión constante. Sin balanceo.",
          primaryMuscles: ["biceps"],
          isCompound: false,
        },
        {
          name: "Cable Lateral Raise",
          exerciseId: "cable_lateral_raise",
          sets: 4,
          reps: "10-15",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Cross-body. Levantar hasta paralelo.",
          primaryMuscles: ["side_delts"],
          isCompound: false,
        },
        {
          name: "Cable Rope Crunch",
          exerciseId: "cable_rope_crunch",
          sets: 3,
          reps: "10-12",
          rest: "45s",
          load: "—",
          rpe: "8",
          notes: "Contraer abs, no tirar con brazos.",
          primaryMuscles: ["abs"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p1-wed",
      dayOfWeek: 3,
      name: "Fútbol ⚽",
      focus: "Cardio, piernas, agilidad",
      duration: "90 min",
      type: "football",
      color: "#22c55e",
      note: "Partido a las 20hs. Movilidad antes, estiramientos después.",
      exercises: [
        {
          name: "Movilidad dinámica (pre)",
          sets: 1,
          reps: "5 min",
          rest: "—",
          load: "—",
          rpe: "3",
          primaryMuscles: ["hip_flexors", "quads", "hamstrings"],
          isCompound: false,
        },
        {
          name: "Fútbol",
          sets: 1,
          reps: "60-90 min",
          rest: "—",
          load: "—",
          rpe: "7-8",
          primaryMuscles: ["quads", "hamstrings", "calves", "glutes"],
          isCompound: false,
        },
        {
          name: "Estiramientos estáticos (post)",
          sets: 1,
          reps: "10 min",
          rest: "—",
          load: "—",
          rpe: "3",
          primaryMuscles: ["quads", "hamstrings", "calves", "hip_flexors"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p1-thu",
      dayOfWeek: 4,
      name: "PULL",
      focus: "Dorsales, espalda, deltoides post/lat, pantorrillas, abs",
      duration: "50–60 min",
      type: "pull",
      color: "#8b5cf6",
      note: "23 sets. Post fútbol, si hay dolor reducir volumen.",
      exercises: [
        {
          name: "Lat Pulldown",
          exerciseId: "lat_pulldown",
          sets: 4,
          reps: "10-15",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Agarre ancho. Pecho alto, tirar con codos.",
          primaryMuscles: ["lats", "upper_back"],
          isCompound: true,
        },
        {
          name: "Seated Row",
          exerciseId: "seated_row",
          sets: 3,
          reps: "8-12",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Escápulas juntas al final. Sin impulso.",
          primaryMuscles: ["upper_back", "lats"],
          isCompound: true,
        },
        {
          name: "Rope Straight Arm Pulldown",
          exerciseId: "rope_pulldown",
          sets: 3,
          reps: "10-15",
          rest: "60s",
          load: "—",
          rpe: "7-8",
          notes: "Brazos casi rectos. Sentir dorsales.",
          primaryMuscles: ["lats"],
          isCompound: false,
        },
        {
          name: "Rear Delt Reverse Fly",
          exerciseId: "rear_delt_fly",
          sets: 4,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Máquina o mancuernas. Squeeze atrás.",
          primaryMuscles: ["rear_delts", "upper_back"],
          isCompound: false,
        },
        {
          name: "DB Lateral Raise",
          exerciseId: "lateral_raise",
          sets: 4,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Sin impulso, hasta paralelo.",
          primaryMuscles: ["side_delts"],
          isCompound: false,
        },
        {
          name: "Machine Seated Calf Raise",
          exerciseId: "seated_calf_raise",
          sets: 5,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "8",
          notes: "Full stretch abajo, pausa arriba.",
          primaryMuscles: ["calves"],
          isCompound: false,
        },
        {
          name: "Hanging Leg Raise",
          exerciseId: "hanging_leg_raise",
          sets: 3,
          reps: "10-20",
          rest: "45s",
          load: "Bodyweight",
          rpe: "7-8",
          notes: "Controlar. Sin swing.",
          primaryMuscles: ["abs", "hip_flexors"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p1-fri",
      dayOfWeek: 5,
      name: "PUSH",
      focus: "Pecho, deltoides ant, bíceps, tríceps",
      duration: "55–65 min",
      type: "push",
      color: "#ef4444",
      note: "27 sets. Último día fuerte de la semana.",
      exercises: [
        {
          name: "Incline DB Press",
          exerciseId: "incline_db_press",
          sets: 4,
          reps: "12-15",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "30° incline. Controlar bajada, pecho arriba.",
          primaryMuscles: ["chest", "front_delts", "triceps"],
          isCompound: true,
        },
        {
          name: "Overhead DB Press",
          exerciseId: "overhead_db_press",
          sets: 3,
          reps: "8-12",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Sentado o parado. Core apretado.",
          primaryMuscles: ["front_delts", "triceps"],
          isCompound: true,
        },
        {
          name: "Chest Fly (Cable/Máquina)",
          exerciseId: "chest_fly",
          sets: 4,
          reps: "10-15",
          rest: "60s",
          load: "—",
          rpe: "7-8",
          notes: "Stretch + squeeze.",
          primaryMuscles: ["chest"],
          isCompound: false,
        },
        {
          name: "Preacher Curl DB",
          exerciseId: "preacher_curl",
          sets: 4,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Brazo pegado al pad. Full stretch.",
          primaryMuscles: ["biceps"],
          isCompound: false,
        },
        {
          name: "Cross Cable Triceps Extension",
          exerciseId: "cross_cable_triceps",
          sets: 4,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Cruzar cables. Squeeze al final.",
          primaryMuscles: ["triceps"],
          isCompound: false,
        },
        {
          name: "Hammer Curl X",
          exerciseId: "hammer_curl_x",
          sets: 4,
          reps: "12-15",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Cross body. Controlar bajada.",
          primaryMuscles: ["biceps", "forearms"],
          isCompound: false,
        },
        {
          name: "Overhead Cable Extension",
          exerciseId: "overhead_cable_ext",
          sets: 4,
          reps: "12-15",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Stretch completo atrás.",
          primaryMuscles: ["triceps"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p1-sat",
      dayOfWeek: 6,
      name: "LOWER 2 (Opcional)",
      focus: "Cuádriceps, isquios, deltoides lat, pantorrillas, abs",
      duration: "45–55 min",
      type: "lower",
      color: "#f59e0b",
      note: "23 sets. Opcional — si el cuerpo responde bien.",
      exercises: [
        {
          name: "Single Leg Press",
          exerciseId: "single_leg_press",
          sets: 4,
          reps: "10-15",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Una pierna. Controlar bajada.",
          primaryMuscles: ["quads", "glutes"],
          isCompound: true,
        },
        {
          name: "Leg Curl",
          exerciseId: "leg_curl",
          sets: 3,
          reps: "8-12",
          rest: "60s",
          load: "—",
          rpe: "7-8",
          notes: "Squeeze arriba, stretch abajo.",
          primaryMuscles: ["hamstrings"],
          isCompound: false,
        },
        {
          name: "Leg Extension",
          exerciseId: "leg_extension",
          sets: 4,
          reps: "8-12",
          rest: "60s",
          load: "—",
          rpe: "8",
          notes: "Squeeze arriba.",
          primaryMuscles: ["quads"],
          isCompound: false,
        },
        {
          name: "Romanian Deadlift",
          exerciseId: "rdl",
          sets: 3,
          reps: "10-15",
          rest: "90s",
          load: "—",
          rpe: "7-8",
          notes: "Espalda neutra. Sentir isquios.",
          primaryMuscles: ["hamstrings", "glutes", "lower_back"],
          isCompound: true,
        },
        {
          name: "DB Lateral Raise",
          exerciseId: "lateral_raise",
          sets: 3,
          reps: "10-15",
          rest: "45s",
          load: "—",
          rpe: "7-8",
          notes: "Sin impulso.",
          primaryMuscles: ["side_delts"],
          isCompound: false,
        },
        {
          name: "Hack Squat Calf Raise",
          exerciseId: "hack_calf_raise",
          sets: 3,
          reps: "8-12",
          rest: "45s",
          load: "—",
          rpe: "8",
          notes: "Full ROM.",
          primaryMuscles: ["calves"],
          isCompound: false,
        },
        {
          name: "Cable Rope Crunch",
          exerciseId: "cable_rope_crunch",
          sets: 3,
          reps: "10-12",
          rest: "45s",
          load: "—",
          rpe: "8",
          notes: "Contraer abs.",
          primaryMuscles: ["abs"],
          isCompound: false,
        },
      ],
    },
    {
      id: "p1-sun",
      dayOfWeek: 0,
      name: "Descanso Total",
      focus: "Recuperación",
      duration: "—",
      type: "rest",
      color: "#64748b",
      note: "Descanso completo.",
      exercises: [],
    },
  ],
};

// =============================================
// FASE 2 — Intensificación I (Gym, Split 5 días, más peso)
// Mismos ejercicios que Fase 1, reps más bajas, RPE más alto
// =============================================

function buildIntensificationProgram(
  id: string, phaseId: number, name: string, description: string,
  compoundReps: string, accessoryReps: string, rpe: string
): Program {
  // Clone Phase 1 and adjust parameters
  const base = structuredClone(PHASE_1_PROGRAM);
  base.id = id;
  base.phaseId = phaseId;
  base.name = name;
  base.description = description;
  base.days.forEach((day) => {
    day.exercises.forEach((ex) => {
      if (ex.isCompound) {
        ex.reps = compoundReps;
        ex.rpe = rpe;
      } else {
        ex.reps = accessoryReps;
        ex.rpe = rpe;
      }
    });
  });
  return base;
}

const PHASE_2_PROGRAM: Program = buildIntensificationProgram(
  "phase2-intensification1", 2, "Intensificación I",
  "Más peso, menos reps. Fuerza-hipertrofia. Split 5 días.",
  "6-10", "8-12", "8-9"
);

// =============================================
// FASE 3 — Deload + Realización (Reducido 3 días)
// =============================================

const PHASE_3_PROGRAM: Program = {
  id: "phase3-deload1",
  phaseId: 3,
  name: "Deload + Realización",
  description: "Recuperar y consolidar. 3 días reducidos. -40% volumen.",
  days: [
    {
      id: "p3-mon",
      dayOfWeek: 1,
      name: "UPPER (Deload)",
      focus: "Pecho, espalda, hombros (reducido)",
      duration: "30–35 min",
      type: "upper",
      color: "#0A84FF",
      note: "Solo 2 sets por ejercicio. No llegar al fallo.",
      exercises: [
        { name: "DB Bench Press", exerciseId: "db_bench", sets: 2, reps: "8-12", rest: "90s", load: "—", rpe: "5-6", primaryMuscles: ["chest", "front_delts", "triceps"], isCompound: true },
        { name: "Neutral Grip Lat Pulldown", exerciseId: "neutral_lat_pulldown", sets: 2, reps: "8-12", rest: "90s", load: "—", rpe: "5-6", primaryMuscles: ["lats", "upper_back", "biceps"], isCompound: true },
        { name: "Overhead DB Press", exerciseId: "overhead_db_press", sets: 2, reps: "8-12", rest: "60s", load: "—", rpe: "5-6", primaryMuscles: ["front_delts", "triceps"], isCompound: true },
        { name: "Cable Row", exerciseId: "cable_row", sets: 2, reps: "10-12", rest: "60s", load: "—", rpe: "5-6", primaryMuscles: ["upper_back", "lats"], isCompound: true },
        { name: "DB Lateral Raise", exerciseId: "lateral_raise", sets: 2, reps: "12-15", rest: "45s", load: "—", rpe: "5", primaryMuscles: ["side_delts"], isCompound: false },
      ],
    },
    {
      id: "p3-tue",
      dayOfWeek: 2,
      name: "LOWER (Deload)",
      focus: "Piernas reducido",
      duration: "25–30 min",
      type: "lower",
      color: "#f59e0b",
      note: "Liviano. Preparar para fútbol miércoles.",
      exercises: [
        { name: "Leg Press", exerciseId: "leg_press", sets: 2, reps: "10-12", rest: "90s", load: "—", rpe: "5-6", primaryMuscles: ["quads", "glutes"], isCompound: true },
        { name: "Romanian Deadlift", exerciseId: "rdl", sets: 2, reps: "10-12", rest: "90s", load: "—", rpe: "5-6", primaryMuscles: ["hamstrings", "glutes", "lower_back"], isCompound: true },
        { name: "Leg Extension", exerciseId: "leg_extension", sets: 2, reps: "10-12", rest: "60s", load: "—", rpe: "5", primaryMuscles: ["quads"], isCompound: false },
        { name: "Hack Squat Calf Raise", exerciseId: "hack_calf_raise", sets: 2, reps: "10-12", rest: "45s", load: "—", rpe: "5", primaryMuscles: ["calves"], isCompound: false },
      ],
    },
    {
      id: "p3-wed",
      dayOfWeek: 3,
      name: "Fútbol ⚽",
      focus: "Cardio, piernas, agilidad",
      duration: "90 min",
      type: "football",
      color: "#22c55e",
      note: "Partido a las 20hs.",
      exercises: [
        { name: "Movilidad dinámica (pre)", sets: 1, reps: "5 min", rest: "—", load: "—", rpe: "3", primaryMuscles: ["hip_flexors", "quads", "hamstrings"], isCompound: false },
        { name: "Fútbol", sets: 1, reps: "60-90 min", rest: "—", load: "—", rpe: "7-8", primaryMuscles: ["quads", "hamstrings", "calves", "glutes"], isCompound: false },
        { name: "Estiramientos estáticos (post)", sets: 1, reps: "10 min", rest: "—", load: "—", rpe: "3", primaryMuscles: ["quads", "hamstrings", "calves", "hip_flexors"], isCompound: false },
      ],
    },
    {
      id: "p3-thu",
      dayOfWeek: 4,
      name: "FULL BODY (Deload)",
      focus: "Test PRs opcionales",
      duration: "30–35 min",
      type: "full",
      color: "#8b5cf6",
      note: "Opcionalmente testear PRs esta semana.",
      exercises: [
        { name: "DB Bench Press", exerciseId: "db_bench", sets: 2, reps: "6-8", rest: "120s", load: "—", rpe: "6-7", primaryMuscles: ["chest", "front_delts", "triceps"], isCompound: true },
        { name: "Lat Pulldown", exerciseId: "lat_pulldown", sets: 2, reps: "8-10", rest: "90s", load: "—", rpe: "6", primaryMuscles: ["lats", "upper_back"], isCompound: true },
        { name: "Leg Press", exerciseId: "leg_press", sets: 2, reps: "8-10", rest: "90s", load: "—", rpe: "6", primaryMuscles: ["quads", "glutes"], isCompound: true },
        { name: "Hanging Leg Raise", exerciseId: "hanging_leg_raise", sets: 2, reps: "10-15", rest: "45s", load: "Bodyweight", rpe: "5", primaryMuscles: ["abs", "hip_flexors"], isCompound: false },
      ],
    },
    { id: "p3-fri", dayOfWeek: 5, name: "Descanso", focus: "Recuperación", duration: "—", type: "rest", color: "#64748b", note: "Descanso completo.", exercises: [] },
    { id: "p3-sat", dayOfWeek: 6, name: "Descanso / Mobilidad", focus: "Recuperación activa", duration: "—", type: "optional", color: "#64748b", note: "Estiramientos o descanso.", exercises: [] },
    { id: "p3-sun", dayOfWeek: 0, name: "Descanso Total", focus: "Recuperación", duration: "—", type: "rest", color: "#64748b", note: "Descanso completo.", exercises: [] },
  ],
};

// =============================================
// FASES 4-7 — Variaciones sobre la misma estructura
// =============================================

const PHASE_4_PROGRAM: Program = buildIntensificationProgram(
  "phase4-accumulation2", 4, "Acumulación II",
  "Segundo bloque de volumen. Ajustar según debilidades del primer bloque.",
  "8-12", "10-15", "7-8.5"
);

const PHASE_5_PROGRAM: Program = buildIntensificationProgram(
  "phase5-intensification2", 5, "Intensificación II",
  "Fase más intensa. Pesos serios, priorizar recuperación.",
  "4-8", "6-10", "8.5-9.5"
);

// Phase 6 = another deload, clone phase 3
const PHASE_6_PROGRAM: Program = (() => {
  const p = structuredClone(PHASE_3_PROGRAM);
  p.id = "phase6-deload2";
  p.phaseId = 6;
  p.name = "Deload + Realización II";
  p.description = "Recuperar del bloque pesado.";
  p.days.forEach((d) => { d.id = d.id.replace("p3-", "p6-"); });
  return p;
})();

// Phase 7 = peaking/maintenance with 4-day flexible split
const PHASE_7_PROGRAM: Program = {
  id: "phase7-peaking",
  phaseId: 7,
  name: "Peaking / Mantenimiento",
  description: "Mantener masa, optimizar composición para Brasil. 4 días flexible.",
  days: [
    {
      id: "p7-mon",
      dayOfWeek: 1,
      name: "UPPER PUSH",
      focus: "Pecho, hombros, tríceps",
      duration: "45–50 min",
      type: "push",
      color: "#ef4444",
      note: "Mantener fuerza sin acumular fatiga.",
      exercises: [
        { name: "DB Bench Press", exerciseId: "db_bench", sets: 3, reps: "6-10", rest: "90s", load: "—", rpe: "7-8", primaryMuscles: ["chest", "front_delts", "triceps"], isCompound: true },
        { name: "Incline DB Press", exerciseId: "incline_db_press", sets: 3, reps: "8-12", rest: "90s", load: "—", rpe: "7-8", primaryMuscles: ["chest", "front_delts", "triceps"], isCompound: true },
        { name: "Overhead DB Press", exerciseId: "overhead_db_press", sets: 3, reps: "8-12", rest: "90s", load: "—", rpe: "7-8", primaryMuscles: ["front_delts", "triceps"], isCompound: true },
        { name: "Chest Fly (Cable/Máquina)", exerciseId: "chest_fly", sets: 3, reps: "10-15", rest: "60s", load: "—", rpe: "7", primaryMuscles: ["chest"], isCompound: false },
        { name: "Cable Lateral Raise", exerciseId: "cable_lateral_raise", sets: 3, reps: "10-15", rest: "45s", load: "—", rpe: "7", primaryMuscles: ["side_delts"], isCompound: false },
        { name: "Overhead Cable Extension", exerciseId: "overhead_cable_ext", sets: 3, reps: "10-12", rest: "45s", load: "—", rpe: "7", primaryMuscles: ["triceps"], isCompound: false },
      ],
    },
    {
      id: "p7-tue",
      dayOfWeek: 2,
      name: "LOWER",
      focus: "Cuádriceps, isquios, glúteos",
      duration: "45–50 min",
      type: "lower",
      color: "#f59e0b",
      note: "Mantener piernas fuertes. No destruir pre-fútbol.",
      exercises: [
        { name: "Leg Press", exerciseId: "leg_press", sets: 3, reps: "8-12", rest: "120s", load: "—", rpe: "7-8", primaryMuscles: ["quads", "glutes"], isCompound: true },
        { name: "Romanian Deadlift", exerciseId: "rdl", sets: 3, reps: "8-12", rest: "90s", load: "—", rpe: "7-8", primaryMuscles: ["hamstrings", "glutes", "lower_back"], isCompound: true },
        { name: "Hack Squat", exerciseId: "hack_squat", sets: 3, reps: "10-12", rest: "90s", load: "—", rpe: "7", primaryMuscles: ["quads", "glutes"], isCompound: true },
        { name: "Leg Curl", exerciseId: "leg_curl", sets: 3, reps: "8-12", rest: "60s", load: "—", rpe: "7", primaryMuscles: ["hamstrings"], isCompound: false },
        { name: "Hack Squat Calf Raise", exerciseId: "hack_calf_raise", sets: 4, reps: "8-12", rest: "45s", load: "—", rpe: "7", primaryMuscles: ["calves"], isCompound: false },
        { name: "Hanging Leg Raise", exerciseId: "hanging_leg_raise", sets: 3, reps: "10-15", rest: "45s", load: "Bodyweight", rpe: "7", primaryMuscles: ["abs", "hip_flexors"], isCompound: false },
      ],
    },
    {
      id: "p7-wed",
      dayOfWeek: 3,
      name: "Fútbol ⚽",
      focus: "Cardio, piernas, agilidad",
      duration: "90 min",
      type: "football",
      color: "#22c55e",
      note: "Partido a las 20hs.",
      exercises: [
        { name: "Movilidad dinámica (pre)", sets: 1, reps: "5 min", rest: "—", load: "—", rpe: "3", primaryMuscles: ["hip_flexors", "quads", "hamstrings"], isCompound: false },
        { name: "Fútbol", sets: 1, reps: "60-90 min", rest: "—", load: "—", rpe: "7-8", primaryMuscles: ["quads", "hamstrings", "calves", "glutes"], isCompound: false },
        { name: "Estiramientos estáticos (post)", sets: 1, reps: "10 min", rest: "—", load: "—", rpe: "3", primaryMuscles: ["quads", "hamstrings", "calves", "hip_flexors"], isCompound: false },
      ],
    },
    {
      id: "p7-thu",
      dayOfWeek: 4,
      name: "UPPER PULL",
      focus: "Espalda, bíceps, deltoides posterior",
      duration: "45–50 min",
      type: "pull",
      color: "#8b5cf6",
      note: "Post fútbol. Espalda y bíceps.",
      exercises: [
        { name: "Lat Pulldown", exerciseId: "lat_pulldown", sets: 3, reps: "8-12", rest: "90s", load: "—", rpe: "7-8", primaryMuscles: ["lats", "upper_back"], isCompound: true },
        { name: "Seated Row", exerciseId: "seated_row", sets: 3, reps: "8-12", rest: "90s", load: "—", rpe: "7-8", primaryMuscles: ["upper_back", "lats"], isCompound: true },
        { name: "Rear Delt Reverse Fly", exerciseId: "rear_delt_fly", sets: 3, reps: "10-12", rest: "45s", load: "—", rpe: "7", primaryMuscles: ["rear_delts", "upper_back"], isCompound: false },
        { name: "Cable Bicep Curl", exerciseId: "cable_bicep_curl", sets: 3, reps: "8-12", rest: "45s", load: "—", rpe: "7", primaryMuscles: ["biceps"], isCompound: false },
        { name: "Hammer Curl X", exerciseId: "hammer_curl_x", sets: 3, reps: "10-12", rest: "45s", load: "—", rpe: "7", primaryMuscles: ["biceps", "forearms"], isCompound: false },
        { name: "DB Lateral Raise", exerciseId: "lateral_raise", sets: 3, reps: "10-15", rest: "45s", load: "—", rpe: "7", primaryMuscles: ["side_delts"], isCompound: false },
      ],
    },
    { id: "p7-fri", dayOfWeek: 5, name: "Descanso / Opcional", focus: "Recuperación", duration: "—", type: "optional", color: "#64748b", note: "Descanso o cardio liviano.", exercises: [] },
    { id: "p7-sat", dayOfWeek: 6, name: "Descanso", focus: "Recuperación", duration: "—", type: "rest", color: "#64748b", note: "Descanso.", exercises: [] },
    { id: "p7-sun", dayOfWeek: 0, name: "Descanso Total", focus: "Recuperación", duration: "—", type: "rest", color: "#64748b", note: "Descanso completo.", exercises: [] },
  ],
};

// =============================================
// Program Registry
// =============================================

const ALL_PROGRAMS: Program[] = [
  PHASE_0_PROGRAM, PHASE_1_PROGRAM,
  PHASE_2_PROGRAM, PHASE_3_PROGRAM,
  PHASE_4_PROGRAM, PHASE_5_PROGRAM,
  PHASE_6_PROGRAM, PHASE_7_PROGRAM,
];

/**
 * Get the program for a given phase ID.
 * Falls back to Phase 0 if not found.
 */
export function getProgramForPhase(phaseId: number): Program {
  // Check for user-customized program first
  if (typeof window !== "undefined") {
    try {
      const custom = localStorage.getItem("mark-pt-custom-program-" + phaseId);
      if (custom) return JSON.parse(custom);
    } catch { /* ignore parse errors */ }
  }

  return ALL_PROGRAMS.find((p) => p.phaseId === phaseId) || ALL_PROGRAMS[0];
}

/**
 * Get today's programmed workout based on current phase.
 */
export function getTodayProgramWorkout(phaseId: number): ProgramDay | undefined {
  const program = getProgramForPhase(phaseId);
  const todayDow = new Date().getDay();
  return program.days.find((d) => d.dayOfWeek === todayDow);
}

/**
 * Get a specific workout by ID within a phase.
 */
export function getProgramWorkoutById(phaseId: number, dayId: string): ProgramDay | undefined {
  const program = getProgramForPhase(phaseId);
  return program.days.find((d) => d.id === dayId);
}

/**
 * Save a customized version of a program.
 */
export function saveCustomProgram(program: Program) {
  localStorage.setItem("mark-pt-custom-program-" + program.phaseId, JSON.stringify(program));
}

/**
 * Reset a customized program back to default.
 */
export function resetCustomProgram(phaseId: number) {
  localStorage.removeItem("mark-pt-custom-program-" + phaseId);
}

/**
 * Get all muscles targeted in a workout day (for the radar).
 */
export function getProgramDayMuscles(day: ProgramDay): MuscleGroup[] {
  const muscles = new Set<MuscleGroup>();
  day.exercises.forEach((ex) => {
    ex.primaryMuscles.forEach((m) => muscles.add(m));
  });
  return Array.from(muscles);
}
