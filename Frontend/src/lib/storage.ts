// =============================================
// Centralized localStorage layer
// All app state persisted with typed helpers
// =============================================

// === Types ===

export interface DailyCheckin {
  date: string; // YYYY-MM-DD
  weight?: number;
  sleepHours?: number;
  energy: 1 | 2 | 3 | 4 | 5;
  soreness: 0 | 1 | 2 | 3;
  notes?: string;
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure' | 'amrap';

export interface LoggedSet {
  reps: number;
  weight?: number;
  rpe?: number;
  rir?: number;
  setType?: SetType;
}

export interface LoggedExercise {
  name: string;
  plannedSets: number;
  plannedReps: string;
  sets: LoggedSet[];
  skipped: boolean;
  notes?: string;
  primaryMuscles?: string[]; // MuscleGroup ids
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutId: string;
  workoutName: string;
  exercises: LoggedExercise[];
  completed: boolean;
  startTime: number;
  endTime: number;
  rating?: number; // 1-5 stars post-workout
  sessionNotes?: string; // free-text post-workout notes
  editedAt?: number; // timestamp if edited later
}

export interface NutritionEntry {
  date: string; // YYYY-MM-DD
  meals: SelectedMeal[];
  customMeals: CustomMeal[];
  waterMl: number; // 7.10 — daily water intake in ml
}

export interface SelectedMeal {
  slot: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CustomMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// === Meal Templates (7.9) ===

export interface MealTemplate {
  id: string;
  name: string;
  meals: SelectedMeal[];
  customMeals: CustomMeal[];
  totalCalories: number;
  totalProtein: number;
  createdAt: string;
}

// === Keys ===

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  goalWeight: number;
  bodyFatEstimate: number;
  goalBodyFat: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  brazilDate: string;
  heavyWeightsDate: string;
  startDate: string;
}

export interface BodyMeasurement {
  date: string; // YYYY-MM-DD
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  armR?: number;
  armL?: number;
  thighR?: number;
  thighL?: number;
  calfR?: number;
  calfL?: number;
  neck?: number;
}

export interface ProgressPhoto {
  id: string;
  date: string; // YYYY-MM-DD
  dataUrl: string; // base64 image
  pose: "front" | "side" | "back";
  weight?: number;
  notes?: string;
}

export interface ActiveSessionData {
  dayId: string;
  workoutName: string;
  sessionStart: number;
  exercises: {
    name: string;
    exerciseRef: any;
    exIndex: number;
    notes: string;
    restSeconds: number;
    sets: { reps: number; weight?: number; rpe?: number; completed: boolean; isWarmup: boolean }[];
    supersetTag?: string;
    previousSets: { weight: number; reps: number }[];
  }[];
}

// === User Settings ===

export type WeightUnit = "kg" | "lbs";

export interface UserSettings {
  unit: WeightUnit;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  weightIncrement: number; // kg step for +/- buttons (default 2.5)
  language: "es" | "en";
  autoBackup: boolean;
}

const SETTINGS_KEY = "mark-pt-settings";

const DEFAULT_SETTINGS: UserSettings = {
  unit: "kg",
  hapticsEnabled: true,
  soundEnabled: true,
  weightIncrement: 2.5,
  language: "es",
  autoBackup: true,
};

export function getSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

/** Convert kg to lbs */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/** Convert lbs to kg */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 10) / 10;
}

/** Format weight with current unit, value is always stored in kg */
export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === "lbs") return `${kgToLbs(kg)} lbs`;
  return `${kg} kg`;
}

const KEYS = {
  checkins: "mark-pt-checkins",
  sessions: "mark-pt-sessions",
  nutrition: "mark-pt-nutrition",
  weight: "mark-pt-weight",
  measurements: "mark-pt-measurements",
  weeklyNotes: "mark-pt-weekly-notes",
  shoppingChecked: "mark-pt-shopping-checked",
  profile: "mark-pt-profile",
  bodyMeasurements: "mark-pt-body-measurements",
  progressPhotos: "mark-pt-progress-photos",
  activeSession: "mark-pt-active-session",
  mealTemplates: "mark-pt-meal-templates",
} as const;

// === Helpers ===

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// === Check-ins ===

export function getCheckins(): DailyCheckin[] {
  return load<DailyCheckin>(KEYS.checkins);
}

export function getCheckinForDate(date: string): DailyCheckin | undefined {
  return getCheckins().find((c) => c.date === date);
}

export function saveCheckin(checkin: DailyCheckin) {
  const all = getCheckins().filter((c) => c.date !== checkin.date);
  all.push(checkin);
  all.sort((a, b) => a.date.localeCompare(b.date));
  save(KEYS.checkins, all);
}

// === Workout Sessions ===

export function getSessions(): WorkoutSession[] {
  return load<WorkoutSession>(KEYS.sessions);
}

export function getSessionsForDate(date: string): WorkoutSession[] {
  return getSessions().filter((s) => s.date === date);
}

