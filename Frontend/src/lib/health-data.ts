// =============================================
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/storage";
// Health data types, storage, and recovery score
// Cached locally from Google Fit / Health Connect
// =============================================

export interface HealthSnapshot {
  date: string; // YYYY-MM-DD
  steps?: number;
  distance?: number; // meters
  caloriesBurned?: number;
  restingHeartRate?: number; // bpm
  avgHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  sleepMinutes?: number;
  sleepStages?: {
    deep: number; // minutes
    light: number;
    rem: number;
    awake: number;
  };
  spo2?: number; // 0-100
  stress?: number; // 1-100 (derived)
  activeMinutes?: number;
  syncedAt: number; // timestamp
}

export interface HealthSummary {
  today: HealthSnapshot | null;
  weekAvg: {
    steps: number;
    sleep: number;
    restingHR: number;
    activeMinutes: number;
  };
  recoveryScore: number; // 0-100
  recoveryLabel: "poor" | "fair" | "good" | "excellent";
}

export interface GoogleFitAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // timestamp
  email?: string;
}

// ── Storage keys ──
const HEALTH_CACHE_KEY = "mark-pt-health-cache";
const GFIT_AUTH_KEY = "mark-pt-gfit-auth";
const GFIT_LAST_SYNC_KEY = "mark-pt-gfit-last-sync";

// ── Auth storage ──

export function saveGoogleFitAuth(auth: GoogleFitAuth): void {
  safeSetItem(GFIT_AUTH_KEY, JSON.stringify(auth));
}

export function getGoogleFitAuth(): GoogleFitAuth | null {
  try {
    const raw = safeGetItem(GFIT_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearGoogleFitAuth(): void {
  safeRemoveItem(GFIT_AUTH_KEY);
  safeRemoveItem(GFIT_LAST_SYNC_KEY);
}

export function isGoogleFitConnected(): boolean {
  const auth = getGoogleFitAuth();
  return auth !== null && auth.accessToken.length > 0;
}

// ── Health data cache ──

function getHealthCache(): Record<string, HealthSnapshot> {
  try {
    const raw = safeGetItem(HEALTH_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveHealthCache(cache: Record<string, HealthSnapshot>): void {
  safeSetItem(HEALTH_CACHE_KEY, JSON.stringify(cache));
}

export function cacheHealthData(snapshot: HealthSnapshot): void {
  const cache = getHealthCache();
  cache[snapshot.date] = snapshot;
  // Keep only last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  for (const key of Object.keys(cache)) {
    if (key < cutoffStr) delete cache[key];
  }
  saveHealthCache(cache);
}

export function getHealthForDate(date: string): HealthSnapshot | null {
  const cache = getHealthCache();
  return cache[date] || null;
}

export function getHealthForRange(startDate: string, endDate: string): HealthSnapshot[] {
  const cache = getHealthCache();
  return Object.values(cache)
    .filter((s) => s.date >= startDate && s.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Sync tracking ──

export function getLastSyncDate(): string | null {
  return safeGetItem(GFIT_LAST_SYNC_KEY);
}

export function setLastSyncDate(iso: string): void {
  safeSetItem(GFIT_LAST_SYNC_KEY, iso);
}

// ── Recovery Score ──
// Composite 0-100 based on sleep + resting HR + activity + soreness

export function calculateRecoveryScore(snapshot: HealthSnapshot | null, sleepHours?: number, soreness?: number): { score: number; label: "poor" | "fair" | "good" | "excellent" } {
  if (!snapshot && !sleepHours) return { score: 50, label: "fair" };

  let total = 0;
  let factors = 0;

  // Sleep score (0-30 pts) — 7-9h optimal
  const sleep = snapshot?.sleepMinutes ? snapshot.sleepMinutes / 60 : (sleepHours || 0);
  if (sleep > 0) {
    const sleepScore = sleep >= 7 && sleep <= 9 ? 30 : sleep >= 6 ? 20 : sleep >= 5 ? 10 : 5;
    total += sleepScore;
    factors++;
  }

  // Deep sleep bonus (0-10 pts)
  if (snapshot?.sleepStages?.deep) {
    const deepPct = snapshot.sleepStages.deep / (snapshot.sleepMinutes || 1);
    total += deepPct >= 0.2 ? 10 : deepPct >= 0.15 ? 7 : 4;
    factors++;
  }

  // Resting HR (0-25 pts) — lower is better
  if (snapshot?.restingHeartRate) {
    const rhr = snapshot.restingHeartRate;
    const hrScore = rhr < 55 ? 25 : rhr < 60 ? 22 : rhr < 65 ? 18 : rhr < 70 ? 14 : rhr < 80 ? 10 : 5;
    total += hrScore;
    factors++;
  }

  // Activity (0-15 pts) — some but not excessive
  if (snapshot?.activeMinutes !== undefined) {
    const am = snapshot.activeMinutes;
    const actScore = am >= 30 && am <= 90 ? 15 : am >= 15 ? 12 : am > 120 ? 8 : 5;
    total += actScore;
    factors++;
  }

  // Soreness penalty (0-20 pts inverted)
  if (soreness !== undefined) {
    const soreScore = [20, 15, 8, 3][soreness] ?? 10;
    total += soreScore;
    factors++;
  }

  // Normalize to 0-100
  const maxPossible = factors === 0 ? 1 : (
    (factors >= 1 ? 30 : 0) + // sleep
    (snapshot?.sleepStages?.deep ? 10 : 0) + // deep sleep
    (snapshot?.restingHeartRate ? 25 : 0) + // resting HR
    (snapshot?.activeMinutes !== undefined ? 15 : 0) + // activity
    (soreness !== undefined ? 20 : 0) // soreness
  );

  const score = Math.round((total / maxPossible) * 100);
  const label = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "poor";

  return { score, label };
}

// ── Health summary builder ──

export function getHealthSummary(todayStr: string, sleepHours?: number, soreness?: number): HealthSummary {
  const today = getHealthForDate(todayStr);

  // Last 7 days
  const weekStart = new Date(todayStr + "T00:00:00");
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekData = getHealthForRange(weekStartStr, todayStr);

  const validSteps = weekData.filter((d) => d.steps !== undefined);
  const validSleep = weekData.filter((d) => d.sleepMinutes !== undefined);
  const validHR = weekData.filter((d) => d.restingHeartRate !== undefined);
  const validActive = weekData.filter((d) => d.activeMinutes !== undefined);

  const weekAvg = {
    steps: validSteps.length > 0 ? Math.round(validSteps.reduce((s, d) => s + (d.steps || 0), 0) / validSteps.length) : 0,
    sleep: validSleep.length > 0 ? Math.round(validSleep.reduce((s, d) => s + (d.sleepMinutes || 0), 0) / validSleep.length / 60 * 10) / 10 : 0,
    restingHR: validHR.length > 0 ? Math.round(validHR.reduce((s, d) => s + (d.restingHeartRate || 0), 0) / validHR.length) : 0,
    activeMinutes: validActive.length > 0 ? Math.round(validActive.reduce((s, d) => s + (d.activeMinutes || 0), 0) / validActive.length) : 0,
  };

  const { score, label } = calculateRecoveryScore(today, sleepHours, soreness);

  return {
    today,
    weekAvg,
    recoveryScore: score,
    recoveryLabel: label,
  };
}
