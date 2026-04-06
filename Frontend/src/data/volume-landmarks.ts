// =============================================
// 5.3 — Volume Landmarks per Muscle Group
// MEV = Minimum Effective Volume (sets/week)
// MAV = Maximum Adaptive Volume (sets/week)
// MRV = Maximum Recoverable Volume (sets/week)
// Based on Renaissance Periodization guidelines
// Adjusted per phase type
// =============================================

import type { MuscleGroup } from "@/data/exercises";
import type { Phase } from "@/data/phases";

export interface VolumeLandmarks {
  mev: number; // Minimum Effective Volume
  mav: number; // Maximum Adaptive Volume
  mrv: number; // Maximum Recoverable Volume
}

// Base landmarks (for accumulation / high volume phases)
const BASE_LANDMARKS: Record<MuscleGroup, VolumeLandmarks> = {
  chest:       { mev: 8,  mav: 16, mrv: 22 },
  front_delts: { mev: 6,  mav: 12, mrv: 18 },
  side_delts:  { mev: 8,  mav: 18, mrv: 26 },
  rear_delts:  { mev: 6,  mav: 14, mrv: 22 },
  triceps:     { mev: 6,  mav: 12, mrv: 18 },
  biceps:      { mev: 8,  mav: 16, mrv: 22 },
  forearms:    { mev: 4,  mav: 10, mrv: 16 },
  upper_back:  { mev: 8,  mav: 16, mrv: 22 },
  lats:        { mev: 8,  mav: 16, mrv: 22 },
  lower_back:  { mev: 4,  mav: 8,  mrv: 12 },
  traps:       { mev: 6,  mav: 12, mrv: 18 },
  abs:         { mev: 6,  mav: 14, mrv: 20 },
  obliques:    { mev: 4,  mav: 10, mrv: 16 },
  quads:       { mev: 8,  mav: 16, mrv: 22 },
  hamstrings:  { mev: 6,  mav: 14, mrv: 20 },
  glutes:      { mev: 6,  mav: 14, mrv: 20 },
  calves:      { mev: 8,  mav: 16, mrv: 22 },
  hip_flexors: { mev: 4,  mav: 8,  mrv: 14 },
  adductors:   { mev: 4,  mav: 10, mrv: 16 },
};

// Phase multipliers — adjust landmarks based on phase type
const PHASE_MULTIPLIERS: Record<Phase["type"], number> = {
  reactivation:    0.6,  // Low volume — lower all landmarks
  accumulation:    1.0,  // Base landmarks
  intensification: 0.8,  // Less volume, more intensity
  deload:          0.4,  // Deload — way lower
  peaking:         0.75, // Moderate
};

/**
 * Get volume landmarks for a specific muscle in the current phase.
 */
export function getVolumeLandmarks(
  muscle: MuscleGroup,
  phase: Phase
): VolumeLandmarks {
  const base = BASE_LANDMARKS[muscle];
  const mult = PHASE_MULTIPLIERS[phase.type];
  return {
    mev: Math.round(base.mev * mult),
    mav: Math.round(base.mav * mult),
    mrv: Math.round(base.mrv * mult),
  };
}

/**
 * Get all muscle landmarks for the given phase.
 */
export function getAllVolumeLandmarks(
  phase: Phase
): Record<MuscleGroup, VolumeLandmarks> {
  const result = {} as Record<MuscleGroup, VolumeLandmarks>;
  for (const muscle of Object.keys(BASE_LANDMARKS) as MuscleGroup[]) {
    result[muscle] = getVolumeLandmarks(muscle, phase);
  }
  return result;
}

export type VolumeZone = "below_mev" | "productive" | "approaching_mrv" | "over_mrv";

/**
 * Classify current volume into a zone.
 */
export function getVolumeZone(
  currentSets: number,
  landmarks: VolumeLandmarks
): VolumeZone {
  if (currentSets < landmarks.mev) return "below_mev";
  if (currentSets > landmarks.mrv) return "over_mrv";
  if (currentSets > landmarks.mav) return "approaching_mrv";
  return "productive";
}

export const ZONE_COLORS: Record<VolumeZone, string> = {
  below_mev: "#FFD60A",      // yellow — under-training
  productive: "#34C759",     // green — optimal
  approaching_mrv: "#FF9500", // orange — caution
  over_mrv: "#FF453A",       // red — overreaching
};

export const ZONE_LABELS: Record<VolumeZone, string> = {
  below_mev: "Bajo MEV",
  productive: "Zona productiva",
  approaching_mrv: "Cerca del MRV",
  over_mrv: "Sobre MRV ⚠️",
};
