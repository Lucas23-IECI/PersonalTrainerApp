/**
 * 4.7 + 5.2 — Deload Detection & Auto-Deload Programming
 * Original: RPE-based detection (≥ 9 for 2+ consecutive sessions)
 * Enhanced: Accumulated fatigue model using volume + RPE trends
 */

import { getSessions, getWeeklyMuscleData, type WorkoutSession, safeGetItem, safeSetItem} from "./storage";
import { getCurrentPhase } from "@/data/phases";
import { getAllVolumeLandmarks } from "@/data/volume-landmarks";
import type { MuscleGroup } from "@/data/exercises";

export interface DeloadCheck {
  shouldDeload: boolean;
  reason: string;
  avgRpe: number;
  consecutiveHighSessions: number;
}

/**
 * Analyze last N completed sessions for high RPE pattern.
 * Returns deload recommendation if RPE ≥ 9 for 2+ consecutive sessions.
 */
export function checkDeload(lookback = 4): DeloadCheck {
  const sessions = getSessions()
    .filter((s) => s.completed && s.exercises.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, lookback);

  if (sessions.length < 2) {
    return { shouldDeload: false, reason: "Pocas sesiones para evaluar.", avgRpe: 0, consecutiveHighSessions: 0 };
  }

  // Calculate avg RPE per session
  const sessionRpes = sessions.map((s) => {
    const rpes: number[] = [];
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (set.rpe) rpes.push(set.rpe);
      }
    }
    return rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
  });

  // Count consecutive high-RPE sessions from most recent
  let consecutiveHigh = 0;
  for (const rpe of sessionRpes) {
    if (rpe >= 9) consecutiveHigh++;
    else break;
  }

  const avgRpe = sessionRpes.length > 0
    ? sessionRpes.reduce((a, b) => a + b, 0) / sessionRpes.length
    : 0;

  if (consecutiveHigh >= 3) {
    return {
      shouldDeload: true,
      reason: `RPE ≥ 9 en las últimas ${consecutiveHigh} sesiones consecutivas. Tu cuerpo necesita recuperar.`,
      avgRpe: Math.round(avgRpe * 10) / 10,
      consecutiveHighSessions: consecutiveHigh,
    };
  }

  if (consecutiveHigh >= 2) {
    return {
      shouldDeload: true,
      reason: `RPE alto (≥ 9) en tus últimas ${consecutiveHigh} sesiones. Considerá una semana de descarga.`,
      avgRpe: Math.round(avgRpe * 10) / 10,
      consecutiveHighSessions: consecutiveHigh,
    };
  }

  return {
    shouldDeload: false,
    reason: "Todo bien. Seguí entrenando normalmente.",
    avgRpe: Math.round(avgRpe * 10) / 10,
    consecutiveHighSessions: consecutiveHigh,
  };
}

/**
 * Generate deload parameters: reduce weight by 40%, drop 1 set per exercise.
 */
export function getDeloadModifiers() {
  return {
    weightMultiplier: 0.6, // 60% of normal weight
    setsReduction: 1,      // drop 1 set per exercise
    rpeTarget: "6-7",      // keep RPE low
  };
}

// =============================================
// 5.2 — Accumulated Fatigue Model
// =============================================

export interface FatigueScore {
  overall: number;        // 0-100 (0 = fresh, 100 = overtrained)
  level: "fresh" | "managed" | "accumulating" | "high" | "critical";
  rpeComponent: number;   // 0-40 pts
  volumeComponent: number; // 0-40 pts
  frequencyComponent: number; // 0-20 pts
  musclesOverMrv: string[];
  recommendation: string;
}

const FATIGUE_KEY = "mark-pt-fatigue-history";

export interface FatigueHistoryEntry {
  date: string;
  score: number;
}

