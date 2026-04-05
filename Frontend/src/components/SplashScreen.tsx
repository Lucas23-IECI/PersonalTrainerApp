"use client";

import { useState, useEffect } from "react";

const SPLASH_KEY = "mark-pt-splash-shown";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash only once per browser session (sessionStorage)
    if (typeof window === "undefined") return;
    const shown = sessionStorage.getItem(SPLASH_KEY);
    if (shown) return;
    setVisible(true);
    sessionStorage.setItem(SPLASH_KEY, "1");
    const timer = setTimeout(() => setFadeOut(true), 1500);
    const hide = setTimeout(() => setVisible(false), 2000);
    return () => { clearTimeout(timer); clearTimeout(hide); };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        transition: "opacity 0.5s ease-out",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      <div
        style={{
          fontSize: "2.5rem",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-green) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "8px",
        }}
      >
        MARK PT
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          color: "#636366",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Personal Trainer
      </div>
      <div
        style={{
          marginTop: "40px",
          width: "32px",
          height: "32px",
          border: "3px solid var(--bg)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "splash-spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
