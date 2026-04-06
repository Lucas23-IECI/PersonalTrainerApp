import { getSessions, getCheckins, type WorkoutSession } from "@/lib/storage";
import type { MuscleGroup } from "@/data/exercises";

export type RecoveryStatus = "fresh" | "recovered" | "recovering" | "fatigued";

export interface MuscleRecoveryInfo {
  status: RecoveryStatus;
  lastTrained: string | null;
  hoursSince: number | null;
  sets: number;
}

function countMuscleSets(session: WorkoutSession, muscle: MuscleGroup): number {
  let total = 0;
  for (const ex of session.exercises) {
    if (ex.skipped) continue;
    if (ex.primaryMuscles?.includes(muscle)) {
      total += ex.sets.filter((s) => s.setType !== "warmup").length;
    }
  }
  return total;
}

function findLastSessionForMuscle(
  sessions: WorkoutSession[],
  muscle: MuscleGroup
): WorkoutSession | null {
  const sorted = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => b.startTime - a.startTime);

  for (const session of sorted) {
    for (const ex of session.exercises) {
      if (ex.skipped) continue;
      if (ex.primaryMuscles?.includes(muscle)) return session;
    }
  }
  return null;
}

const ALL_MUSCLES: MuscleGroup[] = [
  "chest", "front_delts", "side_delts", "rear_delts",
  "triceps", "biceps", "forearms",
  "upper_back", "lats", "lower_back", "traps",
  "abs", "obliques",
  "quads", "hamstrings", "glutes", "calves",
  "hip_flexors", "adductors",
];

export function getMuscleRecoveryMap(): Record<MuscleGroup, MuscleRecoveryInfo> {
  const sessions = getSessions();
  const now = Date.now();
  const result = {} as Record<MuscleGroup, MuscleRecoveryInfo>;

  for (const muscle of ALL_MUSCLES) {
    const lastSession = findLastSessionForMuscle(sessions, muscle);

    if (!lastSession) {
      result[muscle] = { status: "fresh", lastTrained: null, hoursSince: null, sets: 0 };
      continue;
    }

    const hoursSince = (now - lastSession.endTime) / (1000 * 60 * 60);
    const sets = countMuscleSets(lastSession, muscle);
    let status: RecoveryStatus;

    if (hoursSince > 96) {
      status = "fresh";
    } else if (hoursSince > 48) {
      status = "recovered";
    } else if (hoursSince >= 24) {
      status = sets > 6 ? "recovering" : "recovered";
    } else {
      status = "fatigued";
    }

    result[muscle] = {
      status,
      lastTrained: lastSession.date,
      hoursSince: Math.round(hoursSince * 10) / 10,
      sets,
    };
  }

  return result;
}

export function getRecoveryColor(status: RecoveryStatus): string {
  const colors: Record<RecoveryStatus, string> = {
    fresh: "#0A84FF",
    recovered: "#34C759",
    recovering: "#FFD60A",
    fatigued: "#FF453A",
  };
  return colors[status];
}

export function getRecoveryLabel(status: RecoveryStatus): string {
  const labels: Record<RecoveryStatus, string> = {
    fresh: "Descansado",
    recovered: "Recuperado",
    recovering: "Recuperando",
    fatigued: "Fatigado",
  };
  return labels[status];
}

export function getRecoveryEmoji(status: RecoveryStatus): string {
  const emojis: Record<RecoveryStatus, string> = {
    fresh: "🔵",
    recovered: "🟢",
    recovering: "🟡",
    fatigued: "🔴",
  };
  return emojis[status];
}

// =============================================
// 7.4 — IA: Smart Recovery Scoring
// =============================================

export interface SmartRecoveryInfo extends MuscleRecoveryInfo {
  recoveryPct: number;      // 0-100 estimated recovery %
  readyIn: number | null;   // hours until ~90% recovered (null if already ready)
  adjustedBy: string[];     // factors that adjusted the score
}

/**
 * Smart recovery model factoring in checkin data:
 * - Base: time since last training (logarithmic curve, ~48h for full recovery)
 * - Sleep penalty: < 7h sleep → slower recovery (-15%)
 * - Sleep bonus: ≥ 8h sleep → faster recovery (+10%)
 * - Stress penalty: stress ≥ 4 → slower recovery (-10% per level above 3)
 * - Soreness penalty: soreness ≥ 2 → slower recovery (-10%)
 * - High volume penalty: > 10 sets for a muscle → slower recovery (-10%)
 */