export function getLatestSessionForDay(dayId: string): WorkoutSession | undefined {
  return getSessions()
    .filter((s) => s.workoutId === dayId && s.completed)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function saveSession(session: WorkoutSession) {
  const all = getSessions().filter((s) => s.id !== session.id);
  all.push(session);
  all.sort((a, b) => a.date.localeCompare(b.date));
  save(KEYS.sessions, all);
}

export function deleteSession(id: string) {
  save(KEYS.sessions, getSessions().filter((s) => s.id !== id));
}

// === Active Session (in-progress workout) ===

export function saveActiveSession(data: ActiveSessionData) {
  localStorage.setItem(KEYS.activeSession, JSON.stringify(data));
}

export function getActiveSession(): ActiveSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.activeSession);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveSession() {
  localStorage.removeItem(KEYS.activeSession);
}

// === Nutrition Entries ===

export function getNutritionEntries(): NutritionEntry[] {
  return load<NutritionEntry>(KEYS.nutrition);
}

export function getNutritionForDate(date: string): NutritionEntry {
  const existing = getNutritionEntries().find((n) => n.date === date);
  return existing || { date, meals: [], customMeals: [], waterMl: 0 };
}

export function saveNutritionEntry(entry: NutritionEntry) {
  const all = getNutritionEntries().filter((n) => n.date !== entry.date);
  all.push(entry);
  all.sort((a, b) => a.date.localeCompare(b.date));
  save(KEYS.nutrition, all);
}

// === Meal Templates (7.9) ===

export function getMealTemplates(): MealTemplate[] {
  return load<MealTemplate>(KEYS.mealTemplates);
}

export function saveMealTemplate(tpl: MealTemplate) {
  const all = getMealTemplates().filter((t) => t.id !== tpl.id);
  all.push(tpl);
  save(KEYS.mealTemplates, all);
}

export function deleteMealTemplate(id: string) {
  save(KEYS.mealTemplates, getMealTemplates().filter((t) => t.id !== id));
}

// === Aggregation ===

export function getWeekDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export interface DayStatus {
  date: string;
  dayLabel: string;
  trained: boolean;
  checkedIn: boolean;
  mealsLogged: number;
  totalProtein: number;
}

export function getWeekStatus(): DayStatus[] {
  const dates = getWeekDates();
  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return dates.map((date, i) => {
    const sessions = getSessionsForDate(date);
    const checkin = getCheckinForDate(date);
    const nutrition = getNutritionForDate(date);
    const totalProtein =
      nutrition.meals.reduce((s, m) => s + m.protein, 0) +
      nutrition.customMeals.reduce((s, m) => s + m.protein, 0);
    return {
      date,
      dayLabel: dayLabels[i],
      trained: sessions.some((s) => s.completed),
      checkedIn: !!checkin,
      mealsLogged: nutrition.meals.length + nutrition.customMeals.length,
      totalProtein,
    };
  });
}

// === Streaks ===

export function getTrainingStreak(): number {
  const sessions = getSessions().filter((s) => s.completed);
  if (sessions.length === 0) return 0;

  const trainedDates = new Set(sessions.map((s) => s.date));
  let streak = 0;
  const d = new Date();

  // Check if today counts
  const todayStr = today();
  if (!trainedDates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (trainedDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// === Muscle tracking ===

export function getWeeklyMuscleHits(): Record<string, number> {
  const dates = getWeekDates();
  const hits: Record<string, number> = {};
  dates.forEach((date) => {
    const sessions = getSessionsForDate(date).filter((s) => s.completed);
    sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (!ex.skipped && ex.primaryMuscles) {
          ex.primaryMuscles.forEach((m) => {
            hits[m] = (hits[m] || 0) + 1;
          });
        }
      });
    });
  });
  return hits;
}

// === Weekly Notes ===

export interface WeeklyNote {
  weekStart: string; // YYYY-MM-DD (Monday of week)
  text: string;
  updatedAt: number;
}

function getWeekStart(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().split("T")[0];
}

export function getWeeklyNotes(): WeeklyNote[] {
  return load<WeeklyNote>(KEYS.weeklyNotes);
}

export function getCurrentWeekNote(): WeeklyNote | undefined {
  const weekStart = getWeekStart();
  return getWeeklyNotes().find((n) => n.weekStart === weekStart);
}

export function saveWeeklyNote(text: string) {
  const weekStart = getWeekStart();
  const all = getWeeklyNotes().filter((n) => n.weekStart !== weekStart);
  if (text.trim()) {
    all.push({ weekStart, text: text.trim(), updatedAt: Date.now() });
  }
  all.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  save(KEYS.weeklyNotes, all);
}

// === Shopping List Persistence ===

export function getShoppingChecked(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.shoppingChecked);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setShoppingChecked(items: string[]) {
  localStorage.setItem(KEYS.shoppingChecked, JSON.stringify(items));
}

