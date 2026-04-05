import { describe, it, expect } from 'vitest';
import {
  TIMER_PRESETS,
  MODE_LABELS,
  MODE_COLORS,
  MODE_DESCRIPTIONS,
  getTimerHistory,
  saveTimerSession,
  type TimerSession,
} from '../lib/timer-presets';

describe('timer-presets', () => {
  describe('TIMER_PRESETS', () => {
    it('has 9 presets', () => {
      expect(TIMER_PRESETS).toHaveLength(9);
    });

    it('has Tabata, EMOM, and AMRAP modes', () => {
      const modes = new Set(TIMER_PRESETS.map((p) => p.mode));
      expect(modes).toContain('tabata');
      expect(modes).toContain('emom');
      expect(modes).toContain('amrap');
    });

    it('all presets have positive work seconds', () => {
      for (const p of TIMER_PRESETS) {
        expect(p.workSec).toBeGreaterThan(0);
        expect(p.rounds).toBeGreaterThan(0);
      }
    });

    it('all presets have unique ids', () => {
      const ids = TIMER_PRESETS.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('MODE_LABELS / COLORS / DESCRIPTIONS', () => {
    it('covers all 4 modes', () => {
      const modes = ['tabata', 'emom', 'amrap', 'custom'] as const;
      for (const m of modes) {
        expect(MODE_LABELS[m]).toBeTruthy();
        expect(MODE_COLORS[m]).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(MODE_DESCRIPTIONS[m]).toBeTruthy();
      }
    });
  });

  describe('getTimerHistory / saveTimerSession', () => {
    it('returns empty array by default', () => {
      expect(getTimerHistory()).toEqual([]);
    });

    it('saves and loads a session', () => {
      const session: TimerSession = {
        id: 'test1', date: '2025-01-01', mode: 'tabata',
        presetName: 'Tabata Clásico', totalSec: 240,
        roundsCompleted: 8, roundsTotal: 8,
      };
      saveTimerSession(session);
      const history = getTimerHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('test1');
    });

    it('keeps max 50 sessions (FIFO)', () => {
      for (let i = 0; i < 55; i++) {
        saveTimerSession({
          id: `s${i}`, date: '2025-01-01', mode: 'tabata',
          presetName: 'Test', totalSec: 100,
          roundsCompleted: 8, roundsTotal: 8,
        });
      }
      expect(getTimerHistory()).toHaveLength(50);
    });

    it('newest session is first', () => {
      saveTimerSession({
        id: 'first', date: '2025-01-01', mode: 'emom',
        presetName: 'A', totalSec: 600, roundsCompleted: 10, roundsTotal: 10,
      });
      saveTimerSession({
        id: 'second', date: '2025-01-02', mode: 'amrap',
        presetName: 'B', totalSec: 900, roundsCompleted: 5, roundsTotal: 1,
      });
      const history = getTimerHistory();
      expect(history[0].id).toBe('second');
      expect(history[1].id).toBe('first');
    });
  });
});
