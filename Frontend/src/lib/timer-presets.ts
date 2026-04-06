// ── Timer mode definitions and presets ──
import { safeGetItem, safeSetItem } from "@/lib/storage";

export type TimerMode = "tabata" | "emom" | "amrap" | "custom";

export interface TimerPreset {
  id: string;
  name: string;
  mode: TimerMode;
  workSec: number;
  restSec: number;
  rounds: number;
  description: string;
}

export const TIMER_PRESETS: TimerPreset[] = [
  // Tabata
  { id: "tabata-classic", name: "Tabata Clásico", mode: "tabata", workSec: 20, restSec: 10, rounds: 8, description: "20s trabajo / 10s descanso × 8" },
  { id: "tabata-long", name: "Tabata Extendido", mode: "tabata", workSec: 30, restSec: 15, rounds: 10, description: "30s trabajo / 15s descanso × 10" },
  { id: "tabata-45-15", name: "Tabata 45/15", mode: "tabata", workSec: 45, restSec: 15, rounds: 8, description: "45s trabajo / 15s descanso × 8" },
  // EMOM
  { id: "emom-10", name: "EMOM 10 min", mode: "emom", workSec: 60, restSec: 0, rounds: 10, description: "1 min por ronda × 10 rondas" },
  { id: "emom-15", name: "EMOM 15 min", mode: "emom", workSec: 60, restSec: 0, rounds: 15, description: "1 min por ronda × 15 rondas" },
  { id: "emom-20", name: "EMOM 20 min", mode: "emom", workSec: 60, restSec: 0, rounds: 20, description: "1 min por ronda × 20 rondas" },
  // AMRAP
  { id: "amrap-10", name: "AMRAP 10 min", mode: "amrap", workSec: 600, restSec: 0, rounds: 1, description: "Máximo rondas en 10 min" },
  { id: "amrap-15", name: "AMRAP 15 min", mode: "amrap", workSec: 900, restSec: 0, rounds: 1, description: "Máximo rondas en 15 min" },
  { id: "amrap-20", name: "AMRAP 20 min", mode: "amrap", workSec: 1200, restSec: 0, rounds: 1, description: "Máximo rondas en 20 min" },
];

export const MODE_LABELS: Record<TimerMode, string> = {
  tabata: "Tabata",
  emom: "EMOM",
  amrap: "AMRAP",
  custom: "Personalizado",
};

export const MODE_COLORS: Record<TimerMode, string> = {
  tabata: "#FF3B30",
  emom: "#0A84FF",
  amrap: "#FF9500",
  custom: "#30D158",
};

export const MODE_DESCRIPTIONS: Record<TimerMode, string> = {
  tabata: "Intervalos de alta intensidad con descanso corto",
  emom: "Every Minute On the Minute — un ejercicio por minuto",
  amrap: "As Many Rounds As Possible — máximas rondas en un tiempo",
  custom: "Configurá tu propio intervalo de trabajo/descanso",
};

/** Storage key for timer session history */
const TIMER_HISTORY_KEY = "mark-pt-timer-history";

export interface TimerSession {
  id: string;
  date: string;
  mode: TimerMode;
  presetName: string;
  totalSec: number;
  roundsCompleted: number;
  roundsTotal: number;
}

export function getTimerHistory(): TimerSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(TIMER_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTimerSession(session: TimerSession): void {
  const all = getTimerHistory();
  all.unshift(session);
  // Keep max 50 sessions
  if (all.length > 50) all.length = 50;
  safeSetItem(TIMER_HISTORY_KEY, JSON.stringify(all));
}
