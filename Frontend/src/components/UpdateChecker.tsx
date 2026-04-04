'use client';

import { useEffect, useState } from 'react';
import { checkForUpdate } from '@/lib/version';
import { isNative } from '@/lib/native';
import { Download, X } from 'lucide-react';

export default function UpdateChecker() {
  const [update, setUpdate] = useState<{ downloadUrl: string; latestVersion: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only check on native app
    if (!isNative()) return;

    // Check once per day max
    const lastCheck = localStorage.getItem('mark-pt-update-check');
    const now = Date.now();
    if (lastCheck && now - parseInt(lastCheck, 10) < 86400000) return;

    checkForUpdate().then((result) => {
      localStorage.setItem('mark-pt-update-check', String(now));
      if (result.hasUpdate && result.downloadUrl) {
        setUpdate({ downloadUrl: result.downloadUrl, latestVersion: result.latestVersion });
      }
    });
  }, []);

  if (!update || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] animate-fade-in"
      style={{ background: 'var(--accent-green, #30D158)', paddingTop: 'env(safe-area-inset-top, 8px)' }}
    >
      <div className="max-w-[540px] mx-auto flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-[0.82rem] font-bold">Actualización disponible</div>
          <div className="text-white/70 text-[0.65rem]">v{update.latestVersion}</div>
        </div>
        <button
          onClick={() => window.open(update!.downloadUrl, '_system')}
          className="text-[0.78rem] font-bold px-3.5 py-1.5 rounded-lg border-none cursor-pointer shrink-0"
          style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
        >
          Descargar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="bg-transparent border-none cursor-pointer p-1 shrink-0"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
