import { Router } from "express";
import { loadCollection, saveCollection } from "../store.js";

interface NutritionEntry {
  date: string;
  meals: unknown[];
  customMeals: unknown[];
}

const COLLECTION = "nutritionLog";
export const nutritionLogRouter = Router();

nutritionLogRouter.get("/", (_req, res) => {
  res.json(loadCollection<NutritionEntry>(COLLECTION));
});

nutritionLogRouter.get("/:date", (req, res) => {
  const all = loadCollection<NutritionEntry>(COLLECTION);
  const found = all.find((n) => n.date === req.params.date);
  res.json(found || { date: req.params.date, meals: [], customMeals: [] });
});

nutritionLogRouter.post("/", (req, res) => {
  const entry: NutritionEntry = req.body;
  if (!entry.date) return res.status(400).json({ error: "Se requiere date" });

  const all = loadCollection<NutritionEntry>(COLLECTION).filter((n) => n.date !== entry.date);
  all.push(entry);
  all.sort((a, b) => a.date.localeCompare(b.date));
  saveCollection(COLLECTION, all);
  res.status(201).json(entry);
});
