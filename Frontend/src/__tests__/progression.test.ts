import { describe, it, expect } from 'vitest';
import { getExerciseHistory, getWarmupSets, isNewPR } from '../lib/progression';
import type { WorkoutSession } from '../lib/storage';

describe('progression', () => {
  describe('getExerciseHistory', () => {
    it('returns empty array with no sessions', () => {
      expect(getExerciseHistory('Bench Press')).toEqual([]);
    });

    it('extracts history for a specific exercise', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's1', date: '2025-01-01', workoutId: 'w1', workoutName: 'Push',
          completed: true, startTime: 0, endTime: 0,
          exercises: [{
            name: 'Bench Press', plannedSets: 3, plannedReps: '8-12',
            sets: [
              { reps: 10, weight: 80, rpe: 7 },
              { reps: 8, weight: 85, rpe: 8 },
            ],
            skipped: false,
          }],
        },
        {
          id: 's2', date: '2025-01-03', workoutId: 'w1', workoutName: 'Push',
          completed: true, startTime: 0, endTime: 0,
          exercises: [{
            name: 'Squat', plannedSets: 3, plannedReps: '5-8',
            sets: [{ reps: 5, weight: 120 }],
            skipped: false,
          }],
        },
      ];
      localStorage.setItem('mark-pt-sessions', JSON.stringify(sessions));

      const history = getExerciseHistory('Bench Press');
      expect(history).toHaveLength(1);
      expect(history[0].topSet.weight).toBe(85);
      expect(history[0].avgRpe).toBeCloseTo(7.5);
    });

    it('skips uncompleted sessions', () => {
      const sessions: WorkoutSession[] = [{
        id: 's1', date: '2025-01-01', workoutId: 'w1', workoutName: 'Push',
        completed: false, startTime: 0, endTime: 0,
        exercises: [{
          name: 'Bench Press', plannedSets: 3, plannedReps: '8-12',
          sets: [{ reps: 10, weight: 80 }], skipped: false,
        }],
      }];
      localStorage.setItem('mark-pt-sessions', JSON.stringify(sessions));
      expect(getExerciseHistory('Bench Press')).toEqual([]);
    });
  });

  describe('getWarmupSets', () => {
    it('returns empty for light weights (≤10kg)', () => {
      expect(getWarmupSets(10)).toEqual([]);
      expect(getWarmupSets(5)).toEqual([]);
    });

    it('returns bar + 50% for 20-39kg', () => {
      const sets = getWarmupSets(30);
      expect(sets).toHaveLength(2);
      expect(sets[0]).toEqual({ weight: 0, reps: 10 }); // bar
      expect(sets[1].reps).toBe(5); // 50% set
    });

    it('returns bar + 50% + 70% for ≥40kg', () => {
      const sets = getWarmupSets(100);
      expect(sets).toHaveLength(3);
      expect(sets[0]).toEqual({ weight: 0, reps: 10 });
      expect(sets[1]).toEqual({ weight: 50, reps: 5 });   // 50% of 100
      expect(sets[2]).toEqual({ weight: 70, reps: 3 });   // 70% of 100
    });

    it('rounds warmup weights to nearest 2.5', () => {
      const sets = getWarmupSets(73);
      // 50% of 73 = 36.5 → rounds to 37.5
      expect(sets[1].weight % 2.5).toBe(0);
      // 70% of 73 = 51.1 → rounds to 52.5 or 50
      expect(sets[2].weight % 2.5).toBe(0);
    });
  });

  describe('isNewPR', () => {
    it('returns false with no history', () => {
      expect(isNewPR('Bench Press', { reps: 10, weight: 80 })).toEqual({ isPR: false });
    });

    it('detects weight PR', () => {
      const sessions: WorkoutSession[] = [{
        id: 's1', date: '2025-01-01', workoutId: 'w1', workoutName: 'Push',
        completed: true, startTime: 0, endTime: 0,
        exercises: [{
          name: 'Bench Press', plannedSets: 3, plannedReps: '8-12',
          sets: [{ reps: 8, weight: 80 }], skipped: false,
        }],
      }];
      localStorage.setItem('mark-pt-sessions', JSON.stringify(sessions));

      const result = isNewPR('Bench Press', { reps: 5, weight: 90 });
      expect(result.isPR).toBe(true);
      expect(result.type).toBe('weight');
    });

    it('detects e1RM PR', () => {
      const sessions: WorkoutSession[] = [{
        id: 's1', date: '2025-01-01', workoutId: 'w1', workoutName: 'Push',
        completed: true, startTime: 0, endTime: 0,
        exercises: [{
          name: 'Bench Press', plannedSets: 3, plannedReps: '8-12',
          sets: [{ reps: 5, weight: 100 }], // e1rm = 100 * (1 + 5/30) = 116.67
          skipped: false,
        }],
      }];
      localStorage.setItem('mark-pt-sessions', JSON.stringify(sessions));

      // Same weight, more reps → higher e1RM
      const result = isNewPR('Bench Press', { reps: 10, weight: 100 }); // e1rm = 100 * (1 + 10/30) = 133.33
      expect(result.isPR).toBe(true);
    });
  });
});
