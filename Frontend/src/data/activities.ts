export interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
  metValue: number; // Metabolic Equivalent of Task
}

export interface LoggedActivity {
  id: string;
  categoryId: string;
  name: string;
  date: string; // ISO date
  durationMin: number;
  caloriesEstimated: number;
  caloriesManual?: number; // user override
  heartRateAvg?: number;
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

/** Predefined activity categories with MET values */
export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: "futbol", name: "Fútbol", icon: "⚽", metValue: 7.0 },
  { id: "correr", name: "Correr", icon: "🏃", metValue: 9.8 },
  { id: "yoga", name: "Yoga", icon: "🧘", metValue: 2.5 },
  { id: "natacion", name: "Natación", icon: "🏊", metValue: 7.0 },
  { id: "ciclismo", name: "Ciclismo", icon: "🚴", metValue: 7.5 },
  { id: "caminata", name: "Caminata", icon: "🚶", metValue: 3.5 },
  { id: "box", name: "Box", icon: "🥊", metValue: 7.8 },
  { id: "basquet", name: "Básquet", icon: "🏀", metValue: 6.5 },
  { id: "stretching", name: "Stretching", icon: "🤸", metValue: 2.3 },
];

/**
 * Estimate calories burned using MET formula.
 * Calories = MET × weight(kg) × duration(hours)
 */
export function estimateCalories(metValue: number, weightKg: number, durationMin: number): number {
  return Math.round(metValue * weightKg * (durationMin / 60));
}

const ACTIVITIES_KEY = "mark-pt-activities";

export function getLoggedActivities(): LoggedActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveActivity(activity: LoggedActivity): void {
  const all = getLoggedActivities();
  const idx = all.findIndex((a) => a.id === activity.id);
  if (idx >= 0) {
    all[idx] = activity;
  } else {
    all.push(activity);
  }
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(all));
}

export function deleteActivity(id: string): void {
  const all = getLoggedActivities().filter((a) => a.id !== id);
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(all));
}

/** Get activities for a specific date (ISO date string, e.g. "2025-01-15") */
export function getActivitiesForDate(date: string): LoggedActivity[] {
  return getLoggedActivities().filter((a) => a.date === date);
}