// === Profile ===

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.profile);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// === Body Measurements ===

export function getBodyMeasurements(): BodyMeasurement[] {
  return load<BodyMeasurement>(KEYS.bodyMeasurements);
}

export function saveBodyMeasurement(m: BodyMeasurement) {
  const all = getBodyMeasurements().filter((x) => x.date !== m.date);
  all.push(m);
  all.sort((a, b) => a.date.localeCompare(b.date));
  save(KEYS.bodyMeasurements, all);
}

export function getLatestMeasurement(): BodyMeasurement | undefined {
  const all = getBodyMeasurements();
  return all.length > 0 ? all[all.length - 1] : undefined;
}

// === Weight History (combined from checkins + measurements) ===

export function getWeightHistory(): { date: string; weight: number }[] {
  const map = new Map<string, number>();
  getCheckins().forEach((c) => { if (c.weight) map.set(c.date, c.weight); });
  getBodyMeasurements().forEach((m) => { if (m.weight) map.set(m.date, m.weight); });
  return Array.from(map.entries())
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// === Progress Photos ===

export function getProgressPhotos(): ProgressPhoto[] {
  return load<ProgressPhoto>(KEYS.progressPhotos);
}

export function saveProgressPhoto(photo: ProgressPhoto): void {
  const photos = getProgressPhotos();
  photos.push(photo);
  save(KEYS.progressPhotos, photos);
}

export function deleteProgressPhoto(id: string): void {
  const photos = getProgressPhotos().filter((p) => p.id !== id);
  save(KEYS.progressPhotos, photos);
}

// === Data Export / Import ===

export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  Object.entries(KEYS).forEach(([key, storageKey]) => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) data[key] = JSON.parse(raw);
    } catch { /* skip corrupted */ }
  });
  // Also export settings, phase override and custom programs
  const settings = localStorage.getItem(SETTINGS_KEY);
  if (settings) data["settings"] = JSON.parse(settings);
  const override = localStorage.getItem("mark-pt-phase-override");
  if (override) data["phaseOverride"] = override;
  for (let i = 0; i < 8; i++) {
    const custom = localStorage.getItem("mark-pt-custom-program-" + i);
    if (custom) data["customProgram" + i] = JSON.parse(custom);
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (typeof data !== "object" || data === null) return false;
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      if (data[key]) localStorage.setItem(storageKey, JSON.stringify(data[key]));
    });
    if (data["settings"]) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data["settings"]));
    if (data["phaseOverride"]) localStorage.setItem("mark-pt-phase-override", data["phaseOverride"]);
    for (let i = 0; i < 8; i++) {
      if (data["customProgram" + i]) {
        localStorage.setItem("mark-pt-custom-program-" + i, JSON.stringify(data["customProgram" + i]));
      }
    }
    return true;
  } catch { return false; }
}

/**
 * Export sessions as CSV compatible with Strong/Hevy apps.
 * Columns: Date, Workout Name, Exercise Name, Set Order, Weight, Reps, RPE, Duration (s), Notes
 */
export function exportCSV(): string {
  const sessions = getSessions().filter((s) => s.completed);
  sessions.sort((a, b) => a.date.localeCompare(b.date));

  const rows: string[] = ["Date,Workout Name,Exercise Name,Set Order,Weight,Reps,RPE,Duration (s),Notes"];

  for (const session of sessions) {
    const durationSec = Math.round((session.endTime - session.startTime) / 1000);
    for (const exercise of session.exercises) {
      if (exercise.skipped) continue;
      exercise.sets.forEach((set, idx) => {
        const note = (exercise.notes || "").replace(/"/g, '""');
        rows.push(
          `${session.date},"${session.workoutName}","${exercise.name}",${idx + 1},${set.weight || 0},${set.reps},${set.rpe || ""},${durationSec},"${note}"`
        );
      });
    }
  }

  return rows.join("\n");
}

// === Auto Backup (6.11) ===

const BACKUP_KEY = "mark-pt-auto-backup";
const BACKUP_DATE_KEY = "mark-pt-auto-backup-date";

/** Run auto-backup if enabled — keeps one rolling backup in localStorage */
export function runAutoBackup() {
  if (typeof window === "undefined") return;
  if (!getSettings().autoBackup) return;
  const lastBackup = localStorage.getItem(BACKUP_DATE_KEY);
  const now = today();
  if (lastBackup === now) return; // max once per day
  const data = exportAllData();
  localStorage.setItem(BACKUP_KEY, data);
  localStorage.setItem(BACKUP_DATE_KEY, now);
}

/** Restore from the auto-backup stored in localStorage */
export function restoreAutoBackup(): boolean {
  const data = localStorage.getItem(BACKUP_KEY);
  if (!data) return false;
  return importAllData(data);
}

/** Get the date of the last auto-backup */
export function getAutoBackupDate(): string | null {
  return localStorage.getItem(BACKUP_DATE_KEY);
}
