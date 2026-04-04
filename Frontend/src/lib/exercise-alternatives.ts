// =============================================
// Alternative Exercises (3.9)
// Suggest replacements based on shared muscles
// =============================================

import {
  exerciseLibrary,
  type LibraryExercise,
  type MuscleGroup,
} from "../data/exercises";
import { getCustomExercises, type CustomExercise } from "./custom-exercises";

/**
 * Hand-curated "best alternative" mapping for common exercises.
 * Falls back to muscle-based matching for any exercise not listed here.
 */
const CURATED_ALTERNATIVES: Record<string, string[]> = {
  // Chest
  bench_press: ["db_bench", "machine_chest_press", "smith_bench_press", "pushup"],
  db_bench: ["bench_press", "machine_chest_press", "pushup"],
  incline_bench: ["incline_db_press", "smith_incline_press", "landmine_press_chest"],
  pushup: ["db_bench", "bench_press", "machine_chest_press"],
  db_fly: ["cable_crossover", "chest_fly", "incline_db_fly", "pec_deck"],
  // Shoulders
  ohp: ["db_shoulder_press", "machine_shoulder_press", "seated_ohp", "push_press"],
  db_shoulder_press: ["ohp", "machine_shoulder_press", "arnold_press"],
  lateral_raise: ["cable_lateral_raise", "db_y_raise"],
  // Back
  pullup: ["lat_pulldown", "assisted_pullup", "chinup"],
  chinup: ["pullup", "lat_pulldown", "neutral_lat_pulldown"],
  barbell_row: ["db_row", "cable_row", "tbar_row", "seated_row", "pendlay_row"],
  db_row: ["barbell_row", "cable_row", "single_arm_cable_row"],
  lat_pulldown: ["pullup", "chinup", "wide_lat_pulldown", "neutral_lat_pulldown"],
  deadlift: ["trap_bar_deadlift", "rdl", "rack_pull", "sumo_deadlift"],
  // Legs
  squat: ["leg_press", "hack_squat", "goblet_squat", "smith_squat", "front_squat"],
  leg_press: ["squat", "hack_squat", "smith_squat"],
  rdl: ["db_rdl", "stiff_leg_deadlift", "good_morning", "smith_rdl"],
  hip_thrust: ["barbell_hip_thrust", "single_leg_hip_thrust", "glute_bridge"],
  lunge: ["db_lunge", "walking_lunge", "reverse_lunge", "bulgarian_split"],
  bulgarian_split: ["lunge", "db_bulgarian_split", "db_lunge"],
  leg_extension: ["bw_squat", "goblet_squat", "wall_sit"],
  leg_curl: ["lying_leg_curl", "seated_leg_curl", "nordic_curl"],
  // Arms
  barbell_curl: ["ez_bar_curl", "db_curl", "cable_bicep_curl"],
  db_curl: ["barbell_curl", "hammer_curl", "cable_bicep_curl", "concentration_curl"],
  dip: ["bench_dips", "dip_machine", "close_grip_bench", "diamond_pushup"],
  overhead_ext: ["skull_crushers", "rope_pushdown", "cable_pushdown", "french_press"],
  cable_pushdown: ["rope_pushdown", "overhead_cable_ext", "single_arm_pushdown"],
  // Core
  plank: ["dead_bug", "hollow_hold", "bird_dog"],
  crunch: ["cable_rope_crunch", "bicycle_crunch", "decline_situp", "reverse_crunch"],
  leg_raise: ["hanging_leg_raise", "v_up", "flutter_kicks"],
};

/**
 * Get alternative exercises for a given exercise.
 * 1. Check curated mapping first
 * 2. Fallback: find exercises sharing ≥1 primary muscle in the same or similar category
 */
export function getAlternatives(
  exerciseId: string,
  limit = 6
): (LibraryExercise | CustomExercise)[] {
  const source = exerciseLibrary.find((e) => e.id === exerciseId);
  if (!source) return [];

  // Curated alternatives
  const curatedIds = CURATED_ALTERNATIVES[exerciseId];
  if (curatedIds && curatedIds.length > 0) {
    const curated = curatedIds
      .map((id) => exerciseLibrary.find((e) => e.id === id))
      .filter((e): e is LibraryExercise => !!e);
    if (curated.length >= limit) return curated.slice(0, limit);
    // Fill remaining with muscle-based matches
    const curatedIdSet = new Set(curatedIds);
    const muscleBased = findByMuscle(source, limit - curated.length, curatedIdSet);
    return [...curated, ...muscleBased].slice(0, limit);
  }

  return findByMuscle(source, limit, new Set([exerciseId]));
}

function findByMuscle(
  source: LibraryExercise,
  limit: number,
  excludeIds: Set<string>
): (LibraryExercise | CustomExercise)[] {
  const allEx: (LibraryExercise | CustomExercise)[] = [
    ...exerciseLibrary,
    ...getCustomExercises(),
  ];

  // Score each exercise by muscle overlap
  const scored = allEx
    .filter((e) => e.id !== source.id && !excludeIds.has(e.id))
    .map((e) => {
      let score = 0;
      for (const m of source.primaryMuscles) {
        if (e.primaryMuscles.includes(m)) score += 3;
        if (e.secondaryMuscles?.includes(m)) score += 1;
      }
      // Bonus for same category
      if (e.category === source.category) score += 1;
      return { exercise: e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((x) => x.exercise);
}

/**
 * Find alternatives by exercise name (looks up id first, then falls back to muscle match).
 */
export function getAlternativesByName(
  exerciseName: string,
  limit = 6
): (LibraryExercise | CustomExercise)[] {
  const ex = exerciseLibrary.find((e) => e.name === exerciseName);
  if (ex) return getAlternatives(ex.id, limit);

  // Try custom exercises
  const custom = getCustomExercises().find((e) => e.name === exerciseName);
  if (custom) {
    return findByMuscle(
      { ...custom, secondaryMuscles: custom.secondaryMuscles || [] } as LibraryExercise,
      limit,
      new Set([custom.id])
    );
  }

  return [];
}
