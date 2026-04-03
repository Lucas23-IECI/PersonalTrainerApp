'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, Share, X } from 'lucide-react';

export default function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    // --- Service Worker registration + update detection ---
    if ('serviceWorker' in navigator) {
      let hadController = !!navigator.serviceWorker.controller;

      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Check for new deployments every 60 seconds
        setInterval(() => reg.update(), 60_000);
      });

      // A new SW took over while page was open → update available
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) setShowUpdate(true);
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

  // --- Update banner (top, high priority) ---
  if (showUpdate) {
    return (
      <div className="pwa-banner pwa-update animate-fade-in">
        <RefreshCw size={18} />
        <span>Nueva versión disponible</span>
        <button onClick={() => window.location.reload()} className="pwa-btn">
          Actualizar
        </button>
      </div>
    );
  }

  // --- Install banner (Android / Desktop) ---
  if (showInstall) {
    return (
      <div className="pwa-banner pwa-install animate-fade-in">
        <Download size={18} />
        <span>Instalá MARK PT</span>
        <button onClick={handleInstall} className="pwa-btn">Instalar</button>
        <button onClick={dismiss} className="pwa-close" aria-label="Cerrar"><X size={16} /></button>
      </div>
    );
  }

  // --- iOS Safari hint ---
  if (showIOSHint) {
    return (
      <div className="pwa-banner pwa-install animate-fade-in">
        <Share size={18} />
        <span>Tocá <strong>Compartir</strong> → <strong>Agregar a Inicio</strong></span>
        <button onClick={dismiss} className="pwa-close" aria-label="Cerrar"><X size={16} /></button>
      </div>
    );
  }

  return null;
}
