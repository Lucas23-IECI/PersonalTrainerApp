import { describe, it, expect } from 'vitest';
import { getRecoveryColor, getRecoveryLabel, getRecoveryEmoji } from '../lib/muscle-recovery';
import type { RecoveryStatus } from '../lib/muscle-recovery';

describe('muscle-recovery', () => {
  const statuses: RecoveryStatus[] = ['fresh', 'recovered', 'recovering', 'fatigued'];

  describe('getRecoveryColor', () => {
    it('returns a hex color for each status', () => {
      for (const s of statuses) {
        const color = getRecoveryColor(s);
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('returns correct colors', () => {
      expect(getRecoveryColor('fresh')).toBe('#0A84FF');
      expect(getRecoveryColor('recovered')).toBe('#34C759');
      expect(getRecoveryColor('recovering')).toBe('#FFD60A');
      expect(getRecoveryColor('fatigued')).toBe('#FF453A');
    });
  });

  describe('getRecoveryLabel', () => {
    it('returns Spanish labels', () => {
      expect(getRecoveryLabel('fresh')).toBe('Descansado');
      expect(getRecoveryLabel('recovered')).toBe('Recuperado');
      expect(getRecoveryLabel('recovering')).toBe('Recuperando');
      expect(getRecoveryLabel('fatigued')).toBe('Fatigado');
    });
  });

  describe('getRecoveryEmoji', () => {
    it('returns emojis for each status', () => {
      expect(getRecoveryEmoji('fresh')).toBe('🔵');
      expect(getRecoveryEmoji('recovered')).toBe('🟢');
      expect(getRecoveryEmoji('recovering')).toBe('🟡');
      expect(getRecoveryEmoji('fatigued')).toBe('🔴');
    });
  });
});
