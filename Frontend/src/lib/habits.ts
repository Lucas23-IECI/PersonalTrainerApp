import { safeGetItem, safeSetItem, generateId, today } from "./storage";

// ── Types ──

export interface Habit {
  id: string;
  name: string;
  icon: string;        // emoji or lucide icon name
  color: string;       // hex or css color
  type: "check" | "timed" | "reps" | "count";
  target?: number;     // target value (seconds for timed, reps, count)
  unit?: string;       // display unit ("seg", "reps", etc.)
  frequency: "daily" | "weekly" | "custom";
  timesPerDay: number; // 1 = once, 3 = morning/afternoon/night
  category?: string;   // user-defined grouping
  reminderTimes?: string[]; // HH:MM strings
  archived: boolean;
  createdAt: string;   // ISO date
  order: number;       // display order
}

export type TimeOfDay = "morning" | "afternoon" | "night";

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;        // YYYY-MM-DD
  timeOfDay: TimeOfDay | null; // null = not time-specific
  completed: boolean;
  value?: number;      // actual reps/seconds/count
  duration?: number;   // session duration in seconds
  notes?: string;
  completedAt?: string; // ISO timestamp
}

export interface HabitStreak {
  current: number;
  best: number;
  total: number; // total days completed
}

// ── Storage Keys ──

const HABITS_KEY = "mark-pt-habits";
const HABIT_LOGS_KEY = "mark-pt-habit-logs";

// ── CRUD ──

export function getHabits(): Habit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(HABITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getActiveHabits(): Habit[] {
  return getHabits().filter(h => !h.archived).sort((a, b) => a.order - b.order);
}

export function getHabitById(id: string): Habit | undefined {
  return getHabits().find(h => h.id === id);
}

export function saveHabit(habit: Habit): void {
  const habits = getHabits();
  const idx = habits.findIndex(h => h.id === habit.id);
  if (idx >= 0) habits[idx] = habit;
  else habits.push(habit);
  safeSetItem(HABITS_KEY, JSON.stringify(habits));
}

export function createHabit(data: Omit<Habit, "id" | "createdAt" | "order" | "archived">): Habit {
  const habits = getHabits();
  const habit: Habit = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    order: habits.length,
    archived: false,
  };
  habits.push(habit);
  safeSetItem(HABITS_KEY, JSON.stringify(habits));
  return habit;
}

export function deleteHabit(id: string): void {
  const habits = getHabits().filter(h => h.id !== id);
  safeSetItem(HABITS_KEY, JSON.stringify(habits));
  // Also delete logs
  const logs = getHabitLogs().filter(l => l.habitId !== id);
  safeSetItem(HABIT_LOGS_KEY, JSON.stringify(logs));
}

export function reorderHabits(ids: string[]): void {
  const habits = getHabits();
  ids.forEach((id, i) => {
    const h = habits.find(x => x.id === id);
    if (h) h.order = i;
  });
  safeSetItem(HABITS_KEY, JSON.stringify(habits));
}

// ── Habit Logs ──

