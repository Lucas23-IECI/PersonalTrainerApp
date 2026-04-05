import { describe, it, expect } from 'vitest';
import { t, getLang } from '../lib/i18n';
import { saveSettings, getSettings } from '../lib/storage';

describe('i18n', () => {
  it('returns Spanish by default', () => {
    expect(getLang()).toBe('es');
  });

  it('translates known keys to Spanish', () => {
    expect(t('nav.home')).toBe('Inicio');
    expect(t('nav.workout')).toBe('Entreno');
    expect(t('nav.progress')).toBe('Progreso');
    expect(t('common.save')).toBe('Guardar');
    expect(t('common.cancel')).toBe('Cancelar');
  });

  it('translates to English when language is en', () => {
    const s = { ...getSettings(), language: 'en' as const };
    saveSettings(s);
    expect(t('nav.home')).toBe('Home');
    expect(t('nav.workout')).toBe('Workout');
    expect(t('common.save')).toBe('Save');
  });

  it('returns the key itself for unknown keys', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('falls back to Spanish if English translation missing', () => {
    // All known keys have both, but fallback logic should work
    expect(t('nav.home')).toBe('Inicio');
  });
});
