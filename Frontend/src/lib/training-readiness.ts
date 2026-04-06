/**
 * 8.5 — Training Readiness & Auto-Regulation
 *
 * Unified readiness system that synthesizes ALL data signals
 * (sleep, recovery, fatigue, stress, energy, training load)
 * into one actionable score + personalized daily recommendations.
 */

import {
  getSessions,
  getCheckins,
  getCheckinForDate,
  today,
  type WorkoutSession,
  type DailyCheckin,
  safeGetItem,
  safeSetItem,
} from "./storage";
import { getSmartRecoveryMap, type SmartRecoveryInfo } from "./muscle-recovery";
import { calculateFatigue, getFatigueHistory, type FatigueScore } from "./deload";
import { getSleepAverage, getSleepQualityAvg, calculateSleepDebt } from "./sleep-utils";
import { getCurrentPhase } from "@/data/phases";
import type { MuscleGroup } from "@/data/exercises";

// ── Types ──

export type ReadinessZone = "green" | "yellow" | "orange" | "red";

export interface ReadinessBreakdown {
  sleep: number;       // 0-25
  recovery: number;    // 0-25
  fatigue: number;     // 0-25 (inverted — low fatigue = high score)
  wellness: number;    // 0-25
}

export interface TrainingRecommendation {
  zone: ReadinessZone;
  headline: string;
  detail: string;
  volumeModifier: number;     // e.g. 1.0 = normal, 0.8 = -20%
  intensityModifier: number;  // weight modifier
  rpeTarget: string;          // e.g. "7-8"
  suggestedFocus: string;     // e.g. "Compuestos pesados" or "Accesorios ligeros"
}

export interface ACWRData {
  acuteLoad: number;        // last 7 days total volume (sets × reps × weight)
  chronicLoad: number;      // avg weekly volume over 28 days
  ratio: number;            // acute / chronic
  zone: "undertrained" | "sweet_spot" | "caution" | "danger";
  trend: "increasing" | "stable" | "decreasing";
  weeklyLoads: { weekStart: string; load: number }[];  // last 6 weeks
}

export interface ReadinessReport {
  score: number;                // 0-100
  zone: ReadinessZone;
  breakdown: ReadinessBreakdown;
  recommendation: TrainingRecommendation;
  acwr: ACWRData;
  signals: ReadinessSignal[];   // individual factors summary
  history: { date: string; score: number }[];  // last 14 days
  todayCheckin: boolean;        // whether user has logged today's checkin
}

export interface ReadinessSignal {
  label: string;
  value: string;
  impact: "positive" | "neutral" | "negative";
  icon: string;  // emoji
}

// ── Constants ──

const READINESS_HISTORY_KEY = "mark-pt-readiness-history";

// ── Helpers ──

function getRecentCheckins(days: number): DailyCheckin[] {
  const all = getCheckins();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return all.filter((c) => c.date >= cutoffStr).sort((a, b) => b.date.localeCompare(a.date));
}

function getCompletedSessions(days: number): WorkoutSession[] {
  const all = getSessions();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return all
    .filter((s) => s.completed && s.date >= cutoffStr)
    .sort((a, b) => b.startTime - a.startTime);
}

function sessionVolume(session: WorkoutSession): number {
  let vol = 0;
  for (const ex of session.exercises) {
    if (ex.skipped) continue;
    for (const set of ex.sets) {
      if (set.setType === "warmup") continue;
      vol += (set.weight || 0) * set.reps;
    }
  }
  return vol;
}

function sessionSets(session: WorkoutSession): number {
  let n = 0;
  for (const ex of session.exercises) {
    if (ex.skipped) continue;
    n += ex.sets.filter((s) => s.setType !== "warmup").length;
  }
  return n;
}

