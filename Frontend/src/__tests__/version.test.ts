import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APP_VERSION, checkForUpdate } from '../lib/version';

describe('version', () => {
  it('APP_VERSION matches semver', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('APP_VERSION matches package.json', () => {
    // Should be 3.3.0
    expect(APP_VERSION).toBe('3.5.0');
  });

  describe('checkForUpdate', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('returns no update when fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
      const result = await checkForUpdate();
      expect(result).toEqual({ hasUpdate: false, downloadUrl: '', latestVersion: '' });
    });

    it('returns no update when response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
      } as Response);
      const result = await checkForUpdate();
      expect(result).toEqual({ hasUpdate: false, downloadUrl: '', latestVersion: '' });
    });

    it('returns no update when same version', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: `v${APP_VERSION}`,
          assets: [],
        }),
      } as any);
      const result = await checkForUpdate();
      expect(result.hasUpdate).toBe(false);
    });

    it('detects update from newer tag_name', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v99.0.0',
          assets: [{ name: 'app-release.apk', browser_download_url: 'https://example.com/app.apk' }],
        }),
      } as any);
      const result = await checkForUpdate();
      expect(result.hasUpdate).toBe(true);
      expect(result.latestVersion).toBe('99.0.0');
      expect(result.downloadUrl).toBe('https://example.com/app.apk');
    });

    it('extracts version from release name when tag is "latest"', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'latest',
          name: 'MARK PT v99.1.0',
          assets: [{ name: 'mark-pt.apk', browser_download_url: 'https://example.com/mark.apk' }],
        }),
      } as any);
      const result = await checkForUpdate();
      expect(result.hasUpdate).toBe(true);
      expect(result.latestVersion).toBe('99.1.0');
    });
  });
});
