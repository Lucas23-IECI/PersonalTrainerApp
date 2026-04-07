'use client';

import { useEffect, useState } from 'react';
import { checkForUpdate, APP_VERSION } from '@/lib/version';
import { isNative } from '@/lib/native';
import { Download, ArrowDownCircle, RefreshCw } from 'lucide-react';

export default function UpdateChecker() {
  const [update, setUpdate] = useState<{ downloadUrl: string; latestVersion: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isNative()) return;

    // Check every app open — debounce 5 min to avoid spamming
    const lastCheck = localStorage.getItem('mark-pt-update-check');
    const now = Date.now();
    if (lastCheck && now - parseInt(lastCheck, 10) < 300000) return;

    setChecking(true);
    checkForUpdate().then((result) => {
      localStorage.setItem('mark-pt-update-check', String(now));
      if (result.hasUpdate && result.downloadUrl) {
        setUpdate({ downloadUrl: result.downloadUrl, latestVersion: result.latestVersion });
      }
    }).finally(() => setChecking(false));
  }, []);

  function handleUpdate() {
    if (!update) return;
    setDownloading(true);
    // Open in system browser — Android handles APK download + install prompt
    window.open(update.downloadUrl, '_system');
    // Reset after a delay so user can come back if install failed
    setTimeout(() => setDownloading(false), 10000);
  }

  if (!update) return null;

  // Full-screen mandatory update overlay
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-[90%] max-w-[380px] rounded-3xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Icon */}
        <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F8CFF, #30D158)' }}>
          <ArrowDownCircle size={40} className="text-white" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          Nueva versión disponible
        </h2>

        {/* Version info */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-[0.8rem] px-3 py-1 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            v{APP_VERSION}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span className="text-[0.8rem] px-3 py-1 rounded-full font-bold" style={{ background: 'rgba(48, 209, 88, 0.15)', color: 'var(--accent-green)' }}>
            v{update.latestVersion}
          </span>
        </div>

        <p className="text-[0.78rem] mb-6" style={{ color: 'var(--text-secondary)' }}>
          Actualiza para obtener las últimas mejoras y correcciones.
        </p>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          disabled={downloading}
          className="w-full py-3.5 rounded-2xl text-[0.95rem] font-bold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'var(--accent-green)', color: '#fff' }}
        >
          {downloading ? (
            <>
              <RefreshCw size={18} className="animate-spin" /> Descargando...
            </>
          ) : (
            <>
              <Download size={18} /> Actualizar ahora
            </>
          )}
        </button>

        {/* Skip hint */}
        <p className="text-[0.6rem] mt-4" style={{ color: 'var(--text-muted)' }}>
          La app se cerrará para instalar la actualización
        </p>
      </div>
    </div>
  );
}
