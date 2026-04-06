/**
 * 8.3 — Session Intelligence
 * Post-workout micro-insights: PRs detected, session comparison vs average,
 * patterns by day/time, plateau alerts, micro-recommendations.
 */

import { getSessions, getCheckins, type WorkoutSession, type LoggedSet } from "./storage";
import { isNewPR, getExerciseHistory } from "./progression";

// ── Types ──

export interface SessionInsight {
  type: "pr" | "volume_up" | "volume_down" | "best_day" | "plateau" | "tip" | "streak" | "intensity";
  icon: string;
  title: string;
  detail: string;
  color: string;
}

export interface SessionAnalysis {
  sessionId: string;
  date: string;
  workoutName: string;
  insights: SessionInsight[];
  totalSets: number;
  totalVolume: number;
  avgRpe: number;
  duration: number;       // minutes
  vsAvg: {
    sets: number;         // delta vs average
    volume: number;       // delta vs average
    duration: number;     // delta vs average
  };
}

export interface DayPattern {
  dayName: string;
  avgSets: number;
  avgVolume: number;
  avgRpe: number;
  sessionCount: number;
  isBestDay: boolean;
}

// ── Helpers ──

function calcE1rm(set: LoggedSet): number {
  const w = set.weight || 0;
  const r = set.reps;
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// ── Session Stats ──

function getSessionStats(session: WorkoutSession) {
  let totalSets = 0;
  let totalVolume = 0;
  const rpes: number[] = [];

  for (const ex of session.exercises) {
    if (ex.skipped) continue;
    const working = ex.sets.filter((s) => s.setType !== "warmup");
    totalSets += working.length;
    for (const s of working) {
      totalVolume += (s.weight || 0) * s.reps;
      if (s.rpe) rpes.push(s.rpe);
    }
  }

  const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
  const duration = session.endTime > session.startTime
    ? Math.round((session.endTime - session.startTime) / 60000)
    : 0;

  return { totalSets, totalVolume, avgRpe, duration };
}

// ── PR Detection ──

function detectPRs(session: WorkoutSession): SessionInsight[] {
  const insights: SessionInsight[] = [];

  for (const ex of session.exercises) {
    if (ex.skipped || ex.sets.length === 0) continue;

    for (const set of ex.sets) {
      const pr = isNewPR(ex.name, set);
      if (pr.isPR) {
        insights.push({
          type: "pr",
          icon: "🏆",
          title: `PR en ${ex.name}!`,
          detail: pr.type === "weight"
            ? `Nuevo récord de peso: ${set.weight}kg × ${set.reps}`
            : `Nuevo e1RM: ~${Math.round(calcE1rm(set))}kg`,
          color: "#FFD60A",
        });
      }
    }
  }

  return insights;
}

// ── Plateau Detection ──

function detectPlateaus(session: WorkoutSession): SessionInsight[] {
  const insights: SessionInsight[] = [];

  for (const ex of session.exercises) {
    if (ex.skipped || ex.sets.length === 0) continue;

    const history = getExerciseHistory(ex.name, 5);
    if (history.length < 3) continue;

    const weights = history.slice(0, 3).map((h) => h.topSet.weight);
    const allSame = weights.every((w) => w === weights[0]) && weights[0] > 0;

    if (allSame) {
      insights.push({
        type: "plateau",
        icon: "⚠️",
        title: `${ex.name} estancado`,
        detail: `${weights[0]}kg las últimas 3 sesiones. Probá variar reps o técnica.`,
        color: "#FF9500",
      });
    }
  }

  return insights;
}

// ── Volume Comparison ──

function compareVsAverage(session: WorkoutSession, stats: ReturnType<typeof getSessionStats>): SessionInsight[] {
  const insights: SessionInsight[] = [];
  const allSessions = getSessions().filter((s) => s.completed && s.id !== session.id);
  if (allSessions.length < 3) return insights;

  // Average of last 10 sessions
  const recent = allSessions.slice(-10);
  const avgStats = recent.map(getSessionStats);
  const avgSets = avgStats.reduce((s, a) => s + a.totalSets, 0) / avgStats.length;
  const avgVolume = avgStats.reduce((s, a) => s + a.totalVolume, 0) / avgStats.length;

  const setsDelta = stats.totalSets - avgSets;
  const volumeDelta = stats.totalVolume - avgVolume;
  const volPct = avgVolume > 0 ? Math.round((volumeDelta / avgVolume) * 100) : 0;

  if (setsDelta > 3) {
    insights.push({
      type: "volume_up",
      icon: "📈",
      title: `+${Math.round(setsDelta)} sets vs promedio`,
      detail: `${stats.totalSets} sets hoy (promedio: ${Math.round(avgSets)})`,
      color: "#34C759",
    });
  } else if (setsDelta < -3) {
    insights.push({
      type: "volume_down",
      icon: "📉",
      title: `${Math.round(setsDelta)} sets vs promedio`,
      detail: `${stats.totalSets} sets hoy (promedio: ${Math.round(avgSets)})`,
      color: "#FF9500",
    });
  }

  if (Math.abs(volPct) > 15) {
    insights.push({
      type: volPct > 0 ? "volume_up" : "volume_down",
      icon: volPct > 0 ? "💪" : "🔽",
      title: `Volumen ${volPct > 0 ? "+" : ""}${volPct}% vs promedio`,
      detail: `${Math.round(stats.totalVolume)}kg totales (prom: ${Math.round(avgVolume)}kg)`,
      color: volPct > 0 ? "#34C759" : "#FF9500",
    });
  }

  return insights;
}

// ── Intensity Insights ──

function intensityInsights(stats: ReturnType<typeof getSessionStats>): SessionInsight[] {
  const insights: SessionInsight[] = [];

  if (stats.avgRpe >= 9.5) {
    insights.push({
      type: "intensity",
      icon: "🔥",
      title: "Sesión muy intensa",
      detail: `RPE promedio ${stats.avgRpe.toFixed(1)} — asegurate de descansar bien`,
      color: "#FF3B30",
    });
  } else if (stats.avgRpe >= 8.5) {
    insights.push({
      type: "intensity",
      icon: "⚡",
      title: "Buena intensidad",
      detail: `RPE promedio ${stats.avgRpe.toFixed(1)} — esfuerzo productivo`,
      color: "#0A84FF",
    });
  } else if (stats.avgRpe > 0 && stats.avgRpe < 6) {
    insights.push({
      type: "tip",
      icon: "💡",
      title: "Intensidad baja",
      detail: `RPE promedio ${stats.avgRpe.toFixed(1)} — podés empujar más en ejercicios clave`,
      color: "#8E8E93",
    });
  }

  return insights;
}

// ── Smart Tips ──

function smartTips(session: WorkoutSession, stats: ReturnType<typeof getSessionStats>): SessionInsight[] {
  const insights: SessionInsight[] = [];
  const checkins = getCheckins().sort((a, b) => b.date.localeCompare(a.date));
  const todayCheckin = checkins.find((c) => c.date === session.date);

  if (todayCheckin?.sleepHours && todayCheckin.sleepHours < 6 && stats.avgRpe >= 8) {
    insights.push({
      type: "tip",
      icon: "😴",
      title: "Entrenaste con poco sueño",
      detail: `${todayCheckin.sleepHours}h de sueño + RPE alto. Priorizá descanso hoy.`,
      color: "#AF52DE",
    });
  }

  if (stats.duration > 90) {
    insights.push({
      type: "tip",
      icon: "⏰",
      title: "Sesión larga",
      detail: `${stats.duration} min — considerá acortar descansos o usar supersets`,
      color: "#8E8E93",
    });
  }

  return insights;
}

// ── Main API ──

/** Analyze a specific session and generate insights */
export function analyzeSession(sessionId: string): SessionAnalysis | null {
  const sessions = getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const stats = getSessionStats(session);
  const insights: SessionInsight[] = [];

  insights.push(...detectPRs(session));
  insights.push(...compareVsAverage(session, stats));
  insights.push(...intensityInsights(stats));
  insights.push(...detectPlateaus(session));
  insights.push(...smartTips(session, stats));

  // Calculate vs average deltas
  const allSessions = sessions.filter((s) => s.completed && s.id !== sessionId);
  const recent = allSessions.slice(-10);
  const avgStats = recent.length > 0
    ? {
        sets: recent.map(getSessionStats).reduce((s, a) => s + a.totalSets, 0) / recent.length,
        volume: recent.map(getSessionStats).reduce((s, a) => s + a.totalVolume, 0) / recent.length,
        duration: recent.map(getSessionStats).reduce((s, a) => s + a.duration, 0) / recent.length,
      }
    : { sets: 0, volume: 0, duration: 0 };

  return {
    sessionId,
    date: session.date,
    workoutName: session.workoutName,
    insights,
    ...stats,
    vsAvg: {
      sets: Math.round(stats.totalSets - avgStats.sets),
      volume: Math.round(stats.totalVolume - avgStats.volume),
      duration: Math.round(stats.duration - avgStats.duration),
    },
  };
}

/** Get the latest completed session analysis */
export function getLatestSessionAnalysis(): SessionAnalysis | null {
  const sessions = getSessions()
    .filter((s) => s.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sessions.length === 0) return null;
  return analyzeSession(sessions[0].id);
}

/** Get training patterns by day of week */
export function getDayPatterns(): DayPattern[] {
  const sessions = getSessions().filter((s) => s.completed);
  const dayData: Record<number, { sets: number[]; volume: number[]; rpe: number[] }> = {};

  for (let i = 0; i < 7; i++) {
    dayData[i] = { sets: [], volume: [], rpe: [] };
  }

  for (const s of sessions) {
    const day = new Date(s.date).getDay();
    const stats = getSessionStats(s);
    dayData[day].sets.push(stats.totalSets);
    dayData[day].volume.push(stats.totalVolume);
    if (stats.avgRpe > 0) dayData[day].rpe.push(stats.avgRpe);
  }

  const patterns: DayPattern[] = [];
  let bestDay = "";
  let bestVolume = 0;

  for (let i = 0; i < 7; i++) {
    const d = dayData[i];
    const count = d.sets.length;
    if (count === 0) {
      patterns.push({ dayName: DAY_NAMES[i], avgSets: 0, avgVolume: 0, avgRpe: 0, sessionCount: 0, isBestDay: false });
      continue;
    }

    const avgVolume = d.volume.reduce((a, b) => a + b, 0) / d.volume.length;
    if (avgVolume > bestVolume) {
      bestVolume = avgVolume;
      bestDay = DAY_NAMES[i];
    }

    patterns.push({
      dayName: DAY_NAMES[i],
      avgSets: Math.round(d.sets.reduce((a, b) => a + b, 0) / count),
      avgVolume: Math.round(avgVolume),
      avgRpe: d.rpe.length > 0 ? Math.round(d.rpe.reduce((a, b) => a + b, 0) / d.rpe.length * 10) / 10 : 0,
      sessionCount: count,
      isBestDay: false,
    });
  }

  // Mark best day
  const best = patterns.find((p) => p.dayName === bestDay);
  if (best) best.isBestDay = true;

  return patterns;
}
