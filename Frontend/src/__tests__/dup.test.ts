import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isDUPEnabled,
  toggleDUP,
  getDUPScheme,
  getDUPConfig,
  advanceDUPCounter,
  resetDUPCounters,
  getDUPPreview,
  applyDUP,
  DUP_SCHEMES,
} from "../lib/dup";

describe("DUP (Daily Undulating Periodization)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is disabled by default", () => {
    expect(isDUPEnabled()).toBe(false);
  });

  it("can be toggled on and off", () => {
    toggleDUP(true);
    expect(isDUPEnabled()).toBe(true);
    toggleDUP(false);
    expect(isDUPEnabled()).toBe(false);
  });

  it("rotates through heavy → moderate → light", () => {
    expect(getDUPScheme("day-1")).toBe("heavy");
    advanceDUPCounter("day-1");
    expect(getDUPScheme("day-1")).toBe("moderate");
    advanceDUPCounter("day-1");
    expect(getDUPScheme("day-1")).toBe("light");
    advanceDUPCounter("day-1");
    expect(getDUPScheme("day-1")).toBe("heavy"); // wraps around
  });

  it("tracks counters per day independently", () => {
    advanceDUPCounter("day-1");
    expect(getDUPScheme("day-1")).toBe("moderate");
    expect(getDUPScheme("day-2")).toBe("heavy"); // independent
  });

  it("getDUPConfig returns correct config", () => {
    const cfg = getDUPConfig("test-day");
    expect(cfg).toEqual(DUP_SCHEMES.heavy);
    expect(cfg.reps).toBe("3-5");
    expect(cfg.rpe).toBe("8-9");
  });

  it("getDUPPreview shows next 3 sessions", () => {
    const preview = getDUPPreview("day-1");
    expect(preview).toHaveLength(3);
    expect(preview[0].scheme).toBe("heavy");
    expect(preview[1].scheme).toBe("moderate");
    expect(preview[2].scheme).toBe("light");
  });

  it("resetDUPCounters clears all counters", () => {
    advanceDUPCounter("day-1");
    advanceDUPCounter("day-2");
    resetDUPCounters();
    expect(getDUPScheme("day-1")).toBe("heavy");
    expect(getDUPScheme("day-2")).toBe("heavy");
  });

  it("applyDUP returns null when disabled", () => {
    const result = applyDUP("day-1", { reps: "10", rpe: "7", load: "50kg", isCompound: true });
    expect(result).toBeNull();
  });

  it("applyDUP returns null for non-compound", () => {
    toggleDUP(true);
    const result = applyDUP("day-1", { reps: "10", rpe: "7", load: "50kg", isCompound: false });
    expect(result).toBeNull();
  });

  it("applyDUP returns modified values for compound when enabled", () => {
    toggleDUP(true);
    const result = applyDUP("day-1", { reps: "10", rpe: "7", load: "50kg", isCompound: true });
    expect(result).not.toBeNull();
    expect(result!.reps).toBe("3-5"); // heavy scheme
    expect(result!.rpe).toBe("8-9");
  });
});
