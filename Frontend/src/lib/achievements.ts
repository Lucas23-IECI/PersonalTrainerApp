// =============================================
// Achievement/Badge System
// ~35 badges across 6 categories
// =============================================

import {
  getSessions,
  getTrainingStreak,
  getCheckins,
  getWeeklyMuscleHits,
  getWeightHistory,
  getProgressPhotos,
  getBodyMeasurements,
  type WorkoutSession,
  safeGetItem,
  safeSetItem,
} from "./storage";

// === Types ===

export type BadgeCategory =
  | "consistency"
  | "volume"
  | "sessions"
  | "strength"
  | "body"
  | "exploration";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: BadgeCategory;
  tier: "bronze" | "silver" | "gold" | "diamond";
  check: (ctx: AchievementContext) => boolean;
}

export interface UnlockedBadge {
  id: string;
  unlockedAt: number; // timestamp
}

export interface AchievementContext {
  sessions: WorkoutSession[];
  completedSessions: WorkoutSession[];
  streak: number;
  totalVolume: number;
  totalSets: number;
  uniqueExercises: Set<string>;
  uniqueMuscles: Set<string>;
  weeklyMuscleHits: Record<string, number>;
  weightEntries: { date: string; weight: number }[];
  photos: number;
  measurements: number;
  checkins: number;
  prCount: number;
  maxSessionDuration: number; // minutes
  daysWithTraining: number;
}

// === Storage ===

const BADGES_KEY = "mark-pt-badges";

