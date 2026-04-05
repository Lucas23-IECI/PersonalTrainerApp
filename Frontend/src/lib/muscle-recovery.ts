import { getSessions, type WorkoutSession } from "@/lib/storage";
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