export function getFatigueHistory(): FatigueHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(FATIGUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFatigueHistory(entries: FatigueHistoryEntry[]) {
  safeSetItem(FATIGUE_KEY, JSON.stringify(entries.slice(-30))); // keep 30 days
}

/**
 * Calculate accumulated fatigue score from multiple signals:
 * 1. RPE trend (last 2 weeks) — are RPEs trending upward?
 * 2. Volume vs MRV — how many muscles are above MRV?
 * 3. Training frequency — how dense is the training?
 */
export function calculateFatigue(): FatigueScore {
  const sessions = getSessions()
    .filter((s) => s.completed && s.exercises.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Empty → fresh
  if (sessions.length < 3) {
    return {
      overall: 0,
      level: "fresh",
      rpeComponent: 0,
      volumeComponent: 0,
      frequencyComponent: 0,
      musclesOverMrv: [],
      recommendation: "Pocas sesiones registradas. ¡A entrenar!",
    };
  }

  // --- 1. RPE Component (0-40) ---
  const last14Days = new Date();
  last14Days.setDate(last14Days.getDate() - 14);
  const last14Str = last14Days.toISOString().slice(0, 10);
  const recentSessions = sessions.filter((s) => s.date >= last14Str);

  const sessionRpes = recentSessions.map((s) => {
    const rpes: number[] = [];
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (set.rpe) rpes.push(set.rpe);
      }
    }
    return rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
  }).filter((r) => r > 0);

  let rpeComponent = 0;
  if (sessionRpes.length > 0) {
    const avgRpe = sessionRpes.reduce((a, b) => a + b, 0) / sessionRpes.length;
    // Scale: RPE 6 → 0pts, RPE 7 → 8pts, RPE 8 → 16pts, RPE 9 → 28pts, RPE 10 → 40pts
    rpeComponent = Math.min(40, Math.max(0, Math.round((avgRpe - 6) * 10)));

    // Bonus for upward trend (last 4 sessions RPE > previous 4)
    if (sessionRpes.length >= 4) {
      const recent = sessionRpes.slice(0, Math.floor(sessionRpes.length / 2));
      const older = sessionRpes.slice(Math.floor(sessionRpes.length / 2));
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      if (recentAvg > olderAvg + 0.3) {
        rpeComponent = Math.min(40, rpeComponent + 5);
      }
    }
  }

  // --- 2. Volume Component (0-40) ---
  const phase = getCurrentPhase();
  const landmarks = getAllVolumeLandmarks(phase);
  const weeklyData = getWeeklyMuscleData();
  const musclesOverMrv: string[] = [];
  let volumeScore = 0;
  let musclesChecked = 0;

  for (const [muscle, stats] of Object.entries(weeklyData)) {
    const lm = landmarks[muscle as MuscleGroup];
    if (!lm) continue;
    musclesChecked++;

    if (stats.sets > lm.mrv) {
      musclesOverMrv.push(muscle);
      volumeScore += 3; // 3 pts per overreaching muscle
    } else if (stats.sets > lm.mav) {
      volumeScore += 1; // approaching MRV
    }
  }
  const volumeComponent = Math.min(40, volumeScore * 2);

  // --- 3. Frequency Component (0-20) ---
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const last7Str = last7Days.toISOString().slice(0, 10);
  const sessionsThisWeek = sessions.filter((s) => s.date >= last7Str).length;
  // 1-3 days → low freq, 4-5 → moderate, 6-7 → very high
  const frequencyComponent = Math.min(20, Math.max(0, (sessionsThisWeek - 3) * 5));

  // --- Overall ---
  const overall = Math.min(100, rpeComponent + volumeComponent + frequencyComponent);

  let level: FatigueScore["level"];
  if (overall <= 15) level = "fresh";
  else if (overall <= 35) level = "managed";
  else if (overall <= 55) level = "accumulating";
  else if (overall <= 75) level = "high";
  else level = "critical";

  let recommendation: string;
  switch (level) {
    case "fresh":
      recommendation = "Fatiga baja. Podés entrenar con intensidad normal.";
      break;
    case "managed":
      recommendation = "Fatiga controlada. Seguí con el plan.";
      break;
    case "accumulating":
      recommendation = "Fatiga acumulándose. Monitoreá el sueño y la recuperación.";
      break;
    case "high":
      recommendation = "Fatiga alta. Considerá reducir volumen o tomar un deload.";
      break;
    case "critical":
      recommendation = "⚠️ Fatiga crítica. Deload recomendado urgente.";
      break;
  }

  // Persist to history
  const today = new Date().toISOString().slice(0, 10);
  const history = getFatigueHistory().filter((h) => h.date !== today);
  history.push({ date: today, score: overall });
  saveFatigueHistory(history);

  return {
    overall,
    level,
    rpeComponent,
    volumeComponent,
    frequencyComponent,
    musclesOverMrv,
    recommendation,
  };
}

export const FATIGUE_COLORS: Record<FatigueScore["level"], string> = {
  fresh: "#34C759",
  managed: "#0A84FF",
  accumulating: "#FFD60A",
  high: "#FF9500",
  critical: "#FF453A",
};

export const FATIGUE_LABELS: Record<FatigueScore["level"], string> = {
  fresh: "Fresco",
  managed: "Controlada",
  accumulating: "Acumulando",
  high: "Alta",
  critical: "Crítica",
};

/**
 * Combined check: uses both RPE-based and fatigue model.
 * Returns the more urgent recommendation.
 */
export function checkDeloadAdvanced(): DeloadCheck & { fatigue: FatigueScore } {
  const rpeCheck = checkDeload();
  const fatigue = calculateFatigue();

  // If fatigue is high/critical, also suggest deload
  if (!rpeCheck.shouldDeload && (fatigue.level === "high" || fatigue.level === "critical")) {
    return {
      shouldDeload: true,
      reason: fatigue.recommendation + (fatigue.musclesOverMrv.length > 0
        ? ` (${fatigue.musclesOverMrv.length} músculo(s) sobre MRV)`
        : ""),
      avgRpe: rpeCheck.avgRpe,
      consecutiveHighSessions: rpeCheck.consecutiveHighSessions,
      fatigue,
    };
  }

  return { ...rpeCheck, fatigue };
}
