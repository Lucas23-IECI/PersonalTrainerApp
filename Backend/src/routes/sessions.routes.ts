import { Router } from "express";
import { loadCollection, saveCollection } from "../store.js";

interface WorkoutSession {
  id: string;
  date: string;
  workoutId: string;
  workoutName: string;
  exercises: unknown[];
  completed: boolean;
  startTime: number;
  endTime: number;
}

const COLLECTION = "sessions";
export const sessionsRouter = Router();

sessionsRouter.get("/", (_req, res) => {
  res.json(loadCollection<WorkoutSession>(COLLECTION));
});

sessionsRouter.get("/date/:date", (req, res) => {
  const all = loadCollection<WorkoutSession>(COLLECTION);
  res.json(all.filter((s) => s.date === req.params.date));
});

sessionsRouter.post("/", (req, res) => {
  const session: WorkoutSession = req.body;
  if (!session.id) return res.status(400).json({ error: "Se requiere id" });

  const all = loadCollection<WorkoutSession>(COLLECTION).filter((s) => s.id !== session.id);
  all.push(session);
  all.sort((a, b) => a.date.localeCompare(b.date));
  saveCollection(COLLECTION, all);
  res.status(201).json(session);
});

sessionsRouter.delete("/:id", (req, res) => {
  const all = loadCollection<WorkoutSession>(COLLECTION);
  const filtered = all.filter((s) => s.id !== req.params.id);
  saveCollection(COLLECTION, filtered);
  res.json({ ok: true });
});
