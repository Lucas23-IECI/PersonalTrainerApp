import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FATIGUE_COLORS, FATIGUE_LABELS } from '../lib/deload';
import type { FatigueScore } from '../lib/deload';

describe('deload — fatigue model (5.2)', () => {
  describe('FATIGUE_COLORS', () => {
    it('has hex colors for all fatigue levels', () => {
      const levels: FatigueScore["level"][] = ['fresh', 'managed', 'accumulating', 'high', 'critical'];
      for (const level of levels) {
        expect(FATIGUE_COLORS[level]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('FATIGUE_LABELS', () => {
    it('has Spanish labels for all fatigue levels', () => {
      expect(FATIGUE_LABELS.fresh).toBe('Fresco');
      expect(FATIGUE_LABELS.managed).toBe('Controlada');
      expect(FATIGUE_LABELS.accumulating).toBe('Acumulando');
      expect(FATIGUE_LABELS.high).toBe('Alta');
      expect(FATIGUE_LABELS.critical).toBe('Crítica');
    });
  });

  describe('getDeloadModifiers', () => {
    it('returns standard deload params', async () => {
      const { getDeloadModifiers } = await import('../lib/deload');
      const mods = getDeloadModifiers();
      expect(mods.weightMultiplier).toBe(0.6);
      expect(mods.setsReduction).toBe(1);
      expect(mods.rpeTarget).toBe('6-7');
    });
  });
});
