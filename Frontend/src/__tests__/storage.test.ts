import { describe, it, expect } from 'vitest';
import { getSettings, saveSettings, kgToLbs, lbsToKg, formatWeight, today, generateId, getTrainingStreak, getSessions } from '../lib/storage';
import type { UserSettings, WorkoutSession } from '../lib/storage';

describe('storage', () => {
  describe('getSettings / saveSettings', () => {
    it('returns defaults when nothing stored', () => {
      const s = getSettings();
      expect(s.unit).toBe('kg');
      expect(s.language).toBe('es');
      expect(s.sleepGoal).toBe(8);
      expect(s.hapticsEnabled).toBe(true);
      expect(s.soundEnabled).toBe(true);
      expect(s.weightIncrement).toBe(2.5);
    });

    it('saves and loads settings', () => {
      const custom: UserSettings = {
        unit: 'lbs',
        hapticsEnabled: false,
        soundEnabled: false,
        weightIncrement: 5,
        language: 'en',
        autoBackup: false,
        dailyReminderEnabled: true,
        reminderHour: 9,
        reminderMinute: 30,
        workoutView: 'carousel',
        sleepGoal: 7,
        accentColor: 'blue',
        customTabs: ['/', '/workout', '/exercises', '/nutrition', '/log', '/profile'],
        layoutDensity: 'default',
        fontScale: 1,
      };
      saveSettings(custom);
      const loaded = getSettings();
      expect(loaded.unit).toBe('lbs');
      expect(loaded.language).toBe('en');
      expect(loaded.sleepGoal).toBe(7);
      expect(loaded.workoutView).toBe('carousel');
    });

    it('merges partial stored settings with defaults', () => {
      localStorage.setItem('mark-pt-settings', JSON.stringify({ unit: 'lbs' }));
      const s = getSettings();
      expect(s.unit).toBe('lbs');
      expect(s.language).toBe('es'); // default
      expect(s.sleepGoal).toBe(8);   // default
    });

    it('handles corrupted JSON gracefully', () => {
      localStorage.setItem('mark-pt-settings', 'not json');
      const s = getSettings();
      expect(s.unit).toBe('kg'); // defaults
    });
  });

  describe('unit conversion', () => {
    it('converts kg to lbs', () => {
      expect(kgToLbs(100)).toBe(220.5);
    });

    it('converts lbs to kg', () => {
      expect(lbsToKg(220.5)).toBe(100);
    });

    it('formats weight in kg', () => {
      expect(formatWeight(80, 'kg')).toBe('80 kg');
    });

    it('formats weight in lbs', () => {
      expect(formatWeight(80, 'lbs')).toBe(`${kgToLbs(80)} lbs`);
    });

    it('handles 0', () => {
      expect(kgToLbs(0)).toBe(0);
      expect(lbsToKg(0)).toBe(0);
    });
  });

  describe('today()', () => {
    it('returns YYYY-MM-DD format', () => {
      const result = today();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('generateId()', () => {
    it('returns a non-empty string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('getTrainingStreak', () => {
    it('returns 0 with no sessions', () => {
      expect(getTrainingStreak()).toBe(0);
    });

    it('counts consecutive days', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const sessions: WorkoutSession[] = [
        createSession(yesterdayStr),
        createSession(todayStr),
      ];
      localStorage.setItem('mark-pt-sessions', JSON.stringify(sessions));
      expect(getTrainingStreak()).toBe(2);
    });

    it('breaks streak on gap day', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      const sessions: WorkoutSession[] = [
        createSession(threeDaysAgoStr),
        createSession(todayStr),
      ];
      localStorage.setItem('mark-pt-sessions', JSON.stringify(sessions));
      // Streak should be 1 (today only, gap breaks the chain)
      expect(getTrainingStreak()).toBe(1);
    });
  });

  describe('getSessions', () => {
    it('returns empty array by default', () => {
      expect(getSessions()).toEqual([]);
    });

    it('returns stored sessions', () => {
      const sessions = [createSession('2025-01-01'), createSession('2025-01-02')];
      localStorage.setItem('mark-pt-sessions', JSON.stringify(sessions));
      expect(getSessions()).toHaveLength(2);
    });
  });
});

// Helper to create a minimal session
function createSession(date: string): WorkoutSession {
  return {
    id: `test-${date}-${Math.random()}`,
    date,
    workoutId: 'test',
    workoutName: 'Test Workout',
    exercises: [],
    completed: true,
    startTime: new Date(date + 'T10:00:00').getTime(),
    endTime: new Date(date + 'T11:00:00').getTime(),
  };
}
