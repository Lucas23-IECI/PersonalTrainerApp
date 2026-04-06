/**
 * 8.2 — Predictive Analytics & Forecasting
 * Linear regression trendlines, E1RM projections,
 * goal-based "on track" indicators, milestone estimates.
 */

import { getSessions, type WorkoutSession, type LoggedSet } from "./storage";
import { getExerciseHistory } from "./progression";

// ── Types ──

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendLine {
  slope: number;     // change per day
  intercept: number;
  r2: number;        // coefficient of determination (0-1)
  points: TrendPoint[];
  forecast: TrendPoint[];  // next 30 days projected
}

export interface ExerciseForecast {
  exercise: string;
  currentE1rm: number;
  trendLine: TrendLine;
  weeklyGain: number;      // kg/week average
  goalWeight?: number;
  weeksToGoal?: number;    // estimated weeks to hit goal
  status: "on_track" | "ahead" | "behind" | "stagnant" | "insufficient_data";
  statusLabel: string;
}

export interface VolumeForcast {
  weeklyTrend: TrendLine;
  avgSetsPerWeek: number;
  projectedNextWeek: number;
}

export interface PredictiveReport {
  exercises: ExerciseForecast[];
  volumeTrend: VolumeForcast;
  milestones: Milestone[];
  overallTrend: "improving" | "stable" | "declining";
}

export interface Milestone {
  exercise: string;
  target: number;
  label: string;
  estimatedDate: string | null;
  weeksAway: number | null;
}

// ── Linear Regression ──

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const yMean = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const p of points) {
    const predicted = slope * p.x + intercept;
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

function dateToDay(dateStr: string, baseDate: string): number {
  return (new Date(dateStr).getTime() - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24);
}

function dayToDate(day: number, baseDate: string): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + day);
  return d.toISOString().slice(0, 10);
}

// ── E1RM Calculation ──

function calcE1rm(set: LoggedSet): number {
  const w = set.weight || 0;
  const r = set.reps;
  if (w <= 0 || r <= 0) return 0;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

function bestE1rmFromSets(sets: LoggedSet[]): number {
  return Math.max(0, ...sets.map(calcE1rm));
}

// ── Build Trend Line ──

function buildTrendLine(dataPoints: TrendPoint[], forecastDays: number = 30): TrendLine {
  if (dataPoints.length === 0) {
    return { slope: 0, intercept: 0, r2: 0, points: [], forecast: [] };
  }

  const baseDate = dataPoints[0].date;
  const regPoints = dataPoints.map((p) => ({ x: dateToDay(p.date, baseDate), y: p.value }));
  const { slope, intercept, r2 } = linearRegression(regPoints);

  const lastDay = regPoints[regPoints.length - 1].x;
  const forecast: TrendPoint[] = [];
  for (let d = 1; d <= forecastDays; d += 7) {
    const futureDay = lastDay + d;
    forecast.push({
      date: dayToDate(Math.round(futureDay), baseDate),
      value: Math.round((slope * futureDay + intercept) * 10) / 10,
    });
  }

  return { slope, intercept, r2, points: dataPoints, forecast };
}

// ── Exercise Forecast ──

/** Standard milestones for common exercises (kg) */
const COMMON_MILESTONES: Record<string, number[]> = {
  "Press Banca": [60, 80, 100, 120, 140],
  "Sentadilla": [80, 100, 120, 140, 160, 180],
  "Peso Muerto": [100, 120, 140, 160, 180, 200],
  "Press Militar": [40, 50, 60, 70, 80],
  "Dominadas": [10, 15, 20, 25],
  "Remo con Barra": [60, 80, 100, 120],
};

export function getExerciseForecast(exerciseName: string, goalWeight?: number): ExerciseForecast {
  const history = getExerciseHistory(exerciseName, 20);

  if (history.length < 3) {
    return {
      exercise: exerciseName,
      currentE1rm: history.length > 0 ? bestE1rmFromSets(history[0].sets) : 0,
      trendLine: buildTrendLine([]),
      weeklyGain: 0,
      status: "insufficient_data",
      statusLabel: "Necesitás 3+ sesiones para ver predicciones",
    };
  }

  // Build E1RM datapoints (reversed for chronological order)
  const dataPoints: TrendPoint[] = history
    .map((h) => ({ date: h.date, value: bestE1rmFromSets(h.sets) }))
    .filter((p) => p.value > 0)
    .reverse();

  if (dataPoints.length < 2) {
    return {
      exercise: exerciseName,
      currentE1rm: 0,
      trendLine: buildTrendLine([]),
      weeklyGain: 0,
      status: "insufficient_data",
      statusLabel: "Datos insuficientes",
    };
  }

  const trendLine = buildTrendLine(dataPoints, 60);
  const currentE1rm = dataPoints[dataPoints.length - 1].value;
  const weeklyGain = Math.round(trendLine.slope * 7 * 10) / 10;

  let status: ExerciseForecast["status"];
  let statusLabel: string;
  let weeksToGoal: number | undefined;

  if (goalWeight && goalWeight > currentE1rm && weeklyGain > 0) {
    const remaining = goalWeight - currentE1rm;
    weeksToGoal = Math.ceil(remaining / weeklyGain);

    if (weeksToGoal <= 8) {
      status = "ahead";
      statusLabel = `Alcanzás ${goalWeight}kg en ~${weeksToGoal} semanas`;
    } else {
      status = "on_track";
      statusLabel = `Estimado: ${weeksToGoal} semanas para ${goalWeight}kg`;
    }
  } else if (weeklyGain > 0.3) {
    status = "on_track";
    statusLabel = `+${weeklyGain}kg/semana — excelente progreso`;
  } else if (weeklyGain >= 0) {
    status = "stagnant";
    statusLabel = weeklyGain > 0 ? `+${weeklyGain}kg/semana — progreso lento` : "Estancado — considerá cambiar estímulo";
  } else {
    status = "behind";
    statusLabel = `${weeklyGain}kg/semana — tendencia negativa`;
  }

  return {
    exercise: exerciseName,
    currentE1rm,
    trendLine,
    weeklyGain,
    goalWeight,
    weeksToGoal,
    status,
    statusLabel,
  };
}

// ── Volume Trend ──

function getWeeklyVolumes(): TrendPoint[] {
  const sessions = getSessions().filter((s) => s.completed);
  if (sessions.length === 0) return [];

  // Group sessions by week (Monday start)
  const weekMap = new Map<string, number>();

  for (const s of sessions) {
    const d = new Date(s.date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().slice(0, 10);

    let sets = 0;
    for (const ex of s.exercises) {
      if (!ex.skipped) sets += ex.sets.filter((set) => set.setType !== "warmup").length;
    }
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + sets);
  }

  return Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12) // last 12 weeks
    .map(([date, value]) => ({ date, value }));
}

