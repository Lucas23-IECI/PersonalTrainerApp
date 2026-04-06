/**
 * 8.1 — Performance Score Dashboard
 * Unified score combining consistency, strength, volume efficiency,
 * recovery quality, and balance. Athlete level classification.
 */

import { getSessions, getCheckins, type WorkoutSession } from "./storage";
import { getSmartRecoveryMap } from "./muscle-recovery";
import { getWeaknessAnalysis } from "./weakness-analysis";
import { getExerciseHistory } from "./progression";
import { calculateFatigue } from "./deload";

// ── Types ──

export type AthleteLevel = "beginner" | "novice" | "intermediate" | "advanced" | "elite";

export interface PerformanceBreakdown {
  consistency: number;   // 0-100: adherence to planned sessions
  strength: number;      // 0-100: E1RM progression trend
  volumeEff: number;     // 0-100: volume per session efficiency
  recovery: number;      // 0-100: recovery quality (sleep, stress)
  balance: number;       // 0-100: muscle balance from weakness analysis
}

export interface PerformanceScore {
  overall: number;       // 0-100 weighted composite
  level: AthleteLevel;
  breakdown: PerformanceBreakdown;
  trend: "improving" | "stable" | "declining";
  streakDays: number;
  totalSessions: number;
  periodLabel: string;   // "Última semana" | "Último mes" | "Todo"
}

export interface PerformanceComparison {
  current: PerformanceScore;
  previous: PerformanceScore;
  delta: number; // overall change
}

// ── Helpers ──

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function sessionsInRange(sessions: WorkoutSession[], days: number): WorkoutSession[] {
  const cutoff = daysAgo(days);
  return sessions.filter((s) => s.completed && s.date >= cutoff);
}

// ── Scoring Functions ──

/** Consistency: sessions per week relative to a target (4-5/week) */
function scoreConsistency(sessions: WorkoutSession[], days: number): number {
  const recent = sessionsInRange(sessions, days);
  const weeks = Math.max(1, days / 7);
  const perWeek = recent.length / weeks;
  // 4 sessions/week = 100, scale linearly
  return Math.min(100, Math.round((perWeek / 4) * 100));
}

/** Strength: E1RM trend across main compound exercises */
function scoreStrength(sessions: WorkoutSession[], days: number): number {
  const recent = sessionsInRange(sessions, days);
  if (recent.length < 2) return 50; // neutral if not enough data

  // Collect all unique exercises with enough history
  const exerciseNames = new Set<string>();
  for (const s of recent) {
    for (const ex of s.exercises) {
      if (!ex.skipped && ex.sets.length > 0) exerciseNames.add(ex.name);
    }
  }

  let improving = 0;
  let stagnating = 0;
  let declining = 0;

  for (const name of exerciseNames) {
    const history = getExerciseHistory(name, 5);
    if (history.length < 2) continue;

    // Compare E1RM of most recent vs oldest in window
    const recentE1rm = Math.max(
      ...history[0].sets.map((s) => (s.weight || 0) * (1 + s.reps / 30))
    );
    const olderE1rm = Math.max(
      ...history[history.length - 1].sets.map((s) => (s.weight || 0) * (1 + s.reps / 30))
    );

    if (recentE1rm > olderE1rm * 1.02) improving++;
    else if (recentE1rm < olderE1rm * 0.98) declining++;
    else stagnating++;
  }

  const total = improving + stagnating + declining;
  if (total === 0) return 50;

  // Score: improving exercises push toward 100, declining toward 0
  return Math.min(100, Math.max(0, Math.round(
    50 + (improving - declining) / total * 50
  )));
}

/** Volume efficiency: average working sets per session */
function scoreVolumeEfficiency(sessions: WorkoutSession[], days: number): number {
  const recent = sessionsInRange(sessions, days);
  if (recent.length === 0) return 0;

  let totalSets = 0;
  for (const s of recent) {
    for (const ex of s.exercises) {
      if (!ex.skipped) {
        totalSets += ex.sets.filter((set) => set.setType !== "warmup").length;
      }
    }
  }

  const avgSets = totalSets / recent.length;
  // 15-20 sets per session = optimal (100), scale accordingly
  if (avgSets >= 15 && avgSets <= 25) return 100;
  if (avgSets < 15) return Math.round((avgSets / 15) * 100);
  return Math.max(60, 100 - Math.round((avgSets - 25) * 3)); // slight penalty for excessive
}

/** Recovery: based on smart recovery map overall + sleep quality */
function scoreRecovery(): number {
  const recoveryMap = getSmartRecoveryMap();
  const checkins = getCheckins()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  let pctSum = 0;
  let count = 0;
  for (const m of Object.values(recoveryMap)) {
    if (m.hoursSince !== null) {
      pctSum += m.recoveryPct;
      count++;
    }
  }
  const avgRecovery = count > 0 ? pctSum / count : 70;

  // Sleep component
  const sleepScores = checkins
    .filter((c) => c.sleepHours)
    .map((c) => {
      const h = c.sleepHours!;
      // 7-9h = optimal
      if (h >= 7 && h <= 9) return 100;
      if (h >= 6) return 70;
      return 40;
    });
  const avgSleepScore = sleepScores.length > 0
    ? sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length
    : 70;

  return Math.round(avgRecovery * 0.6 + avgSleepScore * 0.4);
}

/** Balance: from weakness analysis score */
function scoreBalance(): number {
  return getWeaknessAnalysis().score;
}

// ── Training streak ──

function getTrainingStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;

  const sorted = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  const dates = [...new Set(sorted.map((s) => s.date))];
  if (dates.length === 0) return 0;

  // Check if there's a session today or yesterday (allow 1 day gap for rest days)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = daysAgo(1);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  // Count consecutive "training weeks" (at least 1 session per 3 days)
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const daysBetween =
      (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysBetween <= 3) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ── Level classification ──

function getLevel(score: number, totalSessions: number): AthleteLevel {
  // Need minimum sessions before earning higher levels
  if (totalSessions < 10) return "beginner";
  if (totalSessions < 30 && score < 70) return "beginner";
  if (score >= 85 && totalSessions >= 100) return "elite";
  if (score >= 75 && totalSessions >= 60) return "advanced";
  if (score >= 55 && totalSessions >= 30) return "intermediate";
  if (totalSessions >= 15) return "novice";
  return "beginner";
}

// ── Main API ──

export type PerformancePeriod = "week" | "month" | "all";

const PERIOD_DAYS: Record<PerformancePeriod, number> = {
  week: 7,
  month: 30,
  all: 365,
};

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  week: "Última semana",
  month: "Último mes",
  all: "Todo el historial",
};

export function getPerformanceScore(period: PerformancePeriod = "month"): PerformanceScore {
  const allSessions = getSessions().filter((s) => s.completed);
  const days = PERIOD_DAYS[period];

  const breakdown: PerformanceBreakdown = {
    consistency: scoreConsistency(allSessions, days),
    strength: scoreStrength(allSessions, days),
    volumeEff: scoreVolumeEfficiency(allSessions, days),
    recovery: scoreRecovery(),
    balance: scoreBalance(),
  };

  // Weighted composite
  const overall = Math.round(
    breakdown.consistency * 0.25 +
    breakdown.strength * 0.25 +
    breakdown.volumeEff * 0.15 +
    breakdown.recovery * 0.20 +
    breakdown.balance * 0.15
  );

  const totalSessions = allSessions.length;
  const level = getLevel(overall, totalSessions);
  const streakDays = getTrainingStreak(allSessions);

  // Trend: compare current vs previous period
  const prevDays = days * 2;
  const prevCutoff = daysAgo(prevDays);
  const currentCutoff = daysAgo(days);
  const prevSessions = allSessions.filter(
    (s) => s.date >= prevCutoff && s.date < currentCutoff
  );
  const prevPerWeek = prevSessions.length / Math.max(1, days / 7);
  const curPerWeek = sessionsInRange(allSessions, days).length / Math.max(1, days / 7);

  let trend: PerformanceScore["trend"] = "stable";
  if (curPerWeek > prevPerWeek * 1.15) trend = "improving";
  else if (curPerWeek < prevPerWeek * 0.85) trend = "declining";

  return {
    overall,
    level,
    breakdown,
    trend,
    streakDays,
    totalSessions,
    periodLabel: PERIOD_LABELS[period],
  };
}

/** Compare current period with previous period */
export function getPerformanceComparison(period: PerformancePeriod = "month"): PerformanceComparison {
  const current = getPerformanceScore(period);

  // For "previous", shift the window back
  const allSessions = getSessions().filter((s) => s.completed);
  const days = PERIOD_DAYS[period];
  const prevCutoff = daysAgo(days * 2);
  const currentCutoff = daysAgo(days);
  const prevSessions = allSessions.filter(
    (s) => s.date >= prevCutoff && s.date < currentCutoff
  );

  const prevBreakdown: PerformanceBreakdown = {
    consistency: (() => {
      const weeks = Math.max(1, days / 7);
      return Math.min(100, Math.round((prevSessions.length / weeks / 4) * 100));
    })(),
    strength: 50, // simplified for previous
    volumeEff: (() => {
      if (prevSessions.length === 0) return 0;
      let totalSets = 0;
      for (const s of prevSessions) {
        for (const ex of s.exercises) {
          if (!ex.skipped) totalSets += ex.sets.filter((set) => set.setType !== "warmup").length;
        }
      }
      const avg = totalSets / prevSessions.length;
      return Math.min(100, Math.round((avg / 15) * 100));
    })(),
    recovery: 70, // can't retroactively calculate
    balance: 70,
  };

  const prevOverall = Math.round(
    prevBreakdown.consistency * 0.25 +
    prevBreakdown.strength * 0.25 +
    prevBreakdown.volumeEff * 0.15 +
    prevBreakdown.recovery * 0.20 +
    prevBreakdown.balance * 0.15
  );

  const previous: PerformanceScore = {
    overall: prevOverall,
    level: getLevel(prevOverall, prevSessions.length),
    breakdown: prevBreakdown,
    trend: "stable",
    streakDays: 0,
    totalSessions: prevSessions.length,
    periodLabel: "Período anterior",
  };

  return {
    current,
    previous,
    delta: current.overall - prevOverall,
  };
}

/** Get level display info */
export function getLevelInfo(level: AthleteLevel): { label: string; emoji: string; color: string; next: string } {
  const levels: Record<AthleteLevel, { label: string; emoji: string; color: string; next: string }> = {
    beginner: { label: "Principiante", emoji: "🌱", color: "#8E8E93", next: "Entrená 15+ sesiones para subir" },
    novice: { label: "Novato", emoji: "💪", color: "#34C759", next: "Score 55+ con 30 sesiones para subir" },
    intermediate: { label: "Intermedio", emoji: "🔥", color: "#FF9500", next: "Score 75+ con 60 sesiones para subir" },
    advanced: { label: "Avanzado", emoji: "⭐", color: "#0A84FF", next: "Score 85+ con 100 sesiones para élite" },
    elite: { label: "Élite", emoji: "👑", color: "#AF52DE", next: "¡Nivel máximo alcanzado!" },
  };
  return levels[level];
}
