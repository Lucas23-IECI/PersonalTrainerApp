export const APP_VERSION = '3.5.0';
export const APP_BUILD_TS = Date.now();

export async function checkForUpdate(): Promise<{ hasUpdate: boolean; downloadUrl: string; latestVersion: string }> {
  const noUpdate = { hasUpdate: false, downloadUrl: '', latestVersion: '' };
  try {
    const res = await fetch('https://api.github.com/repos/Lucas23-IECI/PersonalTrainerApp/releases/latest', {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return noUpdate;
    const data = await res.json();

    // Try version from tag first, then from release name
    let latestVersion = (data.tag_name || '').replace(/^v/, '');
    if (!latestVersion || latestVersion === 'latest') {
      // Extract version from release name like "MARK PT v1.2.0"
      const nameMatch = (data.name || '').match(/v?([\d]+\.[\d]+\.[\d]+)/);
      if (nameMatch) latestVersion = nameMatch[1];
    }

    // If we got a valid version and it differs, there's an update
    if (latestVersion && latestVersion !== APP_VERSION && latestVersion !== 'latest') {
      const apk = data.assets?.find((a: { name: string }) => a.name.endsWith('.apk'));
      return {
        hasUpdate: true,
        downloadUrl: apk?.browser_download_url || '',
        latestVersion,
      };
    }

    // Fallback: compare by publish date against build timestamp
    const publishedAt = data.published_at ? new Date(data.published_at).getTime() : 0;
    if (publishedAt > APP_BUILD_TS) {
      const apk = data.assets?.find((a: { name: string }) => a.name.endsWith('.apk'));
      return {
        hasUpdate: true,
        downloadUrl: apk?.browser_download_url || '',
        latestVersion: latestVersion || 'nueva',
      };
    }

    return noUpdate;
  } catch {
    return noUpdate;
  }
}