function loadReadinessHistory(): { date: string; score: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(READINESS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReadinessHistory(entries: { date: string; score: number }[]) {
  safeSetItem(READINESS_HISTORY_KEY, JSON.stringify(entries.slice(-30)));
}

// ── Sleep Component (0-25) ──

function scoreSleep(): { score: number; signals: ReadinessSignal[] } {
  const signals: ReadinessSignal[] = [];

  const avgHours = getSleepAverage(3);  // last 3 days for responsiveness
  const quality = getSleepQualityAvg(3);
  const debt = calculateSleepDebt(7);

  // Hours score (0-15)
  let hoursScore: number;
  if (avgHours >= 8) hoursScore = 15;
  else if (avgHours >= 7.5) hoursScore = 13;
  else if (avgHours >= 7) hoursScore = 11;
  else if (avgHours >= 6.5) hoursScore = 8;
  else if (avgHours >= 6) hoursScore = 5;
  else hoursScore = 2;

  if (avgHours > 0) {
    signals.push({
      label: "Sueño promedio",
      value: `${avgHours.toFixed(1)}h`,
      impact: avgHours >= 7 ? "positive" : avgHours >= 6 ? "neutral" : "negative",
      icon: "🛏️",
    });
  }

  // Quality score (0-7)
  let qualityScore = 0;
  if (quality > 0) {
    qualityScore = Math.round((quality / 5) * 7);
    signals.push({
      label: "Calidad de sueño",
      value: `${quality.toFixed(1)}/5`,
      impact: quality >= 3.5 ? "positive" : quality >= 2.5 ? "neutral" : "negative",
      icon: "⭐",
    });
  } else {
    qualityScore = 4; // neutral default
  }

  // Debt penalty (0 to -3)
  let debtPenalty = 0;
  if (debt > 5) debtPenalty = -3;
  else if (debt > 3) debtPenalty = -2;
  else if (debt > 1) debtPenalty = -1;

  const score = Math.max(0, Math.min(25, hoursScore + qualityScore + debtPenalty));
  return { score, signals };
}

// ── Recovery Component (0-25) ──

function scoreRecovery(): { score: number; signals: ReadinessSignal[] } {
  const signals: ReadinessSignal[] = [];
  const recoveryMap = getSmartRecoveryMap();

  // Get only muscles that have been trained
  const trainedMuscles: { muscle: string; info: SmartRecoveryInfo }[] = [];
  for (const [muscle, info] of Object.entries(recoveryMap)) {
    if (info.hoursSince !== null) {
      trainedMuscles.push({ muscle, info });
    }
  }

  if (trainedMuscles.length === 0) {
    return {
      score: 25,
      signals: [{ label: "Recuperación", value: "100%", impact: "positive", icon: "💪" }],
    };
  }

  // Average recovery percentage
  const avgRecovery = trainedMuscles.reduce((s, m) => s + m.info.recoveryPct, 0) / trainedMuscles.length;

  // Count muscles in bad shape
  const fatigued = trainedMuscles.filter((m) => m.info.recoveryPct < 60);
  const recovering = trainedMuscles.filter((m) => m.info.recoveryPct >= 60 && m.info.recoveryPct < 85);

  // Score: map 0-100% recovery → 0-25 pts
  let score = Math.round((avgRecovery / 100) * 22);

  // Bonus/penalty for distribution
  if (fatigued.length === 0) score = Math.min(25, score + 3);
  else if (fatigued.length >= 5) score = Math.max(0, score - 3);

  signals.push({
    label: "Recuperación muscular",
    value: `${Math.round(avgRecovery)}%`,
    impact: avgRecovery >= 80 ? "positive" : avgRecovery >= 60 ? "neutral" : "negative",
    icon: "💪",
  });

  if (fatigued.length > 0) {
    signals.push({
      label: "Músculos fatigados",
      value: `${fatigued.length}`,
      impact: "negative",
      icon: "🔴",
    });
  }

  return { score: Math.max(0, Math.min(25, score)), signals };
}

// ── Fatigue Component (0-25, inverted) ──

function scoreFatigue(): { score: number; signals: ReadinessSignal[]; fatigueData: FatigueScore } {
  const signals: ReadinessSignal[] = [];
  const fatigue = calculateFatigue();

  // Invert: low fatigue = high readiness
  // fatigue.overall is 0-100 (0=fresh, 100=overtrained)
  // We want: fresh → 25pts, critical → 0pts
  const score = Math.round((1 - fatigue.overall / 100) * 25);

  const levelLabels: Record<FatigueScore["level"], string> = {
    fresh: "Fresco",
    managed: "Controlada",
    accumulating: "Acumulándose",
    high: "Alta",
    critical: "Crítica",
  };

  signals.push({
    label: "Fatiga acumulada",
    value: levelLabels[fatigue.level],
    impact: fatigue.overall <= 25 ? "positive" : fatigue.overall <= 50 ? "neutral" : "negative",
    icon: "🔋",
  });

  if (fatigue.musclesOverMrv.length > 0) {
    signals.push({
      label: "Sobre MRV",
      value: `${fatigue.musclesOverMrv.length} músculos`,
      impact: "negative",
      icon: "⚠️",
    });
  }

  return { score: Math.max(0, Math.min(25, score)), signals, fatigueData: fatigue };
}

// ── Wellness Component (0-25) ──

function scoreWellness(): { score: number; signals: ReadinessSignal[] } {
  const signals: ReadinessSignal[] = [];
  const todayCheckin = getCheckinForDate(today());
  const recent = getRecentCheckins(3);

  // Energy (0-10)
  let energyScore = 5; // neutral default
  if (recent.length > 0) {
    const avgEnergy = recent.reduce((s, c) => s + c.energy, 0) / recent.length;
    energyScore = Math.round((avgEnergy / 5) * 10);
    signals.push({
      label: "Energía",
      value: `${avgEnergy.toFixed(1)}/5`,
      impact: avgEnergy >= 3.5 ? "positive" : avgEnergy >= 2.5 ? "neutral" : "negative",
      icon: "⚡",
    });
  }

  // Soreness (0-8, inverted: 0 soreness = 8 pts)
  let sorenessScore = 5;
  if (recent.length > 0) {
    const avgSoreness = recent.reduce((s, c) => s + c.soreness, 0) / recent.length;
    sorenessScore = Math.round((1 - avgSoreness / 3) * 8);
    signals.push({
      label: "Dolor muscular",
      value: avgSoreness <= 0.5 ? "Mínimo" : avgSoreness <= 1.5 ? "Moderado" : "Alto",
      impact: avgSoreness <= 0.5 ? "positive" : avgSoreness <= 1.5 ? "neutral" : "negative",
      icon: "🩹",
    });
  }

  // Stress (0-7, inverted: 1 stress = 7 pts)
  let stressScore = 4;
  const withStress = recent.filter((c) => c.stress !== undefined);
  if (withStress.length > 0) {
    const avgStress = withStress.reduce((s, c) => s + (c.stress || 3), 0) / withStress.length;
    stressScore = Math.round((1 - (avgStress - 1) / 4) * 7);
    signals.push({
      label: "Estrés",
      value: avgStress <= 2 ? "Bajo" : avgStress <= 3 ? "Moderado" : "Alto",
      impact: avgStress <= 2 ? "positive" : avgStress <= 3 ? "neutral" : "negative",
      icon: "🧠",
    });
  }

  // Today's checkin bonus
  if (todayCheckin) {
    // Use today's data directly for extra responsiveness
    const todayEnergy = todayCheckin.energy;
    if (todayEnergy <= 2) {
      energyScore = Math.max(0, energyScore - 2);
    } else if (todayEnergy >= 4) {
      energyScore = Math.min(10, energyScore + 1);
    }
  }

  const score = Math.max(0, Math.min(25, energyScore + sorenessScore + stressScore));
  return { score, signals };
}

// ── ACWR Calculation ──

function calculateACWR(): ACWRData {
  const sessions = getCompletedSessions(42); // 6 weeks
  const now = new Date();

  // Build weekly loads (last 6 weeks, starting from Monday)
  const weeklyLoads: { weekStart: string; load: number }[] = [];
  for (let w = 0; w < 6; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);

    const weekSessions = sessions.filter((s) => s.date >= startStr && s.date <= endStr);
    const load = weekSessions.reduce((sum, s) => sum + sessionVolume(s), 0);

    weeklyLoads.push({
      weekStart: startStr,
      load: Math.round(load),
    });
  }

  weeklyLoads.reverse(); // oldest first

  // Acute load: most recent week (index 5)
  const acuteLoad = weeklyLoads.length > 0 ? weeklyLoads[weeklyLoads.length - 1].load : 0;

  // Chronic load: average of weeks 1-4 (indices 1-4, excluding current week)
  const chronicWeeks = weeklyLoads.slice(0, -1).filter((w) => w.load > 0);
  const chronicLoad = chronicWeeks.length > 0
    ? Math.round(chronicWeeks.reduce((s, w) => s + w.load, 0) / chronicWeeks.length)
    : 0;

  // Ratio
  const ratio = chronicLoad > 0 ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : 1.0;

  // Zone classification
  let zone: ACWRData["zone"];
  if (ratio < 0.8) zone = "undertrained";
  else if (ratio <= 1.3) zone = "sweet_spot";
  else if (ratio <= 1.5) zone = "caution";
  else zone = "danger";

  // Trend (compare last 2 weeks)
  let trend: ACWRData["trend"] = "stable";
  if (weeklyLoads.length >= 2) {
    const curr = weeklyLoads[weeklyLoads.length - 1].load;
    const prev = weeklyLoads[weeklyLoads.length - 2].load;
    if (prev > 0) {
      const change = (curr - prev) / prev;
      if (change > 0.1) trend = "increasing";
      else if (change < -0.1) trend = "decreasing";
    }
  }

  return { acuteLoad, chronicLoad, ratio, zone, trend, weeklyLoads };
}

// ── Recommendation Engine ──

function buildRecommendation(score: number, acwr: ACWRData): TrainingRecommendation {
  const phase = getCurrentPhase();
  const isDeloadPhase = phase?.type === "deload";

  // Override for deload phases
  if (isDeloadPhase) {
    return {
      zone: "yellow",
      headline: "Semana de Descarga",
      detail: "Estás en fase de deload. Reducí peso al 60% y enfocate en técnica y movilidad.",
      volumeModifier: 0.6,
      intensityModifier: 0.6,
      rpeTarget: "5-6",
      suggestedFocus: "Técnica y movilidad",
    };
  }

  if (score >= 80) {
    return {
      zone: "green",
      headline: "Listo para entrenar fuerte",
      detail: "Recuperación óptima, fatiga baja. Podés empujar la intensidad y buscar PRs.",
      volumeModifier: 1.0,
      intensityModifier: 1.0,
      rpeTarget: "8-9",
      suggestedFocus: "Compuestos pesados, progresión",
    };
  }

  if (score >= 65) {
    return {
      zone: "green",
      headline: "Buen estado — entrenamiento normal",
      detail: "Todo en orden. Seguí el plan de entrenamiento con intensidad moderada-alta.",
      volumeModifier: 1.0,
      intensityModifier: 0.95,
      rpeTarget: "7-8.5",
      suggestedFocus: "Plan normal, buena técnica",
    };
  }

  if (score >= 50) {
    return {
      zone: "yellow",
      headline: "Moderá la intensidad",
      detail: "Algo de fatiga acumulada. Reducí el peso un 5-10% y priorizá calidad sobre cantidad.",
      volumeModifier: 0.9,
      intensityModifier: 0.9,
      rpeTarget: "6-7.5",
      suggestedFocus: "Volumen moderado, técnica",
    };
  }

  if (score >= 35) {
    return {
      zone: "orange",
      headline: "Sesión liviana recomendada",
      detail: "Fatiga o recuperación insuficiente. Hacé una sesión ligera con accesorios o movilidad.",
      volumeModifier: 0.7,
      intensityModifier: 0.75,
      rpeTarget: "5-6.5",
      suggestedFocus: "Accesorios ligeros, pump",
    };
  }

  // score < 35
  return {
    zone: "red",
    headline: "Descanso activo recomendado",
    detail: "Tu cuerpo necesita recuperar. Priorizá sueño, nutrición y movilidad. Evitá pesos pesados.",
    volumeModifier: 0.5,
    intensityModifier: 0.5,
    rpeTarget: "4-5",
    suggestedFocus: "Movilidad, estiramientos, caminata",
  };
}

// ── Main API ──

export function getReadinessReport(): ReadinessReport {
  const sleepResult = scoreSleep();
  const recoveryResult = scoreRecovery();
  const fatigueResult = scoreFatigue();
  const wellnessResult = scoreWellness();

  const breakdown: ReadinessBreakdown = {
    sleep: sleepResult.score,
    recovery: recoveryResult.score,
    fatigue: fatigueResult.score,
    wellness: wellnessResult.score,
  };

  const score = Math.min(100, breakdown.sleep + breakdown.recovery + breakdown.fatigue + breakdown.wellness);

  let zone: ReadinessZone;
  if (score >= 65) zone = "green";
  else if (score >= 50) zone = "yellow";
  else if (score >= 35) zone = "orange";
  else zone = "red";

  const acwr = calculateACWR();

  // ACWR can adjust zone downward
  if (acwr.zone === "danger" && zone === "green") zone = "yellow";
  if (acwr.zone === "danger" && zone === "yellow") zone = "orange";

  const recommendation = buildRecommendation(score, acwr);

  // Check if today has checkin
  const todayCheckin = !!getCheckinForDate(today());

  // Aggregate all signals
  const signals: ReadinessSignal[] = [
    ...sleepResult.signals,
    ...recoveryResult.signals,
    ...fatigueResult.signals,
    ...wellnessResult.signals,
  ];

  // Add ACWR signal
  const acwrLabels: Record<ACWRData["zone"], string> = {
    undertrained: "Bajo",
    sweet_spot: "Óptimo",
    caution: "Precaución",
    danger: "Peligro",
  };
  signals.push({
    label: "Carga de entrenamiento",
    value: `${acwr.ratio.toFixed(2)} (${acwrLabels[acwr.zone]})`,
    impact: acwr.zone === "sweet_spot" ? "positive" : acwr.zone === "undertrained" ? "neutral" : "negative",
    icon: "📊",
  });

  // Add phase signal
  const phase = getCurrentPhase();
  if (phase) {
    signals.push({
      label: "Fase actual",
      value: phase.name,
      impact: "neutral",
      icon: "📅",
    });
  }

  // Persist to history
  const todayStr = today();
  const history = loadReadinessHistory().filter((h) => h.date !== todayStr);
  history.push({ date: todayStr, score });
  saveReadinessHistory(history);

  return {
    score,
    zone,
    breakdown,
    recommendation,
    acwr,
    signals,
    history: history.slice(-14).sort((a, b) => a.date.localeCompare(b.date)),
    todayCheckin,
  };
}

// ── Zone Helpers ──

export function getZoneColor(zone: ReadinessZone): string {
  const colors: Record<ReadinessZone, string> = {
    green: "#34C759",
    yellow: "#FFD60A",
    orange: "#FF9500",
    red: "#FF3B30",
  };
  return colors[zone];
}

export function getZoneLabel(zone: ReadinessZone): string {
  const labels: Record<ReadinessZone, string> = {
    green: "Óptimo",
    yellow: "Moderado",
    orange: "Precaución",
    red: "Descanso",
  };
  return labels[zone];
}

export function getACWRZoneColor(zone: ACWRData["zone"]): string {
  const colors: Record<ACWRData["zone"], string> = {
    undertrained: "#4F8CFF",
    sweet_spot: "#34C759",
    caution: "#FF9500",
    danger: "#FF3B30",
  };
  return colors[zone];
}
