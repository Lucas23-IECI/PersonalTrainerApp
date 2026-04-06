/**
 * 4.7 — Deload Detection & Suggestion
 * Detects when RPE has been consistently high (≥ 9) across
 * recent sessions and suggests a deload week.
 */

import { getSessions, type WorkoutSession } from "./storage";

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