export function getUnlockedBadges(): UnlockedBadge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(BADGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUnlockedBadges(badges: UnlockedBadge[]) {
  safeSetItem(BADGES_KEY, JSON.stringify(badges));
}

// === Badge Definitions (~35) ===

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --- CONSISTENCY (streaks & check-ins) ---
  { id: "streak_3", name: "En Racha", description: "3 días seguidos entrenando", icon: "🔥", category: "consistency", tier: "bronze", check: (c) => c.streak >= 3 },
  { id: "streak_7", name: "Semana Perfecta", description: "7 días seguidos entrenando", icon: "🔥", category: "consistency", tier: "silver", check: (c) => c.streak >= 7 },
  { id: "streak_14", name: "Imparable", description: "14 días seguidos entrenando", icon: "🔥", category: "consistency", tier: "gold", check: (c) => c.streak >= 14 },
  { id: "streak_30", name: "Máquina", description: "30 días seguidos entrenando", icon: "💎", category: "consistency", tier: "diamond", check: (c) => c.streak >= 30 },
  { id: "checkin_7", name: "Primer Check-in", description: "7 check-ins diarios", icon: "📋", category: "consistency", tier: "bronze", check: (c) => c.checkins >= 7 },
  { id: "checkin_30", name: "Disciplinado", description: "30 check-ins diarios", icon: "📋", category: "consistency", tier: "silver", check: (c) => c.checkins >= 30 },
  { id: "checkin_100", name: "Método", description: "100 check-ins diarios", icon: "📋", category: "consistency", tier: "gold", check: (c) => c.checkins >= 100 },

  // --- SESSIONS (count milestones) ---
  { id: "session_1", name: "Primera Sesión", description: "Completar tu primera sesión", icon: "💪", category: "sessions", tier: "bronze", check: (c) => c.completedSessions.length >= 1 },
  { id: "session_10", name: "Comprometido", description: "10 sesiones completadas", icon: "💪", category: "sessions", tier: "bronze", check: (c) => c.completedSessions.length >= 10 },
  { id: "session_25", name: "Habitual", description: "25 sesiones completadas", icon: "💪", category: "sessions", tier: "silver", check: (c) => c.completedSessions.length >= 25 },
  { id: "session_50", name: "Dedicado", description: "50 sesiones completadas", icon: "🏋️", category: "sessions", tier: "silver", check: (c) => c.completedSessions.length >= 50 },
  { id: "session_100", name: "Centurión", description: "100 sesiones completadas", icon: "🏋️", category: "sessions", tier: "gold", check: (c) => c.completedSessions.length >= 100 },
  { id: "session_200", name: "Veterano", description: "200 sesiones completadas", icon: "🏋️", category: "sessions", tier: "gold", check: (c) => c.completedSessions.length >= 200 },
  { id: "session_365", name: "Un Año Entrenando", description: "365 sesiones completadas", icon: "👑", category: "sessions", tier: "diamond", check: (c) => c.completedSessions.length >= 365 },
  { id: "days_30", name: "Mes Activo", description: "30 días diferentes con entrenamiento", icon: "📅", category: "sessions", tier: "silver", check: (c) => c.daysWithTraining >= 30 },
  { id: "days_100", name: "100 Días", description: "100 días diferentes entrenados", icon: "📅", category: "sessions", tier: "gold", check: (c) => c.daysWithTraining >= 100 },
  { id: "long_session", name: "Maratón", description: "Sesión de más de 90 minutos", icon: "⏱️", category: "sessions", tier: "silver", check: (c) => c.maxSessionDuration >= 90 },

  // --- VOLUME (total kg lifted) ---
  { id: "vol_1000", name: "Primera Tonelada", description: "1,000 kg levantados en total", icon: "🏗️", category: "volume", tier: "bronze", check: (c) => c.totalVolume >= 1000 },
  { id: "vol_10000", name: "10 Toneladas", description: "10,000 kg levantados en total", icon: "🏗️", category: "volume", tier: "silver", check: (c) => c.totalVolume >= 10000 },
  { id: "vol_50000", name: "50 Toneladas", description: "50,000 kg levantados en total", icon: "🏗️", category: "volume", tier: "gold", check: (c) => c.totalVolume >= 50000 },
  { id: "vol_100000", name: "100 Toneladas", description: "100,000 kg levantados en total", icon: "⚡", category: "volume", tier: "gold", check: (c) => c.totalVolume >= 100000 },
  { id: "vol_500000", name: "Medio Millón", description: "500,000 kg levantados", icon: "💎", category: "volume", tier: "diamond", check: (c) => c.totalVolume >= 500000 },
  { id: "sets_100", name: "100 Series", description: "100 series completadas en total", icon: "🔄", category: "volume", tier: "bronze", check: (c) => c.totalSets >= 100 },
  { id: "sets_500", name: "500 Series", description: "500 series completadas", icon: "🔄", category: "volume", tier: "silver", check: (c) => c.totalSets >= 500 },
  { id: "sets_2000", name: "2000 Series", description: "2,000 series completadas", icon: "🔄", category: "volume", tier: "gold", check: (c) => c.totalSets >= 2000 },

  // --- STRENGTH (PRs) ---
  { id: "pr_first", name: "Primer PR", description: "Lograr tu primer récord personal", icon: "🏆", category: "strength", tier: "bronze", check: (c) => c.prCount >= 1 },
  { id: "pr_10", name: "Cazador de PRs", description: "10 récords personales", icon: "🏆", category: "strength", tier: "silver", check: (c) => c.prCount >= 10 },
  { id: "pr_50", name: "Rompedor de Récords", description: "50 récords personales", icon: "🏆", category: "strength", tier: "gold", check: (c) => c.prCount >= 50 },

  // --- BODY (measurements, photos, weight) ---
  { id: "photo_1", name: "Primer Foto", description: "Subir tu primera foto de progreso", icon: "📸", category: "body", tier: "bronze", check: (c) => c.photos >= 1 },
  { id: "photo_10", name: "Diario Visual", description: "10 fotos de progreso", icon: "📸", category: "body", tier: "silver", check: (c) => c.photos >= 10 },
  { id: "measure_1", name: "Primera Medición", description: "Registrar tu primera medición corporal", icon: "📏", category: "body", tier: "bronze", check: (c) => c.measurements >= 1 },
  { id: "measure_10", name: "Seguimiento Corporal", description: "10 mediciones corporales", icon: "📏", category: "body", tier: "silver", check: (c) => c.measurements >= 10 },
  { id: "weight_track", name: "Báscula Constante", description: "20 registros de peso", icon: "⚖️", category: "body", tier: "silver", check: (c) => c.weightEntries.length >= 20 },

  // --- EXPLORATION (variety) ---
  { id: "ex_10", name: "Variado", description: "Probar 10 ejercicios diferentes", icon: "🎯", category: "exploration", tier: "bronze", check: (c) => c.uniqueExercises.size >= 10 },
  { id: "ex_25", name: "Explorador", description: "Probar 25 ejercicios diferentes", icon: "🎯", category: "exploration", tier: "silver", check: (c) => c.uniqueExercises.size >= 25 },
  { id: "ex_50", name: "Enciclopedia", description: "Probar 50 ejercicios diferentes", icon: "🧠", category: "exploration", tier: "gold", check: (c) => c.uniqueExercises.size >= 50 },
  { id: "muscle_all", name: "Full Body", description: "Entrenar los 19 grupos musculares", icon: "🦾", category: "exploration", tier: "gold", check: (c) => c.uniqueMuscles.size >= 19 },
];

