import { getCheckins, getSettings, type DailyCheckin } from "./storage";

/**
 * Calculate hours slept from bedtime → wakeTime (handles overnight).
 */
export function calculateSleepHours(bedtime: string, wakeTime: string): number {
  const [bH, bM] = bedtime.split(":").map(Number);
  const [wH, wM] = wakeTime.split(":").map(Number);
  let bedMin = bH * 60 + bM;
  let wakeMin = wH * 60 + wM;
  if (wakeMin <= bedMin) wakeMin += 24 * 60; // overnight
  const diff = (wakeMin - bedMin) / 60;
  return Math.round(diff * 2) / 2; // round to nearest 0.5
}

/**
 * Sleep debt over last N days (rolling window).
 * Positive = debt (under-slept), negative = surplus.
 */
export function calculateSleepDebt(days = 7): number {
  const goal = getSettings().sleepGoal;
  const checkins = getRecentCheckins(days);
  if (checkins.length === 0) return 0;

  let debt = 0;
  for (const c of checkins) {
    const hours = c.sleepHours || 0;
    debt += goal - hours;
  }
  return Math.round(debt * 10) / 10;
}

/**
 * Percentage of days that met sleepGoal in the last N days.
 */
export function getSleepConsistency(days = 30): number {
  const goal = getSettings().sleepGoal;
  const checkins = getRecentCheckins(days);
  if (checkins.length === 0) return 0;
  const met = checkins.filter((c) => (c.sleepHours || 0) >= goal).length;
  return Math.round((met / checkins.length) * 100);
}

/**
 * Average sleep hours over last N days.
 */
export function getSleepAverage(days = 7): number {
  const checkins = getRecentCheckins(days);
  if (checkins.length === 0) return 0;
  const total = checkins.reduce((s, c) => s + (c.sleepHours || 0), 0);
  return Math.round((total / checkins.length) * 10) / 10;
}

/**
 * Average sleep quality over last N days (1-5 scale).
 */
export function getSleepQualityAvg(days = 7): number {
  const checkins = getRecentCheckins(days).filter((c) => c.sleepQuality);
  if (checkins.length === 0) return 0;
  const total = checkins.reduce((s, c) => s + (c.sleepQuality || 0), 0);
  return Math.round((total / checkins.length) * 10) / 10;
}

/**
 * Smart sleep tips based on recent patterns.
 */
export function getSleepTips(recentDays = 14): string[] {
  const checkins = getRecentCheckins(recentDays);
  const tips: string[] = [];
  const goal = getSettings().sleepGoal;

  if (checkins.length < 3) {
    tips.push("Registrá tu sueño varios días para obtener recomendaciones personalizadas.");
    return tips;
  }

  const avg = checkins.reduce((s, c) => s + (c.sleepHours || 0), 0) / checkins.length;

  // Check if they sleep less on certain days
  const byDow = new Map<number, number[]>();
  for (const c of checkins) {
    const dow = new Date(c.date + "T00:00:00").getDay();
    if (!byDow.has(dow)) byDow.set(dow, []);
    byDow.get(dow)!.push(c.sleepHours || 0);
  }

  const dayNames = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
  for (const [dow, hours] of byDow) {
    const dayAvg = hours.reduce((a, b) => a + b, 0) / hours.length;
    if (dayAvg < avg - 0.75 && hours.length >= 2) {
      tips.push(`Dormís ~${Math.round((avg - dayAvg) * 10) / 10}h menos los ${dayNames[dow]}. Intentá acostarte más temprano.`);
    }
  }

  // Average below goal
  if (avg < goal - 0.5) {
    tips.push(`Tu promedio es ${avg.toFixed(1)}h — te faltan ~${(goal - avg).toFixed(1)}h por noche para tu meta de ${goal}h.`);
  }

  // Inconsistency
  const hours = checkins.map((c) => c.sleepHours || 0);
  const stdDev = Math.sqrt(hours.reduce((s, h) => s + Math.pow(h - avg, 2), 0) / hours.length);
  if (stdDev > 1.2) {
    tips.push("Tu horario de sueño es muy variable. La consistencia mejora la calidad del descanso.");
  }

  // Late bedtimes
  const lateBedtimes = checkins.filter((c) => {
    if (!c.bedtime) return false;
    const [h] = c.bedtime.split(":").map(Number);
    return h >= 0 && h <= 3; // after midnight
  });
  if (lateBedtimes.length >= checkins.length * 0.3) {
    tips.push("Te acostás después de medianoche frecuentemente. Dormir antes de las 00:00 mejora la recuperación muscular.");
  }

  // Good quality
  const qualityCheckins = checkins.filter((c) => c.sleepQuality);
  if (qualityCheckins.length >= 3) {
    const avgQ = qualityCheckins.reduce((s, c) => s + (c.sleepQuality || 0), 0) / qualityCheckins.length;
    if (avgQ >= 4) {
      tips.push("Tu calidad de sueño es buena. ¡Seguí así! 💪");
    } else if (avgQ <= 2.5) {
      tips.push("Tu calidad de sueño es baja. Probá reducir pantallas 1h antes de dormir y mantener la habitación fresca.");
    }
  }

  // Surplus
  if (avg >= goal) {
    tips.push(`Estás cumpliendo tu meta de ${goal}h. Excelente para la recuperación muscular.`);
  }

  return tips.slice(0, 3); // max 3 tips
}

// ─── Helpers ──────────────────────────────────────

function getRecentCheckins(days: number): DailyCheckin[] {
  const all = getCheckins();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return all
    .filter((c) => c.date >= cutoffStr && (c.sleepHours || 0) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const QUALITY_EMOJIS = ["", "😫", "😐", "😊", "😴", "🌟"];
export const QUALITY_LABELS = ["", "Pésimo", "Malo", "Normal", "Bueno", "Excelente"];

export const BEDTIME_PRESETS = [
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "00:00", "00:30", "01:00", "01:30", "02:00",
];

export const WAKE_PRESETS = [
  "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00",
];
