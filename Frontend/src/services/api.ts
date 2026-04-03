const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// --- Profile ---
export const getProfile = () => request("/profile");

// --- Exercises ---
export const getExercises = () => request("/exercises");
export const getExerciseById = (id: string) => request(`/exercises/${id}`);
export const getMuscleInfo = () => request("/exercises/muscles");

// --- Workouts ---
export const getWorkouts = () => request("/workouts");
export const getTodayWorkoutApi = () => request("/workouts/today");
export const getWorkoutByIdApi = (id: string) => request(`/workouts/${id}`);

// --- Nutrition Plan ---
export const getNutritionPlan = () => request("/nutrition/plan");
export const getShoppingList = () => request("/nutrition/shopping");
export const getSupplements = () => request("/nutrition/supplements");
export const getCookingLessons = () => request("/nutrition/cooking");

// --- Checkins (CRUD) ---
export const getCheckins = () => request("/checkins");
export const getCheckinByDate = (date: string) => request(`/checkins/${date}`);
export const saveCheckinApi = (checkin: unknown) =>
  request("/checkins", { method: "POST", body: JSON.stringify(checkin) });

// --- Sessions (CRUD) ---
export const getSessions = () => request("/sessions");
export const getSessionsByDate = (date: string) => request(`/sessions/date/${date}`);
export const saveSessionApi = (session: unknown) =>
  request("/sessions", { method: "POST", body: JSON.stringify(session) });
export const deleteSessionApi = (id: string) =>
  request(`/sessions/${id}`, { method: "DELETE" });

// --- Nutrition Log (CRUD) ---
export const getNutritionLog = () => request("/nutrition-log");
export const getNutritionLogByDate = (date: string) => request(`/nutrition-log/${date}`);
export const saveNutritionLogApi = (entry: unknown) =>
  request("/nutrition-log", { method: "POST", body: JSON.stringify(entry) });
