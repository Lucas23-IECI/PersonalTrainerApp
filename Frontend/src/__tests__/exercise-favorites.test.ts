import { describe, it, expect } from 'vitest';
import { getFavorites, toggleFavorite, getTagsForExercise, addTag, removeTag } from '../lib/exercise-favorites';

describe('exercise-favorites', () => {
  describe('getFavorites / toggleFavorite', () => {
    it('returns empty array by default', () => {
      expect(getFavorites()).toEqual([]);
    });

    it('adds a favorite', () => {
      const result = toggleFavorite('Bench Press');
      expect(result).toBe(true); // added
      expect(getFavorites()).toContain('Bench Press');
    });

    it('removes a favorite on second toggle', () => {
      toggleFavorite('Bench Press'); // add
      const result = toggleFavorite('Bench Press'); // remove
      expect(result).toBe(false);
      expect(getFavorites()).not.toContain('Bench Press');
    });

    it('handles multiple favorites', () => {
      toggleFavorite('Bench Press');
      toggleFavorite('Squat');
      toggleFavorite('Deadlift');
      expect(getFavorites()).toHaveLength(3);
    });
  });

  describe('tags', () => {
    it('returns empty tags by default', () => {
      expect(getTagsForExercise('Bench Press')).toEqual([]);
    });

    it('adds a tag', () => {
      addTag('Bench Press', 'chest');
      expect(getTagsForExercise('Bench Press')).toContain('chest');
    });

    it('does not duplicate tags', () => {
      addTag('Bench Press', 'chest');
      addTag('Bench Press', 'chest');
      expect(getTagsForExercise('Bench Press').filter(t => t === 'chest')).toHaveLength(1);
    });

    it('removes a tag', () => {
      addTag('Bench Press', 'chest');
      addTag('Bench Press', 'push');
      removeTag('Bench Press', 'chest');
      expect(getTagsForExercise('Bench Press')).not.toContain('chest');
      expect(getTagsForExercise('Bench Press')).toContain('push');
    });
  });
});
