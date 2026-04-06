import { describe, it, expect, beforeEach } from "vitest";
import {
  transferExercise,
  undoTransfer,
  resetExerciseTransfers,
  hasExerciseTransfers,
  getWeeklyPlanWithTransfers,
} from "../data/workouts";

describe("Exercise Transfers (Weekly Planner D&D)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with no transfers", () => {
    expect(hasExerciseTransfers()).toBe(false);
  });

  it("transferExercise creates a transfer record", () => {
    transferExercise("day-1", 0, "day-2");
    expect(hasExerciseTransfers()).toBe(true);
  });

  it("undoTransfer removes a specific transfer", () => {
    transferExercise("day-1", 0, "day-2");
    transferExercise("day-1", 1, "day-3");
    undoTransfer("day-1", 0);
    // Still has the second transfer
    expect(hasExerciseTransfers()).toBe(true);
    undoTransfer("day-1", 1);
    expect(hasExerciseTransfers()).toBe(false);
  });

  it("resetExerciseTransfers clears all", () => {
    transferExercise("day-1", 0, "day-2");
    transferExercise("day-2", 1, "day-3");
    resetExerciseTransfers();
    expect(hasExerciseTransfers()).toBe(false);
  });

  it("getWeeklyPlanWithTransfers returns a plan", () => {
    const plan = getWeeklyPlanWithTransfers();
    expect(Array.isArray(plan)).toBe(true);
  });
});
