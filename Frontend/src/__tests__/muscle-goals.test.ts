import { describe, it, expect } from 'vitest';
import {
  getMuscleGoals,
  saveMuscleGoals,
  resetMuscleGoals,
  getSetZone,
  getSetZoneColor,
  getMuscleBalanceScore,
  WEEKLY_SET_TARGETS,
} from '../lib/muscle-goals';

describe('muscle-goals', () => {
  describe('WEEKLY_SET_TARGETS', () => {
    it('has targets for 19 muscle groups', () => {
      expect(Object.keys(WEEKLY_SET_TARGETS)).toHaveLength(19);
    });

    it('all targets have min < max', () => {
      for (const [muscle, target] of Object.entries(WEEKLY_SET_TARGETS)) {
        expect(target.min).toBeLessThan(target.max);
      }
    });
  });

  describe('getMuscleGoals / saveMuscleGoals / resetMuscleGoals', () => {
    it('returns defaults when nothing stored', () => {
      const goals = getMuscleGoals();
      expect(goals.chest.min).toBe(WEEKLY_SET_TARGETS.chest.min);
      expect(goals.quads.max).toBe(WEEKLY_SET_TARGETS.quads.max);
    });

    it('saves and loads custom goals', () => {
      const custom = { ...WEEKLY_SET_TARGETS, chest: { min: 15, max: 25 } };
      saveMuscleGoals(custom);
      const loaded = getMuscleGoals();
      expect(loaded.chest.min).toBe(15);
      expect(loaded.chest.max).toBe(25);
    });

    it('reset restores defaults', () => {
      saveMuscleGoals({ ...WEEKLY_SET_TARGETS, chest: { min: 99, max: 99 } });
      resetMuscleGoals();
      const goals = getMuscleGoals();
      expect(goals.chest.min).toBe(WEEKLY_SET_TARGETS.chest.min);
    });
  });

  describe('getSetZone', () => {
    it('returns "under" when below min', () => {
      expect(getSetZone(5, 10, 20)).toBe('under');
    });

    it('returns "optimal" when in range', () => {
      expect(getSetZone(15, 10, 20)).toBe('optimal');
      expect(getSetZone(10, 10, 20)).toBe('optimal'); // at min
      expect(getSetZone(20, 10, 20)).toBe('optimal'); // at max
    });

    it('returns "over" when above max', () => {
      expect(getSetZone(25, 10, 20)).toBe('over');
    });
  });

  describe('getSetZoneColor', () => {
    it('returns correct colors', () => {
      expect(getSetZoneColor('under')).toBe('#FF9500');
      expect(getSetZoneColor('optimal')).toBe('#34C759');
      expect(getSetZoneColor('over')).toBe('#FF453A');
    });
  });

  describe('getMuscleBalanceScore', () => {
    it('returns perfect score for balanced training', () => {
      const data: Record<string, { sets: number }> = {
        chest: { sets: 10 }, front_delts: { sets: 5 }, triceps: { sets: 8 },     // push = 23
        lats: { sets: 10 }, upper_back: { sets: 5 }, rear_delts: { sets: 5 }, biceps: { sets: 3 }, // pull = 23
        side_delts: { sets: 4 }, traps: { sets: 3 }, forearms: { sets: 2 },       // upper extras
        quads: { sets: 12 }, hamstrings: { sets: 8 }, glutes: { sets: 6 },        // lower
        calves: { sets: 4 }, adductors: { sets: 2 }, hip_flexors: { sets: 1 },
        abs: { sets: 6 }, obliques: { sets: 3 }, lower_back: { sets: 3 },
      };
      const result = getMuscleBalanceScore(data);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.details).toHaveLength(3);
    });

    it('detects push/pull imbalance', () => {
      const data: Record<string, { sets: number }> = {
        chest: { sets: 20 }, front_delts: { sets: 10 }, triceps: { sets: 10 }, // push = 40
        lats: { sets: 2 }, upper_back: { sets: 2 }, rear_delts: { sets: 1 }, biceps: { sets: 1 }, // pull = 6
        quads: { sets: 10 }, hamstrings: { sets: 10 }, glutes: { sets: 5 },
      };
      const result = getMuscleBalanceScore(data);
      expect(result.score).toBeLessThan(70);
      expect(result.recommendations.some(r => r.includes('Pull'))).toBe(true);
    });

    it('handles empty data', () => {
      const result = getMuscleBalanceScore({});
      expect(result.score).toBeDefined();
      expect(result.details).toHaveLength(3);
    });

    it('returns encouragement when balanced', () => {
      // All zeros → ratio helper returns 1.0 for 0/0 → score = 100
      const result = getMuscleBalanceScore({});
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
