// =============================================
// Google Fit REST API integration
// OAuth + data fetching via fitness.googleapis.com
// =============================================

import { isNative } from "./native";
import {
  type HealthSnapshot,
  type GoogleFitAuth,
  saveGoogleFitAuth,
  getGoogleFitAuth,
  clearGoogleFitAuth,
  cacheHealthData,
  setLastSyncDate,
} from "./health-data";

// Google Fit REST API base
const FIT_API = "https://www.googleapis.com/fitness/v1/users/me";

// Data source types
const DATA_TYPES = {
  steps: "com.google.step_count.delta",
  distance: "com.google.distance.delta",
  calories: "com.google.calories.expended",
  heartRate: "com.google.heart_rate.bpm",
  sleep: "com.google.sleep.segment",
  spo2: "com.google.oxygen_saturation",
  activeMinutes: "com.google.active_minutes",
  restingHR: "com.google.heart_rate.summary",
} as const;

// Sleep stage constants from Google Fit
const SLEEP_STAGES: Record<number, "awake" | "light" | "deep" | "rem"> = {
  1: "awake", // Awake during sleep
  2: "light", // Sleep
  3: "light", // Out-of-bed (treat as light)
  4: "light", // Light sleep
  5: "deep",  // Deep sleep
  6: "rem",   // REM sleep
};

// ── OAuth helpers ──

/**
 * Generate OAuth URL for Google Fit consent.
 * The clientId must be configured per environment.
 */
