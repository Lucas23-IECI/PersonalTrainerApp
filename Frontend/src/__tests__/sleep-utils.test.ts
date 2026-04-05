import { describe, it, expect } from 'vitest';
import { calculateSleepHours } from '../lib/sleep-utils';

describe('sleep-utils', () => {
  describe('calculateSleepHours', () => {
    it('calculates normal overnight sleep (23:00 → 07:00 = 8h)', () => {
      expect(calculateSleepHours('23:00', '07:00')).toBe(8);
    });

    it('calculates sleep crossing midnight (00:00 → 08:00 = 8h)', () => {
      expect(calculateSleepHours('00:00', '08:00')).toBe(8);
    });

    it('calculates late night sleep (01:30 → 09:00 = 7.5h)', () => {
      expect(calculateSleepHours('01:30', '09:00')).toBe(7.5);
    });

    it('calculates short sleep (02:00 → 06:00 = 4h)', () => {
      expect(calculateSleepHours('02:00', '06:00')).toBe(4);
    });

    it('calculates early bedtime (21:00 → 05:30 = 8.5h)', () => {
      expect(calculateSleepHours('21:00', '05:30')).toBe(8.5);
    });

    it('handles overnight wrap (22:30 → 06:00 = 7.5h)', () => {
      expect(calculateSleepHours('22:30', '06:00')).toBe(7.5);
    });

    it('handles same hour bedtime/wake across midnight (23:30 → 06:30 = 7h)', () => {
      expect(calculateSleepHours('23:30', '06:30')).toBe(7);
    });

    it('rounds to nearest 0.5', () => {
      // 22:00 → 05:20 = 7h20m → rounds to 7.5
      expect(calculateSleepHours('22:00', '05:20')).toBe(7.5);
    });

    it('handles nap-like same-day (14:00 → 15:30 = 1.5h)', () => {
      expect(calculateSleepHours('14:00', '15:30')).toBe(1.5);
    });
  });
});
