import { describe, it, expect } from 'vitest';
import {
  getVolumeLandmarks,
  getAllVolumeLandmarks,
  getVolumeZone,
  ZONE_COLORS,
  ZONE_LABELS,
  type VolumeLandmarks,
  type VolumeZone,
} from '../data/volume-landmarks';
import type { Phase } from '../data/phases';

const mockPhase = (type: Phase["type"]): Phase => ({
  id: 1,
  name: "Test",
  type,
  startDate: "2026-01-01",
  endDate: "2026-02-01",
  rpeRange: [7, 8],
  repRangeCompound: "8-12",
  repRangeAccessory: "10-15",
  volumeLevel: "high",
  splitType: "5day",
  description: "Test phase",
});

describe('volume-landmarks', () => {
  describe('getVolumeLandmarks', () => {
    it('returns landmarks for accumulation (base multiplier)', () => {
      const lm = getVolumeLandmarks('chest', mockPhase('accumulation'));
      expect(lm.mev).toBe(8);
      expect(lm.mav).toBe(16);
      expect(lm.mrv).toBe(22);
    });

    it('returns reduced landmarks for deload phase', () => {
      const lm = getVolumeLandmarks('chest', mockPhase('deload'));
      // deload multiplier is 0.4
      expect(lm.mev).toBe(Math.round(8 * 0.4));
      expect(lm.mav).toBe(Math.round(16 * 0.4));
      expect(lm.mrv).toBe(Math.round(22 * 0.4));
    });

    it('returns reduced landmarks for reactivation phase', () => {
      const lm = getVolumeLandmarks('quads', mockPhase('reactivation'));
      // reactivation multiplier is 0.6
      expect(lm.mev).toBe(Math.round(8 * 0.6));
      expect(lm.mav).toBe(Math.round(16 * 0.6));
      expect(lm.mrv).toBe(Math.round(22 * 0.6));
    });

    it('returns landmarks for intensification (0.8x)', () => {
      const lm = getVolumeLandmarks('biceps', mockPhase('intensification'));
      expect(lm.mev).toBe(Math.round(8 * 0.8));
      expect(lm.mav).toBe(Math.round(16 * 0.8));
      expect(lm.mrv).toBe(Math.round(22 * 0.8));
    });
  });

  describe('getAllVolumeLandmarks', () => {
    it('returns landmarks for all 19 muscle groups', () => {
      const all = getAllVolumeLandmarks(mockPhase('accumulation'));
      const muscles = Object.keys(all);
      expect(muscles.length).toBe(19);
      expect(muscles).toContain('chest');
      expect(muscles).toContain('quads');
      expect(muscles).toContain('adductors');
    });

    it('all landmarks have valid values', () => {
      const all = getAllVolumeLandmarks(mockPhase('accumulation'));
      for (const [, lm] of Object.entries(all)) {
        expect(lm.mev).toBeGreaterThan(0);
        expect(lm.mav).toBeGreaterThan(lm.mev);
        expect(lm.mrv).toBeGreaterThan(lm.mav);
      }
    });
  });

  describe('getVolumeZone', () => {
    const landmarks: VolumeLandmarks = { mev: 8, mav: 16, mrv: 22 };

    it('returns below_mev when under MEV', () => {
      expect(getVolumeZone(4, landmarks)).toBe('below_mev');
    });

    it('returns productive when between MEV and MAV', () => {
      expect(getVolumeZone(12, landmarks)).toBe('productive');
    });

    it('returns approaching_mrv when between MAV and MRV', () => {
      expect(getVolumeZone(18, landmarks)).toBe('approaching_mrv');
    });

    it('returns over_mrv when above MRV', () => {
      expect(getVolumeZone(25, landmarks)).toBe('over_mrv');
    });

    it('handles exact MEV boundary', () => {
      expect(getVolumeZone(8, landmarks)).toBe('productive');
    });

    it('handles exact MRV boundary', () => {
      expect(getVolumeZone(22, landmarks)).toBe('approaching_mrv');
    });
  });

  describe('ZONE_COLORS', () => {
    it('has colors for all zones', () => {
      const zones: VolumeZone[] = ['below_mev', 'productive', 'approaching_mrv', 'over_mrv'];
      for (const z of zones) {
        expect(ZONE_COLORS[z]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('ZONE_LABELS', () => {
    it('has Spanish labels for all zones', () => {
      expect(ZONE_LABELS.below_mev).toBe('Bajo MEV');
      expect(ZONE_LABELS.productive).toBe('Zona productiva');
      expect(ZONE_LABELS.approaching_mrv).toBe('Cerca del MRV');
      expect(ZONE_LABELS.over_mrv).toBe('Sobre MRV ⚠️');
    });
  });
});
