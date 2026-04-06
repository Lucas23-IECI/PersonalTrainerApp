// =============================================
// Centralized localStorage layer
// All app state persisted with typed helpers
// =============================================

import { findExerciseByName } from "./custom-exercises";

// === Types ===

export interface DailyCheckin {
  date: string; // YYYY-MM-DD
  weight?: number;
  sleepHours?: number;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  bedtime?: string; // HH:MM
  wakeTime?: string; // HH:MM
  energy: 1 | 2 | 3 | 4 | 5;
  soreness: 0 | 1 | 2 | 3;
  notes?: string;
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure' | 'amrap' | 'restpause' | 'myoreps' | 'cluster';

export interface LoggedSet {
  reps: number;
  weight?: number;
  rpe?: number;
  rir?: number;
  setType?: SetType;
  tempo?: string; // e.g. "3-1-2-0" (eccentric-pause-concentric-pause)
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
  fiber?: number;
  sodium?: number; // mg
  sugar?: number;
  photoUrl?: string;
}

export interface CustomMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  slot?: string; // meal slot (Desayuno, Almuerzo, etc.)
  photoUrl?: string;
}

export interface FoodFavorite {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

export interface MyFood {
  id: string;
  name: string;
  brand?: string;
  servingSize: string; // e.g. "100g", "1 unidad", "1 taza"
  servingGrams: number;
  calories: number; // per serving
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

export interface FoodFrequency {
  name: string;
  count: number;
  lastUsed: string; // ISO date
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // liters
  fiber?: number;
  sodium?: number; // mg
  sugar?: number;
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

// === Recipes (6.4) ===

export interface RecipeIngredient {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions?: string;
  prepTime?: number; // minutes
  tags?: string[];
  createdAt: string;
}

// === Pantry / Meal Prep (6.3) ===

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // g, ml, unidades
  category?: string;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  checked: boolean;
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
export type WorkoutViewMode = "today" | "carousel" | "calendar";

export type AccentColor = "blue" | "green" | "red" | "purple" | "orange";
export type LayoutDensity = "compact" | "default" | "expanded";

export interface UserSettings {
  unit: WeightUnit;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  weightIncrement: number; // kg step for +/- buttons (default 2.5)
  language: "es" | "en";
  autoBackup: boolean;
  dailyReminderEnabled: boolean; // 7.15
  reminderHour: number; // 7.15 — 0-23
  reminderMinute: number; // 7.15 — 0-59
  workoutView: WorkoutViewMode;
  sleepGoal: number; // target hours per night (default 8)
  accentColor: AccentColor; // theme accent color (default "blue")
  customTabs: string[]; // selected nav tab hrefs
  layoutDensity: LayoutDensity; // 3.8 — compact/default/expanded
  fontScale: number; // 3.9 — 0.85-1.3 (default 1)
}

const SETTINGS_KEY = "mark-pt-settings";

const DEFAULT_SETTINGS: UserSettings = {
  unit: "kg",
  hapticsEnabled: true,
  soundEnabled: true,
  weightIncrement: 2.5,
  language: "es",
  autoBackup: true,
  dailyReminderEnabled: false,
  reminderHour: 18,
  reminderMinute: 0,
  workoutView: "today",
  sleepGoal: 8,
  accentColor: "blue",
  customTabs: ["/", "/workout", "/exercises", "/nutrition", "/log", "/profile"],
  layoutDensity: "default",
  fontScale: 1,
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
  foodFavorites: "mark-pt-food-favorites",
  foodRecents: "mark-pt-food-recents",
  nutritionTargets: "mark-pt-nutrition-targets",
  myFoods: "mark-pt-my-foods",
  foodFrequency: "mark-pt-food-frequency",
  recipes: "mark-pt-recipes",
  pantry: "mark-pt-pantry",
  mealPrepList: "mark-pt-meal-prep-list",
  goals: "mark-pt-goals",
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

// === Food Favorites ===

export function getFoodFavorites(): FoodFavorite[] {
  return load<FoodFavorite>(KEYS.foodFavorites);
}

export function addFoodFavorite(fav: FoodFavorite) {
  const all = getFoodFavorites().filter((f) => f.id !== fav.id);
  all.push(fav);
  save(KEYS.foodFavorites, all);
}

export function removeFoodFavorite(id: string) {
  save(KEYS.foodFavorites, getFoodFavorites().filter((f) => f.id !== id));
}

// === Recent Foods (max 30) ===

export function getRecentFoods(): CustomMeal[] {
  return load<CustomMeal>(KEYS.foodRecents);
}

export function addRecentFood(food: CustomMeal) {
  const all = getRecentFoods().filter((f) => f.name !== food.name);
  all.unshift(food);
  save(KEYS.foodRecents, all.slice(0, 30));
}

// === Nutrition Targets ===

export function getNutritionTargets(): NutritionTargets {
  if (typeof window === "undefined") return { calories: 2300, protein: 170, carbs: 230, fat: 77, water: 3.0 };
  try {
    const raw = localStorage.getItem(KEYS.nutritionTargets);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  // Try to compute from profile
  const profile = getProfile();
  if (profile && profile.targetCalories > 0) {
    const cal = profile.targetCalories;
    const pro = Math.round(profile.weight * 2.1); // 2.1g/kg
    const fat = Math.round(cal * 0.25 / 9); // 25% from fat
    const carbs = Math.round((cal - pro * 4 - fat * 9) / 4);
    return { calories: cal, protein: pro, carbs: Math.max(carbs, 100), fat, water: 3.0 };
  }
  return { calories: 2300, protein: 170, carbs: 230, fat: 77, water: 3.0 };
}

export function saveNutritionTargets(targets: NutritionTargets) {
  localStorage.setItem(KEYS.nutritionTargets, JSON.stringify(targets));
}

// === My Foods (custom food database) ===

export function getMyFoods(): MyFood[] {
  return load<MyFood>(KEYS.myFoods);
}

export function saveMyFood(food: MyFood) {
  const all = getMyFoods().filter((f) => f.id !== food.id);
  all.push(food);
  all.sort((a, b) => a.name.localeCompare(b.name));
  save(KEYS.myFoods, all);
}

export function deleteMyFood(id: string) {
  save(KEYS.myFoods, getMyFoods().filter((f) => f.id !== id));
}

// === Food Frequency Tracking ===

export function getFoodFrequencies(): FoodFrequency[] {
  return load<FoodFrequency>(KEYS.foodFrequency);
}

export function trackFoodFrequency(name: string, calories: number, protein: number, carbs: number, fat: number, fiber?: number, sodium?: number, sugar?: number) {
  const all = getFoodFrequencies();
  const existing = all.find((f) => f.name === name);
  if (existing) {
    existing.count += 1;
    existing.lastUsed = today();
  } else {
    all.push({ name, count: 1, lastUsed: today(), calories, protein, carbs, fat, fiber, sodium, sugar });
  }
  save(KEYS.foodFrequency, all);
}

export function getFrequentFoods(limit = 20): FoodFrequency[] {
  return getFoodFrequencies()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// === Recipes (6.4) ===

export function getRecipes(): Recipe[] {
  return load<Recipe>(KEYS.recipes);
}

export function saveRecipe(recipe: Recipe) {
  const all = getRecipes().filter((r) => r.id !== recipe.id);
  all.push(recipe);
  all.sort((a, b) => a.name.localeCompare(b.name));
  save(KEYS.recipes, all);
}

export function deleteRecipe(id: string) {
  save(KEYS.recipes, getRecipes().filter((r) => r.id !== id));
}

export function calculateRecipeMacros(ingredients: RecipeIngredient[], servings: number) {
  const total = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
      fiber: acc.fiber + (ing.fiber || 0),
      sodium: acc.sodium + (ing.sodium || 0),
      sugar: acc.sugar + (ing.sugar || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0 },
  );
  const s = Math.max(servings, 1);
  return {
    calories: Math.round(total.calories / s),
    protein: Math.round(total.protein / s * 10) / 10,
    carbs: Math.round(total.carbs / s * 10) / 10,
    fat: Math.round(total.fat / s * 10) / 10,
    fiber: Math.round(total.fiber / s * 10) / 10,
    sodium: Math.round(total.sodium / s),
    sugar: Math.round(total.sugar / s * 10) / 10,
  };
}

// === Pantry / Meal Prep (6.3) ===

export function getPantryItems(): PantryItem[] {
  return load<PantryItem>(KEYS.pantry);
}

export function savePantryItem(item: PantryItem) {
  const all = getPantryItems().filter((p) => p.id !== item.id);
  all.push(item);
  save(KEYS.pantry, all);
}

export function deletePantryItem(id: string) {
  save(KEYS.pantry, getPantryItems().filter((p) => p.id !== id));
}

export function getMealPrepList(): ShoppingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.mealPrepList);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveMealPrepList(items: ShoppingItem[]) {
  localStorage.setItem(KEYS.mealPrepList, JSON.stringify(items));
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
  totalSets: number;
}

export function getWeekStatus(): DayStatus[] {
  const dates = getWeekDates();
  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return dates.map((date, i) => {
    const sessions = getSessionsForDate(date);
    const completedSessions = sessions.filter((s) => s.completed);
    const checkin = getCheckinForDate(date);
    const nutrition = getNutritionForDate(date);
    const totalProtein =
      nutrition.meals.reduce((s, m) => s + m.protein, 0) +
      nutrition.customMeals.reduce((s, m) => s + m.protein, 0);
    const totalSets = completedSessions.reduce(
      (sum, s) => sum + s.exercises.reduce((eSum, e) => eSum + (e.skipped ? 0 : e.sets.length), 0),
      0
    );
    return {
      date,
      dayLabel: dayLabels[i],
      trained: completedSessions.length > 0,
      checkedIn: !!checkin,
      mealsLogged: nutrition.meals.length + nutrition.customMeals.length,
      totalProtein,
      totalSets,
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

// === Weekly Muscle Stats (detailed) ===

export interface WeeklyMuscleStats {
  sets: number;
  volume: number; // total kg lifted
  exercises: string[];
}

export function getWeeklyMuscleData(): Record<string, WeeklyMuscleStats> {
  const dates = getWeekDates();
  const data: Record<string, WeeklyMuscleStats> = {};

  const ensure = (m: string) => {
    if (!data[m]) data[m] = { sets: 0, volume: 0, exercises: [] };
  };

  dates.forEach((date) => {
    const sessions = getSessionsForDate(date).filter((s) => s.completed);
    sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (ex.skipped) return;
        const workingSets = ex.sets.filter((s) => s.setType !== "warmup");
        const setCount = workingSets.length;
        const volume = workingSets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0);

        // Primary muscles get full credit
        if (ex.primaryMuscles) {
          ex.primaryMuscles.forEach((m) => {
            ensure(m);
            data[m].sets += setCount;
            data[m].volume += volume;
            if (!data[m].exercises.includes(ex.name)) data[m].exercises.push(ex.name);
          });
        }

        // Secondary muscles get half credit
        const libEx = findExerciseByName(ex.name);
        if (libEx?.secondaryMuscles) {
          libEx.secondaryMuscles.forEach((m) => {
            ensure(m);
            data[m].sets += Math.round(setCount * 0.5);
            data[m].volume += Math.round(volume * 0.5);
            if (!data[m].exercises.includes(ex.name)) data[m].exercises.push(ex.name);
          });
        }
      });
    });
  });

  return data;
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

// =============================================
// 5.6 — Custom Goals / Countdown
// =============================================

export type GoalType = "weight" | "date" | "strength" | "custom";

export interface UserGoal {
  id: string;
  name: string;
  targetDate: string; // YYYY-MM-DD
  type: GoalType;
  icon: string; // emoji
  color: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  createdAt: string;
}

export function getGoals(): UserGoal[] {
  return load<UserGoal>(KEYS.goals);
}

export function saveGoal(goal: UserGoal): void {
  const all = getGoals();
  const idx = all.findIndex((g) => g.id === goal.id);
  if (idx >= 0) {
    all[idx] = goal;
  } else {
    all.push(goal);
  }
  save(KEYS.goals, all);
}

export function deleteGoal(id: string): void {
  save(KEYS.goals, getGoals().filter((g) => g.id !== id));
}

export function updateGoalProgress(id: string, currentValue: number): void {
  const all = getGoals();
  const goal = all.find((g) => g.id === id);
  if (!goal) return;
  goal.currentValue = currentValue;
  save(KEYS.goals, all);
}
