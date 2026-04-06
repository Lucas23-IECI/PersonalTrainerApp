'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, Share, X } from 'lucide-react';
import { t } from '@/lib/i18n';

const UPDATE_FLAG = 'mark-pt-update-available';

export default function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    // If a previous visit flagged an update, show banner immediately
    if (localStorage.getItem(UPDATE_FLAG) === '1') {
      setShowUpdate(true);
    }

    // --- Service Worker registration + update detection ---
    if ('serviceWorker' in navigator) {
      let hadController = !!navigator.serviceWorker.controller;

      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // If there's already a waiting SW → update available
        if (reg.waiting) {
          localStorage.setItem(UPDATE_FLAG, '1');
          setShowUpdate(true);
        }

        // Listen for new SW entering waiting state
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              localStorage.setItem(UPDATE_FLAG, '1');
              setShowUpdate(true);
            }
          });
        });

        // Check for new deployments every 60 seconds
        setInterval(() => reg.update(), 60_000);
      });

      // A new SW took over while page was open
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) {
          // SW activated — update was applied, clear flag
          localStorage.removeItem(UPDATE_FLAG);
          setShowUpdate(false);
        }
        hadController = true;
      });
    }

    // Already installed as app → don't show install banners
    if (isStandalone) return;

    // Dismissed recently (7 days)?
    const dismissed = localStorage.getItem('mark-pt-install-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Android / Desktop: native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari: manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setShowIOSHint(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowInstall(false);
    setShowIOSHint(false);
    localStorage.setItem('mark-pt-install-dismissed', String(Date.now()));
  };

  const handleUpdate = () => {
    localStorage.removeItem(UPDATE_FLAG);
    // Tell the waiting SW to activate immediately
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    window.location.reload();
  };

  // --- Update banner (top, high priority) ---
  if (showUpdate) {
    return (
      <div className="pwa-banner pwa-update animate-fade-in">
        <RefreshCw size={18} />
        <span>{t("pwa.newVersionAvailable")}</span>
        <button onClick={handleUpdate} className="pwa-btn">
          {t("common.update")}
        </button>
      </div>
    );
  }

  // --- Install banner (Android / Desktop) ---
  if (showInstall) {
    return (
      <div className="pwa-banner pwa-install animate-fade-in">
        <Download size={18} />
        <span>{t("pwa.installMarkPT")}</span>
        <button onClick={handleInstall} className="pwa-btn">{t("common.install")}</button>
        <button onClick={dismiss} className="pwa-close" aria-label="Cerrar"><X size={16} /></button>
      </div>
    );
  }

  // --- iOS Safari hint ---
  if (showIOSHint) {
    return (
      <div className="pwa-banner pwa-install animate-fade-in">
        <Share size={18} />
        <span>{t("pwa.iosInstruction")}</span>
        <button onClick={dismiss} className="pwa-close" aria-label="Cerrar"><X size={16} /></button>
      </div>
    );
  }

  return null;
}