export function getGoogleFitOAuthUrl(clientId: string, redirectUri: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.body.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
    "https://www.googleapis.com/auth/fitness.location.read",
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: scopes.join(" "),
    include_granted_scopes: "true",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Handle OAuth callback — extract token from URL hash.
 * Returns true if auth was saved.
 */
export function handleOAuthCallback(): boolean {
  if (typeof window === "undefined") return false;

  const hash = window.location.hash;
  if (!hash.includes("access_token")) return false;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const expiresIn = parseInt(params.get("expires_in") || "3600", 10);

  if (!accessToken) return false;

  const auth: GoogleFitAuth = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  saveGoogleFitAuth(auth);

  // Clean URL hash
  window.history.replaceState(null, "", window.location.pathname);

  return true;
}

/**
 * Get valid access token, or null if expired/missing.
 */
function getValidToken(): string | null {
  const auth = getGoogleFitAuth();
  if (!auth) return null;
  if (Date.now() > auth.expiresAt - 60000) {
    // Token expired or expiring in < 1 min
    return null;
  }
  return auth.accessToken;
}

/**
 * Disconnect Google Fit.
 */
export async function disconnectGoogleFit(): Promise<void> {
  const token = getValidToken();
  if (token) {
    // Revoke token silently
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch {
      // Ignore revoke errors
    }
  }
  clearGoogleFitAuth();
}

// ── Data fetching ──

/**
 * Helper: call Google Fit API with auth.
 */
async function fitFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const token = getValidToken();
  if (!token) return null;

  try {
    const res = await fetch(`${FIT_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Token expired
        clearGoogleFitAuth();
      }
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Time range helpers — nanosecond timestamps for Google Fit.
 */
function dayRange(dateStr: string): { startTimeNanos: string; endTimeNanos: string } {
  const start = new Date(dateStr + "T00:00:00");
  const end = new Date(dateStr + "T23:59:59.999");
  return {
    startTimeNanos: String(start.getTime() * 1_000_000),
    endTimeNanos: String(end.getTime() * 1_000_000),
  };
}

interface AggregateResponse {
  bucket?: Array<{
    startTimeMillis: string;
    endTimeMillis: string;
    dataset: Array<{
      dataSourceId: string;
      point: Array<{
        startTimeNanos: string;
        endTimeNanos: string;
        value: Array<{
          intVal?: number;
          fpVal?: number;
          mapVal?: Array<{ key: string; value: { intVal?: number; fpVal?: number } }>;
        }>;
      }>;
    }>;
  }>;
}

interface SleepSession {
  session?: Array<{
    startTimeMillis: string;
    endTimeMillis: string;
    activityType: number;
    name?: string;
  }>;
}

/**
 * Fetch aggregated data for a single day.
 */
async function fetchAggregate(dateStr: string, dataTypeNames: string[]): Promise<AggregateResponse | null> {
  const { startTimeNanos, endTimeNanos } = dayRange(dateStr);

  return fitFetch<AggregateResponse>("/dataset:aggregate", {
    method: "POST",
    body: JSON.stringify({
      aggregateBy: dataTypeNames.map((dataTypeName) => ({ dataTypeName })),
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: parseInt(startTimeNanos) / 1_000_000,
      endTimeMillis: parseInt(endTimeNanos) / 1_000_000,
    }),
  });
}

/**
 * Fetch sleep sessions for a date.
 */
async function fetchSleepSessions(dateStr: string): Promise<SleepSession | null> {
  // Sleep sessions typically span from previous night to morning
  const bedtime = new Date(dateStr + "T00:00:00");
  bedtime.setHours(bedtime.getHours() - 12); // 12h before midnight
  const wakeup = new Date(dateStr + "T12:00:00"); // noon

  const params = new URLSearchParams({
    startTime: bedtime.toISOString(),
    endTime: wakeup.toISOString(),
    activityType: "72", // Sleep activity type
  });

  return fitFetch<SleepSession>(`/sessions?${params.toString()}`);
}

/**
 * Parse aggregate response to extract values.
 */
function extractValue(response: AggregateResponse | null, dataType: string): number | undefined {
  if (!response?.bucket?.[0]) return undefined;
  const bucket = response.bucket[0];
  for (const ds of bucket.dataset) {
    if (ds.dataSourceId.includes(dataType) || ds.point.length > 0) {
      for (const pt of ds.point) {
        if (pt.value[0]) {
          return pt.value[0].intVal ?? pt.value[0].fpVal ?? undefined;
        }
      }
    }
  }
  return undefined;
}

/**
 * Extract heart rate values (min, max, avg) from aggregate.
 */
function extractHeartRate(response: AggregateResponse | null): { avg?: number; max?: number; resting?: number } {
  if (!response?.bucket?.[0]) return {};
  const result: { avg?: number; max?: number; resting?: number } = {};

  for (const ds of response.bucket[0].dataset) {
    for (const pt of ds.point) {
      if (pt.value.length >= 3) {
        // Google Fit HR summary: [avg, max, min]
        result.avg = pt.value[0].fpVal;
        result.max = pt.value[1].fpVal ? Math.round(pt.value[1].fpVal) : undefined;
        result.resting = pt.value[2].fpVal ? Math.round(pt.value[2].fpVal) : undefined;
      } else if (pt.value[0]) {
        result.avg = pt.value[0].fpVal ? Math.round(pt.value[0].fpVal) : undefined;
      }
    }
  }

  return result;
}

// ── Main sync function ──

/**
 * Sync health data from Google Fit for a specific date.
 * Returns the snapshot or null if unavailable.
 */
export async function syncHealthForDate(dateStr: string): Promise<HealthSnapshot | null> {
  const token = getValidToken();
  if (!token) return null;

  // Fetch aggregate data
  const aggResponse = await fetchAggregate(dateStr, [
    DATA_TYPES.steps,
    DATA_TYPES.distance,
    DATA_TYPES.calories,
    DATA_TYPES.heartRate,
    DATA_TYPES.activeMinutes,
  ]);

  // Fetch sleep separately
  const sleepResponse = await fetchSleepSessions(dateStr);

  // Extract steps
  const steps = extractValue(aggResponse, "step_count");

  // Extract distance
  const distRaw = extractValue(aggResponse, "distance");
  const distance = distRaw ? Math.round(distRaw) : undefined;

  // Extract calories
  const calRaw = extractValue(aggResponse, "calories");
  const caloriesBurned = calRaw ? Math.round(calRaw) : undefined;

  // Extract heart rate
  const hr = extractHeartRate(aggResponse);

  // Extract active minutes
  const activeMinutes = extractValue(aggResponse, "active_minutes");

  // Calculate sleep from sessions
  let sleepMinutes: number | undefined;
  let sleepStages: HealthSnapshot["sleepStages"] | undefined;

  if (sleepResponse?.session && sleepResponse.session.length > 0) {
    let totalMs = 0;
    const stages = { deep: 0, light: 0, rem: 0, awake: 0 };

    for (const session of sleepResponse.session) {
      const start = parseInt(session.startTimeMillis);
      const end = parseInt(session.endTimeMillis);
      const durationMs = end - start;
      totalMs += durationMs;

      // Try to get sleep stages from the session
      const stageType = SLEEP_STAGES[session.activityType] || "light";
      stages[stageType] += Math.round(durationMs / 60000);
    }

    sleepMinutes = Math.round(totalMs / 60000);
    if (stages.deep > 0 || stages.rem > 0) {
      sleepStages = stages;
    }
  }

  // Build snapshot
  const snapshot: HealthSnapshot = {
    date: dateStr,
    steps,
    distance,
    caloriesBurned,
    restingHeartRate: hr.resting,
    avgHeartRate: hr.avg ? Math.round(hr.avg) : undefined,
    maxHeartRate: hr.max,
    sleepMinutes,
    sleepStages,
    activeMinutes,
    syncedAt: Date.now(),
  };

  // Only cache if we got any meaningful data
  const hasData = steps !== undefined || sleepMinutes !== undefined || hr.avg !== undefined || caloriesBurned !== undefined;
  if (hasData) {
    cacheHealthData(snapshot);
  }

  return hasData ? snapshot : null;
}

/**
 * Sync today + last 7 days of health data.
 */
export async function syncRecentHealth(): Promise<number> {
  const token = getValidToken();
  if (!token) return 0;

  const today = new Date();
  let synced = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const result = await syncHealthForDate(dateStr);
    if (result) synced++;
  }

  if (synced > 0) {
    setLastSyncDate(new Date().toISOString());
  }

  return synced;
}

/**
 * Check if Google Fit is available and token is valid.
 */
export function isGoogleFitReady(): boolean {
  return getValidToken() !== null;
}
