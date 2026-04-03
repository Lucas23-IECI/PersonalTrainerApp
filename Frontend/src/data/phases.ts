// =============================================
// Dynamic Phase System
// Block periodization: Acumulación → Intensificación → Realización → Deload
// =============================================

export interface Phase {
  id: number;
  name: string;
  type: "reactivation" | "accumulation" | "intensification" | "deload" | "peaking";
  startDate: string; // YYYY-MM-DD
  endDate: string;
  rpeRange: [number, number];
  repRangeCompound: string;
  repRangeAccessory: string;
  volumeLevel: "low" | "medium" | "high";
  splitType: "upper_lower" | "5day" | "reduced" | "flexible";
  description: string;
  deloadWeek?: number; // which week is deload (e.g. 6 = week 6)
}

export const PHASES: Phase[] = [
  {
    id: 0,
    name: "Reactivación",
    type: "reactivation",
    startDate: "2026-04-02",
    endDate: "2026-04-20",
    rpeRange: [5, 7],
    repRangeCompound: "10-15",
    repRangeAccessory: "12-20",
    volumeLevel: "low",
    splitType: "upper_lower",
    description: "Reactivar patrones motores sin gym. Casa con mancuernas + barra.",
  },
  {
    id: 1,
    name: "Acumulación I",
    type: "accumulation",
    startDate: "2026-04-21",
    endDate: "2026-06-01",
    rpeRange: [7, 8],
    repRangeCompound: "8-12",
    repRangeAccessory: "10-15",
    volumeLevel: "high",
    splitType: "5day",
    description: "Volumen alto, hipertrofia. Gym completo, split 5 días.",
    deloadWeek: 6,
  },
  {
    id: 2,
    name: "Intensificación I",
    type: "intensification",
    startDate: "2026-06-02",
    endDate: "2026-07-13",
    rpeRange: [8, 9],
    repRangeCompound: "6-10",
    repRangeAccessory: "8-12",
    volumeLevel: "medium",
    splitType: "5day",
    description: "Más peso, menos reps. Fuerza-hipertrofia.",
    deloadWeek: 6,
  },
  {
    id: 3,
    name: "Deload + Realización",
    type: "deload",
    startDate: "2026-07-14",
    endDate: "2026-07-27",
    rpeRange: [5, 6],
    repRangeCompound: "8-12",
    repRangeAccessory: "10-15",
    volumeLevel: "low",
    splitType: "reduced",
    description: "Recuperar y consolidar. Test PRs opcionales semana 2.",
  },
  {
    id: 4,
    name: "Acumulación II",
    type: "accumulation",
    startDate: "2026-07-28",
    endDate: "2026-09-07",
    rpeRange: [7, 8.5],
    repRangeCompound: "8-12",
    repRangeAccessory: "10-15",
    volumeLevel: "high",
    splitType: "5day",
    description: "Segundo bloque de volumen. Ajustar según debilidades.",
    deloadWeek: 6,
  },
  {
    id: 5,
    name: "Intensificación II",
    type: "intensification",
    startDate: "2026-09-08",
    endDate: "2026-10-19",
    rpeRange: [8.5, 9.5],
    repRangeCompound: "4-8",
    repRangeAccessory: "6-10",
    volumeLevel: "medium",
    splitType: "5day",
    description: "Fase más intensa. Pesos serios, priorizar recuperación.",
    deloadWeek: 6,
  },
  {
    id: 6,
    name: "Deload + Realización II",
    type: "deload",
    startDate: "2026-10-20",
    endDate: "2026-11-02",
    rpeRange: [5, 6],
    repRangeCompound: "8-12",
    repRangeAccessory: "10-15",
    volumeLevel: "low",
    splitType: "reduced",
    description: "Recuperar del bloque pesado.",
  },
  {
    id: 7,
    name: "Peaking / Mantenimiento",
    type: "peaking",
    startDate: "2026-11-03",
    endDate: "2027-01-31",
    rpeRange: [7, 8.5],
    repRangeCompound: "6-12",
    repRangeAccessory: "8-15",
    volumeLevel: "medium",
    splitType: "flexible",
    description: "Mantener masa, optimizar composición para Brasil.",
  },
];

/**
 * Get the current phase based on today's date.
 * Can be overridden manually via localStorage.
 */
export function getCurrentPhase(): Phase {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("mark-pt-phase-override");
    if (override !== null) {
      const id = parseInt(override, 10);
      const found = PHASES.find((p) => p.id === id);
      if (found) return found;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = PHASES.length - 1; i >= 0; i--) {
    const start = new Date(PHASES[i].startDate);
    start.setHours(0, 0, 0, 0);
    if (today >= start) return PHASES[i];
  }

  return PHASES[0];
}

/**
 * Get phase progress as percentage (0-100).
 */
export function getPhaseProgress(phase: Phase): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(phase.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(phase.endDate);
  end.setHours(0, 0, 0, 0);

  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;
  const elapsed = today.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/**
 * Get current week number within the phase.
 */
export function getPhaseWeek(phase: Phase): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(phase.startDate);
  start.setHours(0, 0, 0, 0);

  const elapsed = today.getTime() - start.getTime();
  return Math.max(1, Math.ceil(elapsed / (7 * 24 * 60 * 60 * 1000)));
}

/**
 * Get total weeks in a phase.
 */
export function getPhaseTotalWeeks(phase: Phase): number {
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Check if current week is a deload week.
 */
export function isDeloadWeek(phase: Phase): boolean {
  if (!phase.deloadWeek) return phase.type === "deload";
  return getPhaseWeek(phase) >= phase.deloadWeek;
}

/**
 * Set manual phase override.
 */
export function setPhaseOverride(phaseId: number | null) {
  if (phaseId === null) {
    localStorage.removeItem("mark-pt-phase-override");
  } else {
    localStorage.setItem("mark-pt-phase-override", String(phaseId));
  }
}