// === Category labels ===

export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  consistency: "Consistencia",
  volume: "Volumen",
  sessions: "Sesiones",
  strength: "Fuerza",
  body: "Cuerpo",
  exploration: "Exploración",
};

export const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  diamond: "#B9F2FF",
};

// === Context Builder ===

function countPRs(sessions: WorkoutSession[]): number {
  // Track best e1rm per exercise; count how many times a new top was set
  const bestE1rm: Record<string, number> = {};
  let prCount = 0;

  const sorted = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime - b.startTime);

  for (const session of sorted) {
    for (const ex of session.exercises) {
      if (ex.skipped) continue;
      for (const set of ex.sets) {
        if (!set.weight || set.weight === 0 || set.reps === 0) continue;
        const e1rm = set.weight * (1 + set.reps / 30);
        const key = ex.name.toLowerCase();
        if (!bestE1rm[key] || e1rm > bestE1rm[key]) {
          if (bestE1rm[key]) prCount++; // don't count first entry as PR
          bestE1rm[key] = e1rm;
        }
      }
    }
  }
  return prCount;
}

export function buildAchievementContext(): AchievementContext {
  const sessions = getSessions();
  const completedSessions = sessions.filter((s) => s.completed);
  const streak = getTrainingStreak();
  const checkins = getCheckins();
  const weeklyMuscleHits = getWeeklyMuscleHits();
  const weightEntries = getWeightHistory();
  const photos = getProgressPhotos();
  const measurements = getBodyMeasurements();

  let totalVolume = 0;
  let totalSets = 0;
  const uniqueExercises = new Set<string>();
  const uniqueMuscles = new Set<string>();
  let maxSessionDuration = 0;
  const trainedDates = new Set<string>();

  for (const session of completedSessions) {
    trainedDates.add(session.date);
    const dur = (session.endTime - session.startTime) / 60000;
    if (dur > maxSessionDuration) maxSessionDuration = dur;

    for (const ex of session.exercises) {
      if (ex.skipped) continue;
      uniqueExercises.add(ex.name.toLowerCase());
      if (ex.primaryMuscles) {
        ex.primaryMuscles.forEach((m) => uniqueMuscles.add(m));
      }
      for (const set of ex.sets) {
        totalSets++;
        if (set.weight) totalVolume += set.weight * set.reps;
      }
    }
  }

  return {
    sessions,
    completedSessions,
    streak,
    totalVolume,
    totalSets,
    uniqueExercises,
    uniqueMuscles,
    weeklyMuscleHits,
    weightEntries,
    photos: photos.length,
    measurements: measurements.length,
    checkins: checkins.length,
    prCount: countPRs(sessions),
    maxSessionDuration,
    daysWithTraining: trainedDates.size,
  };
}

// === Evaluation ===

export function evaluateAchievements(): {
  unlocked: UnlockedBadge[];
  newlyUnlocked: BadgeDefinition[];
} {
  const ctx = buildAchievementContext();
  const existing = getUnlockedBadges();
  const existingIds = new Set(existing.map((b) => b.id));
  const newlyUnlocked: BadgeDefinition[] = [];
  const allUnlocked = [...existing];

  for (const badge of BADGE_DEFINITIONS) {
    if (existingIds.has(badge.id)) continue;
    if (badge.check(ctx)) {
      allUnlocked.push({ id: badge.id, unlockedAt: Date.now() });
      newlyUnlocked.push(badge);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedBadges(allUnlocked);
  }

  return { unlocked: allUnlocked, newlyUnlocked };
}

export function getAchievementStats() {
  const unlocked = getUnlockedBadges();
  const total = BADGE_DEFINITIONS.length;
  return {
    unlocked: unlocked.length,
    total,
    percentage: total > 0 ? Math.round((unlocked.length / total) * 100) : 0,
  };
}
