// ── Cardio templates and session data ──

export type CardioType = "hiit" | "steady" | "intervals" | "sprint";

export interface CardioTemplate {
  id: string;
  name: string;
  type: CardioType;
  description: string;
  icon: string;
  color: string;
  durationMin: number;
  intervals?: { label: string; durationSec: number; intensity: "baja" | "media" | "alta" | "max" }[];
}

export const CARDIO_TYPE_LABELS: Record<CardioType, string> = {
  hiit: "HIIT",
  steady: "Steady State",
  intervals: "Intervalos",
  sprint: "Sprint",
};

export const CARDIO_TEMPLATES: CardioTemplate[] = [
  {
    id: "hiit-beginner",
    name: "HIIT Principiante",
    type: "hiit",
    description: "30s sprint / 60s descanso × 8 rondas",
    icon: "🔥",
    color: "#FF3B30",
    durationMin: 12,
    intervals: Array.from({ length: 8 }, (_, i) => [
      { label: `Sprint ${i + 1}`, durationSec: 30, intensity: "alta" as const },
      { label: `Descanso ${i + 1}`, durationSec: 60, intensity: "baja" as const },
    ]).flat(),
  },
  {
    id: "hiit-advanced",
    name: "HIIT Avanzado",
    type: "hiit",
    description: "40s sprint / 20s descanso × 10 rondas",
    icon: "💀",
    color: "#FF3B30",
    durationMin: 10,
    intervals: Array.from({ length: 10 }, (_, i) => [
      { label: `Sprint ${i + 1}`, durationSec: 40, intensity: "max" as const },
      { label: `Descanso ${i + 1}`, durationSec: 20, intensity: "baja" as const },
    ]).flat(),
  },
  {
    id: "pyramid-intervals",
    name: "Pirámide de Intervalos",
    type: "intervals",
    description: "Intervalos crecientes y decrecientes",
    icon: "📐",
    color: "#FF9500",
    durationMin: 16,
    intervals: [
      { label: "Calentamiento", durationSec: 120, intensity: "baja" },
      { label: "Intervalo 1", durationSec: 30, intensity: "alta" },
      { label: "Recuperación", durationSec: 30, intensity: "baja" },
      { label: "Intervalo 2", durationSec: 45, intensity: "alta" },
      { label: "Recuperación", durationSec: 45, intensity: "baja" },
      { label: "Intervalo 3", durationSec: 60, intensity: "alta" },
      { label: "Recuperación", durationSec: 60, intensity: "baja" },
      { label: "Intervalo 4 (pico)", durationSec: 90, intensity: "max" },
      { label: "Recuperación", durationSec: 90, intensity: "baja" },
      { label: "Intervalo 5", durationSec: 60, intensity: "alta" },
      { label: "Recuperación", durationSec: 60, intensity: "baja" },
      { label: "Intervalo 6", durationSec: 45, intensity: "alta" },
      { label: "Recuperación", durationSec: 45, intensity: "baja" },
      { label: "Intervalo 7", durationSec: 30, intensity: "alta" },
      { label: "Enfriamiento", durationSec: 120, intensity: "baja" },
    ],
  },
  {
    id: "fartlek",
    name: "Fartlek Run",
    type: "intervals",
    description: "Cambios de ritmo libres en carrera",
    icon: "🏃",
    color: "#0A84FF",
    durationMin: 20,
    intervals: [
      { label: "Calentamiento trote", durationSec: 180, intensity: "baja" },
      { label: "Ritmo rápido", durationSec: 60, intensity: "alta" },
      { label: "Trote suave", durationSec: 90, intensity: "media" },
      { label: "Sprint", durationSec: 30, intensity: "max" },
      { label: "Caminata", durationSec: 60, intensity: "baja" },
      { label: "Ritmo medio", durationSec: 120, intensity: "media" },
      { label: "Sprint", durationSec: 30, intensity: "max" },
      { label: "Trote suave", durationSec: 90, intensity: "baja" },
      { label: "Ritmo rápido", durationSec: 90, intensity: "alta" },
      { label: "Caminata", durationSec: 60, intensity: "baja" },
      { label: "Sprint final", durationSec: 30, intensity: "max" },
      { label: "Enfriamiento", durationSec: 180, intensity: "baja" },
    ],
  },
  {
    id: "sprint-30s",
    name: "Sprint 30s × 6",
    type: "sprint",
    description: "Sprints máximos con descanso completo",
    icon: "⚡",
    color: "#5856D6",
    durationMin: 15,
    intervals: Array.from({ length: 6 }, (_, i) => [
      { label: `Sprint ${i + 1}`, durationSec: 30, intensity: "max" as const },
      { label: `Recuperación ${i + 1}`, durationSec: 120, intensity: "baja" as const },
    ]).flat(),
  },
];

// ── Cardio session logging ──
const CARDIO_SESSIONS_KEY = "mark-pt-cardio-sessions";

export interface CardioSession {
  id: string;
  date: string;
  templateId?: string;
  templateName: string;
  type: CardioType;
  durationMin: number;
  distanceKm?: number;
  avgHeartRate?: number;
  caloriesEstimated?: number;
  notes?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
}

export function getCardioSessions(): CardioSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARDIO_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCardioSession(session: CardioSession): void {
  const all = getCardioSessions();
  all.unshift(session);
  if (all.length > 100) all.length = 100;
  localStorage.setItem(CARDIO_SESSIONS_KEY, JSON.stringify(all));
}

export function getCardioSessionsForDate(date: string): CardioSession[] {
  return getCardioSessions().filter((s) => s.date === date);
}

export const INTENSITY_COLORS = {
  baja: "#30D158",
  media: "#FF9500",
  alta: "#FF3B30",
  max: "#FF2D55",
};
