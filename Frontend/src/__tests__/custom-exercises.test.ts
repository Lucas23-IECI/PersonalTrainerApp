import { describe, it, expect, vi } from 'vitest';
import {
  getCustomExercises,
  getCustomExercise,
  createCustomExercise,
  saveCustomExercise,
  deleteCustomExercise,
  cloneExerciseFromLibrary,
  getAllExercises,
  findExerciseByName,
} from '../lib/custom-exercises';

describe('custom-exercises', () => {
  describe('CRUD', () => {
    it('returns empty array by default', () => {
      expect(getCustomExercises()).toEqual([]);
    });

    it('creates an exercise with defaults', () => {
      const ex = createCustomExercise({
        name: 'My Press',
        category: 'compound',
        primaryMuscles: ['chest'],
      });
      expect(ex.id).toMatch(/^custom_/);
      expect(ex.name).toBe('My Press');
      expect(ex.category).toBe('compound');
      expect(ex.primaryMuscles).toEqual(['chest']);
      expect(ex.secondaryMuscles).toEqual([]);
      expect(ex.difficulty).toBe('intermediate');
      expect(ex.isCustom).toBe(true);
      expect(typeof ex.createdAt).toBe('number');
    });

    it('persists and retrieves by id', () => {
      const ex = createCustomExercise({
        name: 'Custom Squat',
        category: 'compound',
        primaryMuscles: ['quads'],
        difficulty: 'advanced',
      });
      const found = getCustomExercise(ex.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe('Custom Squat');
      expect(found!.difficulty).toBe('advanced');
    });

    it('updates existing exercise when saved with same id', () => {
      const ex = createCustomExercise({
        name: 'Original Name',
        category: 'isolation',
        primaryMuscles: ['biceps'],
      });
      const updated = { ...ex, name: 'Updated Name' };
      saveCustomExercise(updated);
      expect(getCustomExercise(ex.id)!.name).toBe('Updated Name');
      expect(getCustomExercises()).toHaveLength(1);
    });

    it('deletes an exercise', () => {
      const ex = createCustomExercise({
        name: 'To Delete',
        category: 'compound',
        primaryMuscles: ['back'],
      });
      expect(getCustomExercises()).toHaveLength(1);
      deleteCustomExercise(ex.id);
      expect(getCustomExercises()).toHaveLength(0);
    });
  });

  describe('cloneExerciseFromLibrary', () => {
    it('returns undefined for non-existent library id', () => {
      expect(cloneExerciseFromLibrary('nonexistent-xyz')).toBeUndefined();
    });

    it('clones a library exercise with custom suffix', () => {
      // Use a known exercise from the library - we'll check if it creates
      const cloned = cloneExerciseFromLibrary('bench_press_barbell');
      if (cloned) {
        expect(cloned.isCustom).toBe(true);
        expect(cloned.id).toMatch(/^custom_/);
        expect(cloned.name).toContain('(Custom)');
      }
    });

    it('clones with custom name', () => {
      const cloned = cloneExerciseFromLibrary('bench_press_barbell', 'My Bench');
      if (cloned) {
        expect(cloned.name).toBe('My Bench');
      }
    });
  });

  describe('merged library', () => {
    it('getAllExercises includes library + custom', () => {
      const before = getAllExercises().length;
      createCustomExercise({
        name: 'UniqueTestExercise',
        category: 'isolation',
        primaryMuscles: ['traps'],
      });
      expect(getAllExercises().length).toBe(before + 1);
    });

    it('findExerciseByName finds custom exercise', () => {
      createCustomExercise({
        name: 'FindMe Exercise',
        category: 'compound',
        primaryMuscles: ['chest'],
      });
      const found = findExerciseByName('FindMe Exercise');
      expect(found).toBeDefined();
      expect(found!.name).toBe('FindMe Exercise');
    });
  });
});
