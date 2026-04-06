// =============================================
// Warm-up Generator
// Muscle → activation drills, 5-8 exercises
// =============================================

import { type MuscleGroup } from "@/data/exercises";

export interface WarmupDrill {
  name: string;
  duration: string; // "30s" or "10 reps"
  muscles: MuscleGroup[];
  type: "mobility" | "activation" | "dynamic";
}

// ── Drill database ──

const DRILLS: WarmupDrill[] = [
  // Upper body mobility
  { name: "Arm Circles", duration: "30s", muscles: ["front_delts", "side_delts", "rear_delts"], type: "mobility" },
  { name: "Shoulder Dislocates (banda)", duration: "10 reps", muscles: ["front_delts", "rear_delts", "upper_back"], type: "mobility" },
  { name: "Cat-Cow", duration: "30s", muscles: ["lower_back", "abs"], type: "mobility" },
  { name: "Thoracic Rotations", duration: "8/lado", muscles: ["upper_back", "obliques"], type: "mobility" },
  { name: "Wrist Circles", duration: "20s", muscles: ["forearms"], type: "mobility" },
  { name: "Neck CARs", duration: "20s", muscles: ["traps"], type: "mobility" },

  // Lower body mobility
  { name: "Hip Circles", duration: "10/lado", muscles: ["hip_flexors", "glutes"], type: "mobility" },
  { name: "World's Greatest Stretch", duration: "5/lado", muscles: ["hip_flexors", "hamstrings", "upper_back", "glutes"], type: "mobility" },
  { name: "Deep Squat Hold", duration: "30s", muscles: ["quads", "glutes", "adductors", "hip_flexors"], type: "mobility" },
  { name: "Ankle Circles", duration: "15/lado", muscles: ["calves"], type: "mobility" },
  { name: "Leg Swings (frontal)", duration: "10/lado", muscles: ["hip_flexors", "hamstrings", "glutes"], type: "mobility" },
  { name: "Leg Swings (lateral)", duration: "10/lado", muscles: ["adductors", "glutes"], type: "mobility" },
  { name: "Cossack Squat", duration: "5/lado", muscles: ["adductors", "quads", "glutes"], type: "mobility" },

  // Activation drills
  { name: "Band Pull-Aparts", duration: "15 reps", muscles: ["rear_delts", "upper_back", "traps"], type: "activation" },
  { name: "Band Face Pulls", duration: "15 reps", muscles: ["rear_delts", "upper_back"], type: "activation" },
  { name: "Band External Rotation", duration: "10/lado", muscles: ["rear_delts", "side_delts"], type: "activation" },
  { name: "Band Dislocates", duration: "10 reps", muscles: ["front_delts", "rear_delts"], type: "activation" },
  { name: "Scapular Push-ups", duration: "10 reps", muscles: ["chest", "front_delts"], type: "activation" },
  { name: "Dead Hangs", duration: "20s", muscles: ["lats", "forearms", "upper_back"], type: "activation" },
  { name: "Glute Bridge", duration: "12 reps", muscles: ["glutes", "hamstrings"], type: "activation" },
  { name: "Banded Glute Bridge", duration: "12 reps", muscles: ["glutes", "hip_flexors"], type: "activation" },
  { name: "Clamshells", duration: "12/lado", muscles: ["glutes", "adductors"], type: "activation" },
  { name: "Bird Dogs", duration: "8/lado", muscles: ["abs", "lower_back", "glutes"], type: "activation" },
  { name: "Dead Bugs", duration: "8/lado", muscles: ["abs", "hip_flexors"], type: "activation" },
  { name: "Side-lying Hip Abduction", duration: "12/lado", muscles: ["glutes", "adductors"], type: "activation" },
  { name: "Banded Lateral Walk", duration: "10/lado", muscles: ["glutes", "quads"], type: "activation" },
  { name: "Single-leg Glute Bridge", duration: "8/lado", muscles: ["glutes", "hamstrings"], type: "activation" },
  { name: "Wall Slides", duration: "10 reps", muscles: ["front_delts", "side_delts", "traps"], type: "activation" },

  // Dynamic stretches
  { name: "Inchworms", duration: "5 reps", muscles: ["hamstrings", "abs", "chest"], type: "dynamic" },
  { name: "High Knees", duration: "20s", muscles: ["hip_flexors", "quads", "calves"], type: "dynamic" },
  { name: "Butt Kicks", duration: "20s", muscles: ["hamstrings", "quads"], type: "dynamic" },
  { name: "Jumping Jacks", duration: "20s", muscles: ["front_delts", "calves", "quads"], type: "dynamic" },
  { name: "Bodyweight Squats", duration: "10 reps", muscles: ["quads", "glutes"], type: "dynamic" },
  { name: "Walking Lunges", duration: "5/lado", muscles: ["quads", "glutes", "hip_flexors"], type: "dynamic" },
  { name: "Push-ups (lentas)", duration: "8 reps", muscles: ["chest", "triceps", "front_delts"], type: "dynamic" },
  { name: "Spiderman Lunges", duration: "5/lado", muscles: ["hip_flexors", "adductors", "glutes"], type: "dynamic" },
];

/**
 * Generate a warmup routine for the given target muscles.
 * Returns 5-8 drills: mobility first, then activation, then dynamic.
 */
export function generateWarmup(targetMuscles: MuscleGroup[]): WarmupDrill[] {
  const muscleSet = new Set(targetMuscles);

  // Score drills by relevance — direct hit + type priority
  const scored = DRILLS.map((drill) => {
    const directHits = drill.muscles.filter((m) => muscleSet.has(m)).length;
    if (directHits === 0) return { drill, score: 0 };
    const typeBonus = drill.type === "activation" ? 2 : drill.type === "mobility" ? 1 : 0.5;
    return { drill, score: directHits * typeBonus };
  }).filter((d) => d.score > 0);

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Pick top drills, ensuring we get mix of types
  const picked: WarmupDrill[] = [];
  const pickedNames = new Set<string>();

  // Ensure at least 1 mobility
  for (const { drill } of scored) {
    if (drill.type === "mobility" && !pickedNames.has(drill.name)) {
      picked.push(drill);
      pickedNames.add(drill.name);
      break;
    }
  }

  // Fill up to 6-7 with highest scored
  for (const { drill } of scored) {
    if (picked.length >= 7) break;
    if (pickedNames.has(drill.name)) continue;
    picked.push(drill);
    pickedNames.add(drill.name);
  }

  // Ensure at least 1 dynamic at the end
  if (!picked.some((d) => d.type === "dynamic")) {
    for (const { drill } of scored) {
      if (drill.type === "dynamic" && !pickedNames.has(drill.name)) {
        if (picked.length >= 8) picked.pop();
        picked.push(drill);
        break;
      }
    }
  }

  // Sort: mobility → activation → dynamic
  const order = { mobility: 0, activation: 1, dynamic: 2 };
  picked.sort((a, b) => order[a.type] - order[b.type]);

  return picked;
}

/**
 * Get estimated total time of warmup routine in minutes.
 */
export function estimateWarmupTime(drills: WarmupDrill[]): number {
  // Approximate: each drill ~40-60 seconds avg
  return Math.round(drills.length * 0.8); // ~0.8 min per drill
}
