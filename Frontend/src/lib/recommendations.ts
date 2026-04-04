// =============================================
// Routine Recommendations based on Level (3.7)
// Rule-based engine: suggest programs from the library
// =============================================

import { PROGRAM_LIBRARY, type LibraryProgram } from "../data/program-library";
import { getSessions } from "./storage";

export type UserLevel = "beginner" | "intermediate" | "advanced";

/**
 * Estimate user's training level based on session history.
 * - 0-30 sessions → beginner
 * - 31-100 sessions → intermediate
 * - 101+ sessions → advanced
 */
export function estimateUserLevel(): UserLevel {
  const total = getSessions().filter((s) => s.completed).length;
  if (total <= 30) return "beginner";
  if (total <= 100) return "intermediate";
  return "advanced";
}

interface RecommendationCriteria {
  level: UserLevel;
  daysAvailable?: number; // user-provided
  goal?: "strength" | "hypertrophy" | "general";
}

interface Recommendation {
  program: LibraryProgram;
  score: number;
  reasons: string[];
}

/**
 * Score and rank library programs for the user.
 */
export function getRecommendations(criteria?: RecommendationCriteria): Recommendation[] {
  const level = criteria?.level ?? estimateUserLevel();
  const daysAvailable = criteria?.daysAvailable;
  const goal = criteria?.goal;

  const scored: Recommendation[] = PROGRAM_LIBRARY.map((program) => {
    let score = 0;
    const reasons: string[] = [];

    // Level match
    if (program.level === level) {
      score += 30;
      reasons.push(`Nivel ${level} coincide`);
    } else if (
      (level === "beginner" && program.level === "intermediate") ||
      (level === "intermediate" && (program.level === "beginner" || program.level === "advanced")) ||
      (level === "advanced" && program.level === "intermediate")
    ) {
      score += 15;
      reasons.push(`Nivel cercano (${program.level})`);
    }

    // Days per week fit
    if (daysAvailable) {
      const diff = Math.abs(program.daysPerWeek - daysAvailable);
      if (diff === 0) {
        score += 25;
        reasons.push(`${program.daysPerWeek} días/semana, perfecto`);
      } else if (diff === 1) {
        score += 15;
        reasons.push(`${program.daysPerWeek} días/semana (±1)`);
      } else if (diff <= 2) {
        score += 5;
      }
    } else {
      // No preference — slight preference for 4-day programs as most versatile
      score += program.daysPerWeek >= 3 && program.daysPerWeek <= 5 ? 10 : 0;
    }

    // Goal match
    if (goal) {
      const catMap: Record<string, string[]> = {
        strength: ["strength", "powerbuilding"],
        hypertrophy: ["hypertrophy", "bodybuilding"],
        general: ["hypertrophy", "strength", "powerbuilding", "bodyweight"],
      };
      if (catMap[goal]?.includes(program.category)) {
        score += 20;
        reasons.push(`Categoría ${program.category} encaja con tu objetivo`);
      }
    }

    // Beginner-friendly bonus for beginner users
    if (level === "beginner" && program.level === "beginner") {
      score += 10;
      reasons.push("Ideal para empezar");
    }

    return { program, score, reasons };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get top N recommended programs, simplified.
 */
export function getTopRecommendations(
  n = 5,
  criteria?: RecommendationCriteria
): { program: LibraryProgram; reasons: string[] }[] {
  return getRecommendations(criteria)
    .slice(0, n)
    .map((r) => ({ program: r.program, reasons: r.reasons }));
}
