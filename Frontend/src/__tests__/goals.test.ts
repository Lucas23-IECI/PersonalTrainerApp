import { describe, it, expect, beforeEach } from "vitest";
import { getGoals, saveGoal, deleteGoal, updateGoalProgress, generateId, today, type UserGoal } from "../lib/storage";

describe("Goals (Countdown personalizable)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function makeGoal(overrides?: Partial<UserGoal>): UserGoal {
    return {
      id: generateId(),
      name: "Test Goal",
      targetDate: "2027-06-01",
      type: "date",
      icon: "🎯",
      color: "#0A84FF",
      createdAt: today(),
      ...overrides,
    };
  }

  it("starts with no goals", () => {
    expect(getGoals()).toEqual([]);
  });

  it("can save and retrieve a goal", () => {
    const goal = makeGoal({ name: "Meta Test" });
    saveGoal(goal);
    const goals = getGoals();
    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe("Meta Test");
  });

  it("can save multiple goals", () => {
    saveGoal(makeGoal({ id: "g1", name: "Goal 1" }));
    saveGoal(makeGoal({ id: "g2", name: "Goal 2" }));
    expect(getGoals()).toHaveLength(2);
  });

  it("updates existing goal by id", () => {
    const goal = makeGoal({ id: "g1", name: "Original" });
    saveGoal(goal);
    saveGoal({ ...goal, name: "Updated" });
    const goals = getGoals();
    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe("Updated");
  });

  it("can delete a goal", () => {
    saveGoal(makeGoal({ id: "g1" }));
    saveGoal(makeGoal({ id: "g2" }));
    deleteGoal("g1");
    const goals = getGoals();
    expect(goals).toHaveLength(1);
    expect(goals[0].id).toBe("g2");
  });

  it("can update goal progress", () => {
    saveGoal(makeGoal({ id: "g1", type: "weight", targetValue: 75, currentValue: 80 }));
    updateGoalProgress("g1", 77.5);
    const goals = getGoals();
    expect(goals[0].currentValue).toBe(77.5);
  });

  it("supports all goal types", () => {
    saveGoal(makeGoal({ id: "g1", type: "weight" }));
    saveGoal(makeGoal({ id: "g2", type: "date" }));
    saveGoal(makeGoal({ id: "g3", type: "strength" }));
    saveGoal(makeGoal({ id: "g4", type: "custom" }));
    expect(getGoals()).toHaveLength(4);
  });
});
