import { describe, it, expect } from 'vitest';
import {
  getRoutines,
  getRoutine,
  saveRoutine,
  deleteRoutine,
  createEmptyRoutine,
  cloneRoutine,
  getFolders,
  createFolder,
  deleteFolder,
  updateFolder,
  moveRoutineToFolder,
  getRoutinesByFolder,
  getRoutinesWithoutFolder,
  exportRoutineCode,
  importRoutineCode,
  type Routine,
} from '../lib/routines-storage';

describe('routines-storage', () => {
  describe('Routine CRUD', () => {
    it('returns empty array by default', () => {
      expect(getRoutines()).toEqual([]);
    });

    it('creates an empty routine', () => {
      const r = createEmptyRoutine('Push Pull Legs');
      expect(r.id).toBeTruthy();
      expect(r.name).toBe('Push Pull Legs');
      expect(r.days).toEqual([]);
      expect(r.daysPerWeek).toBe(0);
      expect(typeof r.createdAt).toBe('number');
      expect(typeof r.updatedAt).toBe('number');
    });

    it('retrieves routine by id', () => {
      const r = createEmptyRoutine('Test');
      const found = getRoutine(r.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe('Test');
    });

    it('updates existing routine via saveRoutine', () => {
      const r = createEmptyRoutine('Before');
      r.name = 'After';
      saveRoutine(r);
      expect(getRoutine(r.id)!.name).toBe('After');
      expect(getRoutines()).toHaveLength(1);
    });

    it('deletes a routine', () => {
      const r = createEmptyRoutine('ToDelete');
      expect(getRoutines()).toHaveLength(1);
      deleteRoutine(r.id);
      expect(getRoutines()).toHaveLength(0);
    });
  });

  describe('cloneRoutine', () => {
    it('returns undefined for non-existent id', () => {
      expect(cloneRoutine('nonexistent')).toBeUndefined();
    });

    it('clones a routine with new id and "(Copia)" suffix', () => {
      const original = createEmptyRoutine('Original');
      original.days = [
        { id: 'day-0', name: 'Día 1', focus: 'push', type: 'upper', exercises: [] },
      ];
      saveRoutine(original);

      const clone = cloneRoutine(original.id);
      expect(clone).toBeDefined();
      expect(clone!.id).not.toBe(original.id);
      expect(clone!.name).toBe('Original (Copia)');
      expect(clone!.days).toHaveLength(1);
      // Day ids should be different
      expect(clone!.days[0].id).not.toBe(original.days[0].id);
    });
  });

  describe('Folders', () => {
    it('returns empty folders by default', () => {
      expect(getFolders()).toEqual([]);
    });

    it('creates a folder with a color', () => {
      const f = createFolder('Mis Rutinas');
      expect(f.name).toBe('Mis Rutinas');
      expect(f.color).toBeTruthy();
      expect(typeof f.createdAt).toBe('number');
    });

    it('updates a folder name', () => {
      const f = createFolder('Old Name');
      updateFolder(f.id, { name: 'New Name' });
      const updated = getFolders().find(x => x.id === f.id);
      expect(updated!.name).toBe('New Name');
    });

    it('deletes folder and unassigns routines', () => {
      const f = createFolder('ToDelete');
      const r = createEmptyRoutine('InFolder');
      moveRoutineToFolder(r.id, f.id);
      expect(getRoutine(r.id)!.folderId).toBe(f.id);

      deleteFolder(f.id);
      expect(getFolders()).toHaveLength(0);
      // Routine should have folderId cleared
      expect(getRoutine(r.id)!.folderId).toBeUndefined();
    });
  });

  describe('folder assignment', () => {
    it('moves routine to folder', () => {
      const f = createFolder('Folder A');
      const r = createEmptyRoutine('R1');
      moveRoutineToFolder(r.id, f.id);
      expect(getRoutine(r.id)!.folderId).toBe(f.id);
    });

    it('filters routines by folder', () => {
      const f = createFolder('F');
      const r1 = createEmptyRoutine('R1');
      const r2 = createEmptyRoutine('R2');
      moveRoutineToFolder(r1.id, f.id);

      expect(getRoutinesByFolder(f.id)).toHaveLength(1);
      expect(getRoutinesWithoutFolder()).toHaveLength(1);
    });
  });

  describe('import / export', () => {
    it('returns null for non-existent routine export', () => {
      expect(exportRoutineCode('nonexistent')).toBeNull();
    });

    it('round-trips a routine via export/import', () => {
      const r = createEmptyRoutine('Exportable');
      r.description = 'Test description';
      r.split = 'PPL';
      r.daysPerWeek = 3;
      r.days = [
        {
          id: 'day-0',
          name: 'Push',
          focus: 'push',
          type: 'upper',
          exercises: [
            {
              name: 'Bench Press',
              sets: 4,
              reps: '8-10',
              rest: '90s',
              rpe: '8',
              primaryMuscles: ['chest'],
              isCompound: true,
            },
          ],
        },
      ];
      saveRoutine(r);

      const code = exportRoutineCode(r.id);
      expect(code).toBeTruthy();
      expect(typeof code).toBe('string');

      // Clear storage and import
      localStorage.clear();
      const imported = importRoutineCode(code!);
      expect(imported).toBeDefined();
      expect(imported!.name).toBe('Exportable');
      expect(imported!.split).toBe('PPL');
      expect(imported!.days).toHaveLength(1);
      expect(imported!.days[0].exercises[0].name).toBe('Bench Press');
    });

    it('returns null for invalid code', () => {
      expect(importRoutineCode('not-valid-base64!!!')).toBeNull();
    });

    it('returns null for valid base64 but wrong format', () => {
      const code = btoa(JSON.stringify({ wrong: 'format' }));
      expect(importRoutineCode(code)).toBeNull();
    });
  });
});