// ── Milestones ──

function generateMilestones(sessions: WorkoutSession[]): Milestone[] {
  const milestones: Milestone[] = [];
  const exerciseNames = new Set<string>();

  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (!ex.skipped && ex.sets.length > 0) exerciseNames.add(ex.name);
    }
  }

  for (const name of exerciseNames) {
    const targets = COMMON_MILESTONES[name];
    if (!targets) continue;

    const forecast = getExerciseForecast(name);
    if (forecast.status === "insufficient_data") continue;

    // Find next milestone above current E1RM
    const nextTarget = targets.find((t) => t > forecast.currentE1rm);
    if (!nextTarget) continue;

    let estimatedDate: string | null = null;
    let weeksAway: number | null = null;

    if (forecast.weeklyGain > 0) {
      const remaining = nextTarget - forecast.currentE1rm;
      weeksAway = Math.ceil(remaining / forecast.weeklyGain);
      const d = new Date();
      d.setDate(d.getDate() + weeksAway * 7);
      estimatedDate = d.toISOString().slice(0, 10);
    }

    milestones.push({
      exercise: name,
      target: nextTarget,
      label: `${name} → ${nextTarget}kg e1RM`,
      estimatedDate,
      weeksAway,
    });
  }

  return milestones.sort((a, b) => (a.weeksAway ?? 999) - (b.weeksAway ?? 999));
}

// ── Main API ──

export function getPredictiveReport(): PredictiveReport {
  const sessions = getSessions().filter((s) => s.completed);

  // Get forecasts for exercises with enough data
  const exerciseNames = new Set<string>();
  const recent = sessions.slice(-50); // last 50 sessions
  for (const s of recent) {
    for (const ex of s.exercises) {
      if (!ex.skipped && ex.sets.length > 0) exerciseNames.add(ex.name);
    }
  }

  const exercises: ExerciseForecast[] = [];
  for (const name of exerciseNames) {
    const forecast = getExerciseForecast(name);
    if (forecast.status !== "insufficient_data") {
      exercises.push(forecast);
    }
  }
  exercises.sort((a, b) => b.weeklyGain - a.weeklyGain);

  // Volume trend
  const weeklyVolumes = getWeeklyVolumes();
  const volumeTrend: VolumeForcast = {
    weeklyTrend: buildTrendLine(weeklyVolumes),
    avgSetsPerWeek: weeklyVolumes.length > 0
      ? Math.round(weeklyVolumes.reduce((s, p) => s + p.value, 0) / weeklyVolumes.length)
      : 0,
    projectedNextWeek: weeklyVolumes.length > 0
      ? Math.round(buildTrendLine(weeklyVolumes).forecast[0]?.value ?? 0)
      : 0,
  };

  // Milestones
  const milestones = generateMilestones(sessions);

  // Overall trend
  const improving = exercises.filter((e) => e.weeklyGain > 0.3).length;
  const declining = exercises.filter((e) => e.weeklyGain < -0.3).length;
  const overallTrend = improving > declining ? "improving" : declining > improving ? "declining" : "stable";

  return { exercises, volumeTrend, milestones, overallTrend };
}
