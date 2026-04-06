/**
 * 8.4 — Phase Retrospective
 * Auto-analysis when a training phase ends: completion %, RPE trends,
 * best/worst weeks, muscle breakdown, next-phase recommendations.
 */

import { getSessions, getWeeklyMuscleData, type WorkoutSession } from "./storage";
import { PHASES, getCurrentPhase, getPhaseWeek, getPhaseTotalWeeks, type Phase } from "@/data/phases";
import { calculateFatigue } from "./deload";
import type { MuscleGroup } from "@/data/exercises";

// ── Types ──

export interface WeekSummary {
  weekNum: number;
  weekStart: string;
  sessions: number;
  totalSets: number;
  totalVolume: number;
  avgRpe: number;
}

export interface MusclePhaseData {
  muscle: string;
  totalSets: number;
  avgSetsPerWeek: number;
  topExercise: string;
  topExerciseSets: number;
}

export interface PhaseRetrospective {
  phase: Phase;
  weekCurrent: number;
  weekTotal: number;
  isComplete: boolean;

  // Session stats
  totalSessions: number;
  sessionsPerWeek: number;

  // Volume
  totalSets: number;
  totalVolume: number;
  avgSetsPerSession: number;

  // RPE
  avgRpe: number;
  rpeByWeek: { week: number; rpe: number }[];
  rpeTrend: "ascending" | "stable" | "descending";

  // Weeks
  weeks: WeekSummary[];
  bestWeek: WeekSummary | null;
  worstWeek: WeekSummary | null;

  // Muscles
  muscleBreakdown: MusclePhaseData[];

  // Fatigue
  currentFatigue: number;

  // Recommendations
  recommendations: string[];
}

export interface PhaseComparison {
  phase1: PhaseRetrospective;
  phase2: PhaseRetrospective;
  volumeDelta: number;
  sessionsDelta: number;
  rpeDelta: number;
}

// ── Helpers ──

function getSessionsForPhase(phase: Phase): WorkoutSession[] {
  return getSessions().filter(
    (s) => s.completed && s.date >= phase.startDate && s.date <= phase.endDate
  );
}

