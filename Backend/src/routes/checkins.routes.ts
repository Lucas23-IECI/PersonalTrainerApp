import { Router } from "express";
import { loadCollection, saveCollection } from "../store.js";

interface DailyCheckin {
  date: string;
  weight?: number;
  sleepHours?: number;
  energy: number;
  soreness: number;
  notes?: string;
}

const COLLECTION = "checkins";
export const checkinsRouter = Router();

checkinsRouter.get("/", (_req, res) => {
  res.json(loadCollection<DailyCheckin>(COLLECTION));
});

checkinsRouter.get("/:date", (req, res) => {
  const all = loadCollection<DailyCheckin>(COLLECTION);
  const found = all.find((c) => c.date === req.params.date);
  if (!found) return res.status(404).json({ error: "No encontrado" });
  res.json(found);
});

checkinsRouter.post("/", (req, res) => {
  const checkin: DailyCheckin = req.body;
  if (!checkin.date) return res.status(400).json({ error: "Se requiere date" });

  const all = loadCollection<DailyCheckin>(COLLECTION).filter((c) => c.date !== checkin.date);
  all.push(checkin);
  all.sort((a, b) => a.date.localeCompare(b.date));
  saveCollection(COLLECTION, all);
  res.status(201).json(checkin);
});