export function getSmartRecoveryMap(): Record<MuscleGroup, SmartRecoveryInfo> {
  const baseMap = getMuscleRecoveryMap();
  const checkins = getCheckins();
  const result = {} as Record<MuscleGroup, SmartRecoveryInfo>;

  // Get latest checkin data (average of last 3 days for stability)
  const recentCheckins = checkins
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const avgSleep = recentCheckins.length > 0
    ? recentCheckins.reduce((s, c) => s + (c.sleepHours || 7), 0) / recentCheckins.length
    : 7;
  const avgStress = recentCheckins.length > 0
    ? recentCheckins.reduce((s, c) => s + (c.stress || 3), 0) / recentCheckins.length
    : 3;
  const latestSoreness = recentCheckins[0]?.soreness ?? 0;

  for (const muscle of ALL_MUSCLES) {
    const base = baseMap[muscle];
    const adjustedBy: string[] = [];

    if (base.hoursSince === null) {
      result[muscle] = { ...base, recoveryPct: 100, readyIn: null, adjustedBy: [] };
      continue;
    }

    // Base recovery curve: logarithmic, ~48h = 90%, ~72h = 98%, ~96h = 100%
    const hours = base.hoursSince;
    let recoveryPct = Math.min(100, (Math.log(1 + hours / 6) / Math.log(1 + 48 / 6)) * 90);

    // Volume penalty: more sets → need more recovery
    const volumeFactor = base.sets > 10 ? -10 : base.sets > 6 ? -5 : 0;
    if (volumeFactor < 0) adjustedBy.push(`vol.alto (${base.sets} sets)`);
    recoveryPct += volumeFactor;

    // Sleep factor
    if (avgSleep < 6) {
      recoveryPct -= 20;
      adjustedBy.push("sueño bajo");
    } else if (avgSleep < 7) {
      recoveryPct -= 10;
      adjustedBy.push("sueño regular");
    } else if (avgSleep >= 8) {
      recoveryPct += 8;
      adjustedBy.push("buen sueño");
    }

    // Stress factor
    if (avgStress >= 4) {
      const penalty = Math.round((avgStress - 3) * 10);
      recoveryPct -= penalty;
      adjustedBy.push("estrés alto");
    }

    // Soreness factor
    if (latestSoreness >= 2) {
      recoveryPct -= 10;
      adjustedBy.push("dolor muscular");
    }

    recoveryPct = Math.max(0, Math.min(100, Math.round(recoveryPct)));

    // Estimate hours until 90% recovered
    let readyIn: number | null = null;
    if (recoveryPct < 90) {
      // Rough inverse: how many more hours to reach 90%
      const recoveryRate = recoveryPct / Math.max(hours, 1); // pct per hour
      const remaining = 90 - recoveryPct;
      readyIn = recoveryRate > 0 ? Math.round(remaining / recoveryRate) : 24;
    }

    result[muscle] = { ...base, recoveryPct, readyIn, adjustedBy };
  }

  return result;
}

export interface RecoveryDashboard {
  overallPct: number;
  readyMuscles: MuscleGroup[];
  recoveringMuscles: { muscle: MuscleGroup; pct: number; readyIn: number | null }[];
  topTip: string;
}

/** High-level recovery dashboard for the health/home page */
export function getRecoveryDashboard(): RecoveryDashboard {
  const map = getSmartRecoveryMap();
  const readyMuscles: MuscleGroup[] = [];
  const recoveringMuscles: { muscle: MuscleGroup; pct: number; readyIn: number | null }[] = [];

  let totalPct = 0;
  let count = 0;

  for (const muscle of ALL_MUSCLES) {
    const info = map[muscle];
    if (info.hoursSince === null) continue; // never trained, skip from avg
    count++;
    totalPct += info.recoveryPct;

    if (info.recoveryPct >= 85) {
      readyMuscles.push(muscle);
    } else {
      recoveringMuscles.push({ muscle, pct: info.recoveryPct, readyIn: info.readyIn });
    }
  }

  recoveringMuscles.sort((a, b) => a.pct - b.pct);
  const overallPct = count > 0 ? Math.round(totalPct / count) : 100;

  let topTip: string;
  if (overallPct >= 90) {
    topTip = "💪 Recuperación óptima — listo para entrenar fuerte";
  } else if (overallPct >= 70) {
    topTip = "🟢 Buena recuperación — podés entrenar con intensidad normal";
  } else if (overallPct >= 50) {
    topTip = "🟡 Recuperación parcial — considerá un volumen moderado hoy";
  } else {
    topTip = "🔴 Recuperación baja — priorizá descanso o entrenamiento ligero";
  }

  return { overallPct, readyMuscles, recoveringMuscles, topTip };
}