function getWeekStart(date: string, phaseStart: string): number {
  const d = new Date(date).getTime();
  const s = new Date(phaseStart).getTime();
  return Math.floor((d - s) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

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

  return {
    totalSets,
    totalVolume,
    avgRpe: rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0,
  };
}

// ── Build Retrospective ──

export function getPhaseRetrospective(phaseId?: number): PhaseRetrospective {
  const phase = phaseId !== undefined
    ? PHASES.find((p) => p.id === phaseId) || getCurrentPhase()
    : getCurrentPhase();

  const sessions = getSessionsForPhase(phase);
  const weekTotal = getPhaseTotalWeeks(phase);
  const weekCurrent = getPhaseWeek(phase);
  const today = new Date().toISOString().slice(0, 10);
  const isComplete = today > phase.endDate;

  // Session stats
  const totalSessions = sessions.length;
  const weeksElapsed = Math.max(1, isComplete ? weekTotal : weekCurrent);
  const sessionsPerWeek = Math.round((totalSessions / weeksElapsed) * 10) / 10;

  // Volume
  let totalSets = 0;
  let totalVolume = 0;
  const allRpes: number[] = [];

  for (const s of sessions) {
    const stats = getSessionStats(s);
    totalSets += stats.totalSets;
    totalVolume += stats.totalVolume;
    if (stats.avgRpe > 0) allRpes.push(stats.avgRpe);
  }

  const avgSetsPerSession = totalSessions > 0 ? Math.round(totalSets / totalSessions) : 0;
  const avgRpe = allRpes.length > 0
    ? Math.round(allRpes.reduce((a, b) => a + b, 0) / allRpes.length * 10) / 10
    : 0;

  // Weekly breakdown
  const weekMap = new Map<number, WorkoutSession[]>();
  for (const s of sessions) {
    const w = getWeekStart(s.date, phase.startDate);
    if (!weekMap.has(w)) weekMap.set(w, []);
    weekMap.get(w)!.push(s);
  }

  const weeks: WeekSummary[] = [];
  const rpeByWeek: { week: number; rpe: number }[] = [];

  for (let w = 1; w <= weeksElapsed; w++) {
    const weekSessions = weekMap.get(w) || [];
    let wSets = 0;
    let wVolume = 0;
    const wRpes: number[] = [];

    for (const s of weekSessions) {
      const stats = getSessionStats(s);
      wSets += stats.totalSets;
      wVolume += stats.totalVolume;
      if (stats.avgRpe > 0) wRpes.push(stats.avgRpe);
    }

    const weekStartDate = new Date(phase.startDate);
    weekStartDate.setDate(weekStartDate.getDate() + (w - 1) * 7);
    const wRpe = wRpes.length > 0 ? Math.round(wRpes.reduce((a, b) => a + b, 0) / wRpes.length * 10) / 10 : 0;

    weeks.push({
      weekNum: w,
      weekStart: weekStartDate.toISOString().slice(0, 10),
      sessions: weekSessions.length,
      totalSets: wSets,
      totalVolume: wVolume,
      avgRpe: wRpe,
    });

    if (wRpe > 0) rpeByWeek.push({ week: w, rpe: wRpe });
  }

  // Best/worst week
  const weeksWithSessions = weeks.filter((w) => w.sessions > 0);
  const bestWeek = weeksWithSessions.length > 0
    ? weeksWithSessions.reduce((best, w) => w.totalVolume > best.totalVolume ? w : best)
    : null;
  const worstWeek = weeksWithSessions.length > 1
    ? weeksWithSessions.reduce((worst, w) => w.totalVolume < worst.totalVolume ? w : worst)
    : null;

  // RPE trend
  let rpeTrend: PhaseRetrospective["rpeTrend"] = "stable";
  if (rpeByWeek.length >= 3) {
    const firstHalf = rpeByWeek.slice(0, Math.floor(rpeByWeek.length / 2));
    const secondHalf = rpeByWeek.slice(Math.floor(rpeByWeek.length / 2));
    const firstAvg = firstHalf.reduce((s, r) => s + r.rpe, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, r) => s + r.rpe, 0) / secondHalf.length;
    if (secondAvg > firstAvg + 0.3) rpeTrend = "ascending";
    else if (secondAvg < firstAvg - 0.3) rpeTrend = "descending";
  }

  // Muscle breakdown
  const muscleSets: Record<string, { total: number; exercises: Record<string, number> }> = {};
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.skipped) continue;
      const working = ex.sets.filter((set) => set.setType !== "warmup").length;
      if (ex.primaryMuscles) {
        for (const m of ex.primaryMuscles) {
          if (!muscleSets[m]) muscleSets[m] = { total: 0, exercises: {} };
          muscleSets[m].total += working;
          muscleSets[m].exercises[ex.name] = (muscleSets[m].exercises[ex.name] || 0) + working;
        }
      }
    }
  }

  const muscleBreakdown: MusclePhaseData[] = Object.entries(muscleSets)
    .map(([muscle, data]) => {
      const topEx = Object.entries(data.exercises).sort((a, b) => b[1] - a[1])[0];
      return {
        muscle,
        totalSets: data.total,
        avgSetsPerWeek: Math.round((data.total / weeksElapsed) * 10) / 10,
        topExercise: topEx?.[0] || "—",
        topExerciseSets: topEx?.[1] || 0,
      };
    })
    .sort((a, b) => b.totalSets - a.totalSets);

  // Fatigue
  const fatigue = calculateFatigue();

  // Recommendations
  const recommendations: string[] = [];

  if (sessionsPerWeek < 3) {
    recommendations.push("Aumentá la frecuencia a 3-4 sesiones/semana para mejores resultados");
  }
  if (avgRpe >= 9 && rpeTrend === "ascending") {
    recommendations.push("RPE subiendo — considerá un deload o bajar volumen en la siguiente fase");
  }
  if (avgRpe < 7 && phase.type !== "deload") {
    recommendations.push("RPE bajo — podés empujar más la intensidad en la próxima fase");
  }
  if (fatigue.overall >= 60) {
    recommendations.push("Fatiga acumulada alta — priorizá un deload antes de intensificar");
  }
  if (muscleBreakdown.length > 0) {
    const topMuscle = muscleBreakdown[0];
    const bottomMuscle = muscleBreakdown[muscleBreakdown.length - 1];
    if (topMuscle.totalSets > bottomMuscle.totalSets * 3) {
      recommendations.push(`Desbalance: ${topMuscle.muscle} (${topMuscle.totalSets} sets) vs ${bottomMuscle.muscle} (${bottomMuscle.totalSets} sets)`);
    }
  }
  if (rpeTrend === "descending") {
    recommendations.push("RPE descendiendo — estás manejando bien la carga, podés progresar más");
  }
  if (recommendations.length === 0) {
    recommendations.push("¡Excelente fase! Mantené la consistencia y progresión");
  }

  return {
    phase,
    weekCurrent,
    weekTotal,
    isComplete,
    totalSessions,
    sessionsPerWeek,
    totalSets,
    totalVolume,
    avgSetsPerSession,
    avgRpe,
    rpeByWeek,
    rpeTrend,
    weeks,
    bestWeek,
    worstWeek,
    muscleBreakdown,
    currentFatigue: fatigue.overall,
    recommendations,
  };
}

/** Compare two phases side by side */
export function comparePhases(phaseId1: number, phaseId2: number): PhaseComparison {
  const phase1 = getPhaseRetrospective(phaseId1);
  const phase2 = getPhaseRetrospective(phaseId2);

  return {
    phase1,
    phase2,
    volumeDelta: phase2.totalVolume - phase1.totalVolume,
    sessionsDelta: phase2.totalSessions - phase1.totalSessions,
    rpeDelta: Math.round((phase2.avgRpe - phase1.avgRpe) * 10) / 10,
  };
}

/** Get all phases with their completion status */
export function getPhasesOverview(): { phase: Phase; sessions: number; isActive: boolean; isFuture: boolean }[] {
  const today = new Date().toISOString().slice(0, 10);
  const current = getCurrentPhase();

  return PHASES.map((phase) => ({
    phase,
    sessions: getSessionsForPhase(phase).length,
    isActive: phase.id === current.id,
    isFuture: phase.startDate > today,
  }));
}
