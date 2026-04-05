"use client";

import { useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import type { WorkoutSession } from "@/lib/storage";

interface Props {
  session: WorkoutSession;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

const GRADIENTS = [
  "linear-gradient(135deg, #0A84FF 0%, #5856D6 100%)",
  "linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)",
  "linear-gradient(135deg, #30D158 0%, #0A84FF 100%)",
  "linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)",
  "linear-gradient(135deg, #FF9500 0%, #FFD60A 100%)",
];

export default function WorkoutShareCard({ session, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [gradientIdx, setGradientIdx] = useState(0);

  const duration = formatDuration(session.endTime - session.startTime);
  const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0);
  const totalVolume = session.exercises.reduce(
    (s, e) => s + e.sets.reduce((a, set) => a + (set.weight || 0) * set.reps, 0), 0
  );
  const totalReps = session.exercises.reduce(
    (s, e) => s + e.sets.reduce((a, set) => a + set.reps, 0), 0
  );
  const exerciseCount = session.exercises.filter((e) => !e.skipped).length;
  const muscles = [...new Set(session.exercises.flatMap((e) => e.primaryMuscles || []))];
  const topExercises = session.exercises
    .filter((e) => !e.skipped && e.sets.length > 0)
    .slice(0, 4);

  async function handleShare() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `MARK-PT-${session.date}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mi Entrenamiento - MARK PT" });
      } else {
        const link = document.createElement("a");
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch { /* silent */ }
    setSharing(false);
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `MARK-PT-${session.date}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { /* silent */ }
    setSharing(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <X size={20} className="text-white" />
      </button>

      {/* Gradient picker */}
      <div className="flex gap-2 mb-4">
        {GRADIENTS.map((g, i) => (
          <button
            key={i}
            onClick={() => setGradientIdx(i)}
            className="w-7 h-7 rounded-full border-2 cursor-pointer"
            style={{
              background: g,
              borderColor: gradientIdx === i ? "#fff" : "transparent",
            }}
          />
        ))}
      </div>

      {/* ── THE CARD ── */}
      <div
        ref={cardRef}
        style={{
          width: 360,
          padding: 28,
          borderRadius: 24,
          background: GRADIENTS[gradientIdx],
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>
              Sesión Completada
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
              {session.workoutName}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {new Date(session.date + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{duration}</div>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Duración</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{totalVolume.toLocaleString()}<span style={{ fontSize: 12 }}>kg</span></div>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Volumen</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{totalSets}</div>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Sets</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{exerciseCount}</div>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Ejercicios</div>
            </div>
          </div>

          {/* Top exercises */}
          {topExercises.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>
                Ejercicios
              </div>
              {topExercises.map((ex, i) => {
                const bestSet = ex.sets.reduce((best, s) => ((s.weight || 0) * s.reps > (best.weight || 0) * best.reps ? s : best), ex.sets[0]);
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 0",
                    borderBottom: i < topExercises.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ex.name}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
                      {bestSet?.weight ? `${bestSet.weight}kg × ${bestSet.reps}` : `${bestSet?.reps} reps`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Muscles */}
          {muscles.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {muscles.slice(0, 6).map((m) => (
                <span key={m} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 8px",
                  borderRadius: 20, background: "rgba(255,255,255,0.2)",
                }}>
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Rating */}
          {session.rating && session.rating > 0 && (
            <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ fontSize: 16, opacity: i < session.rating! ? 1 : 0.3 }}>⭐</span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.5 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>MARK PT</span>
            <span style={{ fontSize: 10 }}>💪 Personal Trainer</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={handleDownload}
          disabled={sharing}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
        >
          <Download size={18} /> Descargar
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer"
          style={{ background: "#fff", color: "#000" }}
        >
          <Share2 size={18} /> {sharing ? "..." : "Compartir"}
        </button>
      </div>
    </div>
  );
}
