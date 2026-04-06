import { describe, it, expect, beforeEach } from "vitest";
import {
  saveGoogleFitAuth,
  getGoogleFitAuth,
  clearGoogleFitAuth,
  isGoogleFitConnected,
  cacheHealthData,
  getHealthForDate,
  getHealthForRange,
  calculateRecoveryScore,
  getHealthSummary,
  getLastSyncDate,
  setLastSyncDate,
  type HealthSnapshot,
  type GoogleFitAuth,
} from "../lib/health-data";

/** Get a date string N days ago from today */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const TODAY = daysAgo(0);
const YESTERDAY = daysAgo(1);
const TWO_DAYS_AGO = daysAgo(2);
const FIVE_DAYS_AGO = daysAgo(5);

function makeSnapshot(date: string, overrides?: Partial<HealthSnapshot>): HealthSnapshot {
  return {
    date,
    steps: 8000,
    distance: 5500,
    caloriesBurned: 350,
    restingHeartRate: 62,
    avgHeartRate: 78,
    sleepMinutes: 450, // 7.5h
    sleepStages: { deep: 95, light: 210, rem: 105, awake: 40 },
    activeMinutes: 45,
    syncedAt: Date.now(),
    ...overrides,
  };
}

describe("health-data", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("GoogleFitAuth", () => {
    it("returns null when no auth stored", () => {
      expect(getGoogleFitAuth()).toBeNull();
    });

    it("saves and loads auth", () => {
      const auth: GoogleFitAuth = {
        accessToken: "test-token-123",
        expiresAt: Date.now() + 3600000,
        email: "test@gmail.com",
      };
      saveGoogleFitAuth(auth);
      const loaded = getGoogleFitAuth();
      expect(loaded?.accessToken).toBe("test-token-123");
      expect(loaded?.email).toBe("test@gmail.com");
    });

    it("clears auth and last sync", () => {
      saveGoogleFitAuth({ accessToken: "abc", expiresAt: Date.now() + 3600000 });
      setLastSyncDate(new Date().toISOString());
      clearGoogleFitAuth();
      expect(getGoogleFitAuth()).toBeNull();
      expect(getLastSyncDate()).toBeNull();
    });

    it("isGoogleFitConnected returns true when auth exists", () => {
      expect(isGoogleFitConnected()).toBe(false);
      saveGoogleFitAuth({ accessToken: "x", expiresAt: Date.now() + 3600000 });
      expect(isGoogleFitConnected()).toBe(true);
    });

    it("isGoogleFitConnected returns false for empty token", () => {
      saveGoogleFitAuth({ accessToken: "", expiresAt: Date.now() + 3600000 });
      expect(isGoogleFitConnected()).toBe(false);
    });
  });

  describe("Health cache", () => {
    it("stores and retrieves by date", () => {
      const snap = makeSnapshot(TODAY);
      cacheHealthData(snap);
      const loaded = getHealthForDate(TODAY);
      expect(loaded?.steps).toBe(8000);
      expect(loaded?.sleepMinutes).toBe(450);
    });

    it("returns null for unknown date", () => {
      expect(getHealthForDate(FIVE_DAYS_AGO)).toBeNull();
    });

    it("returns range sorted by date", () => {
      cacheHealthData(makeSnapshot(TWO_DAYS_AGO));
      cacheHealthData(makeSnapshot(TODAY));
      cacheHealthData(makeSnapshot(YESTERDAY));
      cacheHealthData(makeSnapshot(FIVE_DAYS_AGO)); // outside range

      const range = getHealthForRange(daysAgo(3), TODAY);
      expect(range.length).toBe(3);
      expect(range[0].date).toBe(TWO_DAYS_AGO);
      expect(range[2].date).toBe(TODAY);
    });

    it("overwrites existing date data", () => {
      cacheHealthData(makeSnapshot(TODAY, { steps: 5000 }));
      cacheHealthData(makeSnapshot(TODAY, { steps: 12000 }));
      expect(getHealthForDate(TODAY)?.steps).toBe(12000);
    });
  });

  describe("calculateRecoveryScore", () => {
    it("returns 50/fair with no data", () => {
      const result = calculateRecoveryScore(null);
      expect(result.score).toBe(50);
      expect(result.label).toBe("fair");
    });

    it("scores excellent for optimal metrics", () => {
      const snap = makeSnapshot("2025-01-15", {
        sleepMinutes: 480, // 8h
        sleepStages: { deep: 100, light: 200, rem: 120, awake: 60 }, // 20.8% deep
        restingHeartRate: 52,
        activeMinutes: 60,
      });
      const result = calculateRecoveryScore(snap, undefined, 0); // 0 = no soreness
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.label).toBe("excellent");
    });

    it("scores poor for bad metrics", () => {
      const snap = makeSnapshot("2025-01-15", {
        sleepMinutes: 240, // 4h
        sleepStages: { deep: 10, light: 190, rem: 20, awake: 20 },
        restingHeartRate: 85,
        activeMinutes: 5,
      });
      const result = calculateRecoveryScore(snap, undefined, 3); // very sore
      expect(result.score).toBeLessThan(40);
      expect(result.label).toBe("poor");
    });

    it("gives good score with moderate sleep and OK HR", () => {
      const snap = makeSnapshot(TODAY, {
        sleepMinutes: 420, // 7h
        restingHeartRate: 63,
        activeMinutes: 35,
      });
      const result = calculateRecoveryScore(snap);
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(["good", "excellent"]).toContain(result.label);
    });
  });

  describe("getHealthSummary", () => {
    it("returns zeroed summary when no data", () => {
      const summary = getHealthSummary(TODAY);
      expect(summary.today).toBeNull();
      expect(summary.weekAvg.steps).toBe(0);
      expect(summary.weekAvg.sleep).toBe(0);
      expect(summary.recoveryScore).toBe(50);
    });

    it("calculates weekly averages from cached data", () => {
      cacheHealthData(makeSnapshot(TWO_DAYS_AGO, { steps: 10000, sleepMinutes: 480 }));
      cacheHealthData(makeSnapshot(YESTERDAY, { steps: 6000, sleepMinutes: 360 }));
      cacheHealthData(makeSnapshot(TODAY, { steps: 8000, sleepMinutes: 420 }));

      const summary = getHealthSummary(TODAY);
      expect(summary.today).not.toBeNull();
      expect(summary.today?.steps).toBe(8000);
      expect(summary.weekAvg.steps).toBe(8000); // (10000+6000+8000)/3
      expect(summary.weekAvg.sleep).toBeCloseTo(7.0, 0); // (8+6+7)/3 = 7
    });
  });

  describe("sync tracking", () => {
    it("stores and retrieves last sync date", () => {
      expect(getLastSyncDate()).toBeNull();
      const iso = "2025-01-15T12:00:00.000Z";
      setLastSyncDate(iso);
      expect(getLastSyncDate()).toBe(iso);
    });
  });
});
