import { Router } from "express";
import { profile, getCurrentPhaseLabel, daysUntil } from "../data/profile.js";
import { exerciseLibrary, MUSCLE_LABELS, MUSCLE_REGIONS } from "../data/exercises.js";
import { weeklyPlan, getTodayWorkout, getWorkoutById } from "../data/workouts.js";
import {
  macroTargets,
  mealPlan,
  weeklyShoppingList,
  supplementPlan,
  cookingLessons,
} from "../data/nutrition.js";

export const dataRouter = Router();

// --- Profile ---
dataRouter.get("/profile", (_req, res) => {
  res.json({
    ...profile,
    currentPhaseLabel: getCurrentPhaseLabel(),
    daysToBrazil: daysUntil(profile.brazilDate),
    daysToWeights: daysUntil(profile.heavyWeightsDate),
  });
});

// --- Exercises ---
dataRouter.get("/exercises", (_req, res) => {
  res.json(exerciseLibrary);
});

dataRouter.get("/exercises/muscles", (_req, res) => {
  res.json({ labels: MUSCLE_LABELS, regions: MUSCLE_REGIONS });
});

dataRouter.get("/exercises/:id", (req, res) => {
  const ex = exerciseLibrary.find((e) => e.id === req.params.id);
  if (!ex) return res.status(404).json({ error: "Ejercicio no encontrado" });
  res.json(ex);
});

// --- Workouts ---
dataRouter.get("/workouts", (_req, res) => {
  res.json(weeklyPlan);
});

dataRouter.get("/workouts/today", (_req, res) => {
  const w = getTodayWorkout();
  if (!w) return res.json(null);
  res.json(w);
});

dataRouter.get("/workouts/:id", (req, res) => {
  const w = getWorkoutById(req.params.id);
  if (!w) return res.status(404).json({ error: "Workout no encontrado" });
  res.json(w);
});

// --- Nutrition Plan ---
dataRouter.get("/nutrition/plan", (_req, res) => {
  res.json({ macroTargets, mealPlan });
});

dataRouter.get("/nutrition/shopping", (_req, res) => {
  res.json(weeklyShoppingList);
});

dataRouter.get("/nutrition/supplements", (_req, res) => {
  res.json(supplementPlan);
});

dataRouter.get("/nutrition/cooking", (_req, res) => {
  res.json(cookingLessons);
});