export function getHabitLogs(): HabitLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(HABIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getLogsForDate(date: string): HabitLog[] {
  return getHabitLogs().filter(l => l.date === date);
}

export function getLogsForHabit(habitId: string): HabitLog[] {
  return getHabitLogs().filter(l => l.habitId === habitId);
}

export function getLogsForHabitAndDate(habitId: string, date: string): HabitLog[] {
  return getHabitLogs().filter(l => l.habitId === habitId && l.date === date);
}

export function logHabitCompletion(
  habitId: string,
  timeOfDay: TimeOfDay | null,
  value?: number,
  notes?: string,
): HabitLog {
  const logs = getHabitLogs();
  // Check if already logged for this habit/date/timeOfDay
  const d = today();
  const existing = logs.find(l =>
    l.habitId === habitId && l.date === d && l.timeOfDay === timeOfDay
  );
  if (existing) {
    existing.completed = true;
    existing.value = value;
    existing.notes = notes;
    existing.completedAt = new Date().toISOString();
    safeSetItem(HABIT_LOGS_KEY, JSON.stringify(logs));
    return existing;
  }
  const log: HabitLog = {
    id: generateId(),
    habitId,
    date: d,
    timeOfDay,
    completed: true,
    value,
    notes,
    completedAt: new Date().toISOString(),
  };
  logs.push(log);
  safeSetItem(HABIT_LOGS_KEY, JSON.stringify(logs));
  return log;
}

export function unlogHabitCompletion(habitId: string, date: string, timeOfDay: TimeOfDay | null): void {
  const logs = getHabitLogs();
  const idx = logs.findIndex(l =>
    l.habitId === habitId && l.date === date && l.timeOfDay === timeOfDay
  );
  if (idx >= 0) {
    logs[idx].completed = false;
    logs[idx].completedAt = undefined;
    safeSetItem(HABIT_LOGS_KEY, JSON.stringify(logs));
  }
}

// ── Completion Logic ──

export function getTimeSlotsForHabit(habit: Habit): (TimeOfDay | null)[] {
  if (habit.timesPerDay === 1) return [null];
  if (habit.timesPerDay === 2) return ["morning", "night"];
  return ["morning", "afternoon", "night"];
}

export function isHabitFullyCompleted(habitId: string, date: string): boolean {
  const habit = getHabitById(habitId);
  if (!habit) return false;
  const logs = getLogsForHabitAndDate(habitId, date);
  const slots = getTimeSlotsForHabit(habit);
  return slots.every(slot =>
    logs.some(l => l.timeOfDay === slot && l.completed)
  );
}

export function getHabitCompletionForDate(habitId: string, date: string): { done: number; total: number } {
  const habit = getHabitById(habitId);
  if (!habit) return { done: 0, total: 0 };
  const logs = getLogsForHabitAndDate(habitId, date);
  const slots = getTimeSlotsForHabit(habit);
  const done = slots.filter(slot =>
    logs.some(l => l.timeOfDay === slot && l.completed)
  ).length;
  return { done, total: slots.length };
}

export function getDayCompletionRate(date: string): number {
  const habits = getActiveHabits();
  if (!habits.length) return 0;
  let totalSlots = 0;
  let doneSlots = 0;
  for (const h of habits) {
    const { done, total } = getHabitCompletionForDate(h.id, date);
    totalSlots += total;
    doneSlots += done;
  }
  return totalSlots > 0 ? Math.round((doneSlots / totalSlots) * 100) : 0;
}

// ── Streaks ──

export function getHabitStreak(habitId: string): HabitStreak {
  const logs = getLogsForHabit(habitId);
  const completedDates = new Set<string>();
  const habit = getHabitById(habitId);
  if (!habit) return { current: 0, best: 0, total: 0 };

  // Collect all dates where habit was FULLY completed
  const dateMap = new Map<string, HabitLog[]>();
  for (const l of logs) {
    if (!dateMap.has(l.date)) dateMap.set(l.date, []);
    dateMap.get(l.date)!.push(l);
  }
  const slots = getTimeSlotsForHabit(habit);
  for (const [date, dateLogs] of dateMap) {
    const allDone = slots.every(slot =>
      dateLogs.some(l => l.timeOfDay === slot && l.completed)
    );
    if (allDone) completedDates.add(date);
  }

  const total = completedDates.size;
  const sortedDates = Array.from(completedDates).sort().reverse();
  if (!sortedDates.length) return { current: 0, best: 0, total: 0 };

  // Current streak (working backwards from today)
  let current = 0;
  const d = new Date(today() + "T00:00:00");
  while (true) {
    const ds = d.toISOString().split("T")[0];
    if (completedDates.has(ds)) {
      current++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Best streak
  let best = 0;
  let streak = 0;
  const allSorted = Array.from(completedDates).sort();
  for (let i = 0; i < allSorted.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(allSorted[i - 1] + "T00:00:00");
      const curr = new Date(allSorted[i] + "T00:00:00");
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    if (streak > best) best = streak;
  }

  return { current, best, total };
}

// ── Calendar Data (for heatmap) ──

export function getCalendarData(habitId: string | null, days: number = 90): Map<string, number> {
  const map = new Map<string, number>();
  const d = new Date(today() + "T00:00:00");
  for (let i = 0; i < days; i++) {
    const ds = d.toISOString().split("T")[0];
    if (habitId) {
      const { done, total } = getHabitCompletionForDate(habitId, ds);
      map.set(ds, total > 0 ? Math.round((done / total) * 100) : 0);
    } else {
      map.set(ds, getDayCompletionRate(ds));
    }
    d.setDate(d.getDate() - 1);
  }
  return map;
}

// ── Stats ──

export function getWeeklyCompletionRate(habitId: string | null, weeks: number = 4): number[] {
  const rates: number[] = [];
  const d = new Date(today() + "T00:00:00");
  // Go to start of current week (Monday)
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - mondayOffset);
  
  for (let w = 0; w < weeks; w++) {
    let totalSlots = 0;
    let doneSlots = 0;
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const ds = d.toISOString().split("T")[0];
      if (habitId) {
        const { done, total } = getHabitCompletionForDate(habitId, ds);
        totalSlots += total;
        doneSlots += done;
      } else {
        const habits = getActiveHabits();
        for (const h of habits) {
          const { done, total } = getHabitCompletionForDate(h.id, ds);
          totalSlots += total;
          doneSlots += done;
        }
      }
      d.setDate(d.getDate() - 1);
    }
    rates.unshift(totalSlots > 0 ? Math.round((doneSlots / totalSlots) * 100) : 0);
  }
  return rates;
}

export function getTimeOfDayLabel(tod: TimeOfDay | null): string {
  if (tod === "morning") return "Mañana";
  if (tod === "afternoon") return "Tarde";
  if (tod === "night") return "Noche";
  return "";
}
