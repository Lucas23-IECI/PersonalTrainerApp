import { describe, it, expect, vi } from 'vitest';
import {
  BADGE_DEFINITIONS,
  CATEGORY_LABELS,
  TIER_COLORS,
  getUnlockedBadges,
  getAchievementStats,
  type AchievementContext,
  type BadgeCategory,
} from '../lib/achievements';

describe('achievements', () => {
  describe('BADGE_DEFINITIONS', () => {
    it('has 37 badges', () => {
      expect(BADGE_DEFINITIONS.length).toBe(37);
    });

    it('every badge has unique id', () => {
      const ids = BADGE_DEFINITIONS.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every badge has required fields', () => {
      for (const b of BADGE_DEFINITIONS) {
        expect(b.id).toBeTruthy();
        expect(b.name).toBeTruthy();
        expect(b.description).toBeTruthy();
        expect(b.icon).toBeTruthy();
        expect(['consistency', 'volume', 'sessions', 'strength', 'body', 'exploration']).toContain(b.category);
        expect(['bronze', 'silver', 'gold', 'diamond']).toContain(b.tier);
        expect(typeof b.check).toBe('function');
      }
    });

    it('covers all 6 categories', () => {
      const categories = new Set(BADGE_DEFINITIONS.map((b) => b.category));
      expect(categories.size).toBe(6);
    });

    it('covers all 4 tiers', () => {
      const tiers = new Set(BADGE_DEFINITIONS.map((b) => b.tier));
      expect(tiers.size).toBe(4);
    });
  });

  describe('badge check functions', () => {
    function makeCtx(overrides: Partial<AchievementContext> = {}): AchievementContext {
      return {
        sessions: [],
        completedSessions: [],
        streak: 0,
        totalVolume: 0,
        totalSets: 0,
        uniqueExercises: new Set<string>(),
        uniqueMuscles: new Set<string>(),
        weeklyMuscleHits: {},
        weightEntries: [],
        photos: 0,
        measurements: 0,
        checkins: 0,
        prCount: 0,
        maxSessionDuration: 0,
        daysWithTraining: 0,
        ...overrides,
      };
    }

    it('streak_3 unlocks at 3-day streak', () => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 'streak_3')!;
      expect(badge.check(makeCtx({ streak: 2 }))).toBe(false);
      expect(badge.check(makeCtx({ streak: 3 }))).toBe(true);
    });

    it('session_1 unlocks with 1 completed session', () => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 'session_1')!;
      expect(badge.check(makeCtx({ completedSessions: [] }))).toBe(false);
      expect(badge.check(makeCtx({ completedSessions: [{} as any] }))).toBe(true);
    });

    it('vol_1000 unlocks at 1000 kg', () => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 'vol_1000')!;
      expect(badge.check(makeCtx({ totalVolume: 999 }))).toBe(false);
      expect(badge.check(makeCtx({ totalVolume: 1000 }))).toBe(true);
    });

    it('pr_first unlocks at 1 PR', () => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 'pr_first')!;
      expect(badge.check(makeCtx({ prCount: 0 }))).toBe(false);
      expect(badge.check(makeCtx({ prCount: 1 }))).toBe(true);
    });

    it('photo_1 unlocks with 1 photo', () => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 'photo_1')!;
      expect(badge.check(makeCtx({ photos: 0 }))).toBe(false);
      expect(badge.check(makeCtx({ photos: 1 }))).toBe(true);
    });

    it('ex_10 unlocks with 10 unique exercises', () => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 'ex_10')!;
      const small = new Set(['a', 'b', 'c']);
      const enough = new Set(Array.from({ length: 10 }, (_, i) => `ex_${i}`));
      expect(badge.check(makeCtx({ uniqueExercises: small }))).toBe(false);
      expect(badge.check(makeCtx({ uniqueExercises: enough }))).toBe(true);
    });

    it('long_session unlocks at 90 min', () => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 'long_session')!;
      expect(badge.check(makeCtx({ maxSessionDuration: 89 }))).toBe(false);
      expect(badge.check(makeCtx({ maxSessionDuration: 90 }))).toBe(true);
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('has label for every category', () => {
      const cats: BadgeCategory[] = ['consistency', 'volume', 'sessions', 'strength', 'body', 'exploration'];
      for (const c of cats) {
        expect(typeof CATEGORY_LABELS[c]).toBe('string');
        expect(CATEGORY_LABELS[c].length).toBeGreaterThan(0);
      }
    });
  });

  describe('TIER_COLORS', () => {
    it('has color for every tier', () => {
      for (const tier of ['bronze', 'silver', 'gold', 'diamond']) {
        expect(TIER_COLORS[tier]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('storage helpers', () => {
    it('getUnlockedBadges returns empty array by default', () => {
      expect(getUnlockedBadges()).toEqual([]);
    });

    it('getAchievementStats returns zero progress by default', () => {
      const stats = getAchievementStats();
      expect(stats.unlocked).toBe(0);
      expect(stats.total).toBe(37);
      expect(stats.percentage).toBe(0);
    });
  });
});
