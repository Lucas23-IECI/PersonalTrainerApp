export const APP_VERSION = '1.1.0';

export async function checkForUpdate(): Promise<{ hasUpdate: boolean; downloadUrl: string; latestVersion: string }> {
  const noUpdate = { hasUpdate: false, downloadUrl: '', latestVersion: '' };
  try {
    const res = await fetch('https://api.github.com/repos/Lucas23-IECI/PersonalTrainerApp/releases/latest', {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return noUpdate;
    const data = await res.json();

    const latestVersion = (data.tag_name || '').replace(/^v/, '');
    if (!latestVersion || latestVersion === APP_VERSION) return noUpdate;

    const apk = data.assets?.find((a: { name: string }) => a.name.endsWith('.apk'));
    return {
      hasUpdate: true,
      downloadUrl: apk?.browser_download_url || '',
      latestVersion,
    };
  } catch {
    return noUpdate;
  }
}
