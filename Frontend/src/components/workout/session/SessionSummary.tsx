"use client";

import { useRef, useState } from "react";
import type { WorkoutSession } from "@/lib/storage";
import { saveSession } from "@/lib/storage";
import { useRouter } from "next/navigation";
import {
  Check, Star, Share2, Download, Copy,
} from "lucide-react";
import WorkoutShareCard from "@/components/workout/WorkoutShareCard";
import { formatDuration } from "./types";
import { t } from "@/lib/i18n";

interface Props {
  session: WorkoutSession;
  workoutName: string;
}

export default function SessionSummary({ session, workoutName }: Props) {
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [sessionRating, setSessionRating] = useState(session.rating || 0);
  const [sessionNotes, setSessionNotes] = useState(session.sessionNotes || "");
  const [savedSession, setSavedSession] = useState(session);

  const duration = formatDuration(savedSession.endTime - savedSession.startTime);
  const fSets = savedSession.exercises.reduce((s, e) => s + e.sets.length, 0);
  const fVolume = savedSession.exercises.reduce(
    (s, e) => s + e.sets.reduce((a, set) => a + (set.weight || 0) * set.reps, 0),
    0
  );
  const musclesWorked = [...new Set(savedSession.exercises.flatMap((e) => e.primaryMuscles || []))];
  const exercisesWithNotes = savedSession.exercises.filter((e) => e.notes);

  async function shareWorkoutSummary() {
    if (!summaryRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: "#000",
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      if (navigator.share && navigator.canShare) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], "workout-summary.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Mi Sesión - MARK PT" });
          setSharing(false);
          return;
        }
      }
      const link = document.createElement("a");
      link.download = `MARK-PT-${savedSession.date || "workout"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // silent fail
    }
    setSharing(false);
  }

  function copySummaryAsText() {
    const dur = formatDuration(savedSession.endTime - savedSession.startTime);
    const vol = savedSession.exercises.reduce(
      (s, e) => s + e.sets.reduce((a, set) => a + (set.weight || 0) * set.reps, 0),
      0
    );
    const lines: string[] = [
      `💪 ${savedSession.workoutName}`,
      `📅 ${savedSession.date} · ⏱ ${dur} · 🏋️ ${vol.toLocaleString()}kg`,
      "",
    ];
    for (const e of savedSession.exercises) {
      if (e.skipped) {
        lines.push(`⏭ ${e.name} (saltado)`);
        continue;
      }
      lines.push(`▸ ${e.name}`);
      e.sets.forEach((set, i) => {
        const w = set.weight ? `${set.weight}kg` : "—";
        const rpe = set.rpe ? ` RPE ${set.rpe}` : "";
        lines.push(`  Set ${i + 1}: ${w} × ${set.reps}${rpe}`);
      });
    }
    lines.push("", "— MARK PT");
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function updateSessionMeta(rating: number, notes: string) {
    const updated = { ...savedSession, rating: rating || undefined, sessionNotes: notes.trim() || undefined };
    saveSession(updated);
    setSavedSession(updated);
  }

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-10 pb-6 text-center">
      <div ref={summaryRef} className="pb-4" style={{ background: "var(--bg)" }}>
        <div className="text-5xl mb-3">💪</div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text)" }}>
          {t("session.completed")}
        </h1>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          {workoutName}
        </p>

        {/* Session Rating */}
        <div className="flex justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => {
                setSessionRating(v);
                updateSessionMeta(v, sessionNotes);
              }}
              className="bg-transparent border-none cursor-pointer p-0.5"
            >
              <Star
                size={28}
                fill={v <= sessionRating ? "#FFD700" : "transparent"}
                strokeWidth={1.5}
                style={{ color: v <= sessionRating ? "#FFD700" : "var(--text-muted)" }}
              />
            </button>
          ))}
        </div>

        {/* Session Notes textarea */}
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          onBlur={() => updateSessionMeta(sessionRating, sessionNotes)}
          placeholder={t("session.notes")}
          className="w-full text-[0.78rem] py-2 px-3 rounded-lg mb-5 resize-none border-none outline-none"
          style={{ background: "var(--bg-elevated)", color: "var(--text)", minHeight: "56px" }}
          rows={2}
        />

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card py-4 text-center">
            <div className="text-2xl font-black" style={{ color: "var(--text)" }}>{duration}</div>
            <div className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("common.duration")}</div>
          </div>
          <div className="card py-4 text-center">
            <div className="text-2xl font-black" style={{ color: "#34C759" }}>{fSets}</div>
            <div className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("common.sets")}</div>
          </div>
          <div className="card py-4 text-center">
            <div className="text-2xl font-black" style={{ color: "var(--accent)" }}>{fVolume.toLocaleString()}</div>
            <div className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("session.volumeKg")}</div>
          </div>
        </div>

        {musclesWorked.length > 0 && (
          <div className="card py-3 px-4 mb-4 text-left">
            <div className="text-[0.6rem] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              {t("session.musclesWorked")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {musclesWorked.map((m) => (
                <span
                  key={m}
                  className="text-[0.68rem] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(10,132,255,0.15)", color: "var(--accent)" }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {exercisesWithNotes.length > 0 && (
          <div className="card py-3 px-4 mb-4 text-left">
            <div className="text-[0.6rem] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              {t("common.notes")}
            </div>
            {exercisesWithNotes.map((e, i) => (
              <div key={i} className="text-[0.72rem] mb-1" style={{ color: "var(--text-secondary)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{e.name}:</span> {e.notes}
              </div>
            ))}
          </div>
        )}

        <div className="card text-left mb-6">
          {savedSession.exercises.map((e, i) => (
            <div key={i} className="py-3" style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
              <div
                className={`text-[0.82rem] font-bold mb-2 ${e.skipped ? "line-through" : ""}`}
                style={{ color: e.skipped ? "var(--text-muted)" : "var(--text)" }}
              >
                {e.name}
                {e.skipped && (
                  <span className="text-[0.6rem] ml-1.5 font-normal" style={{ color: "#FF9500" }}>saltado</span>
                )}
              </div>
              {e.sets.length > 0 && (
                <table className="w-full text-[0.72rem]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      <th className="text-left py-1 w-12">Set</th>
                      <th className="text-left py-1">Peso & Reps</th>
                      <th className="text-right py-1 w-16">RPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.sets.map((set, j) => {
                      const typeLabel =
                        set.setType && set.setType !== "normal"
                          ? { warmup: "W", dropset: "D", failure: "F", amrap: "A", restpause: "RP", myoreps: "M" }[set.setType]
                          : null;
                      const typeColor =
                        set.setType === "dropset"
                          ? "#AF52DE"
                          : set.setType === "failure"
                            ? "#FF3B30"
                            : set.setType === "amrap"
                              ? "#30D158"
                              : set.setType === "restpause"
                                ? "#FF6482"
                                : set.setType === "myoreps"
                                  ? "#64D2FF"
                                  : "#FF9500";
                      return (
                        <tr key={j}>
                          <td className="py-1.5 px-1 font-bold" style={{ color: typeColor }}>
                            {typeLabel || j + 1}
                          </td>
                          <td className="py-1.5">
                            {set.weight ? <span className="font-semibold">{set.weight}kg</span> : "—"} ×{" "}
                            <span className="font-semibold">{set.reps}</span>
                            {typeLabel && <span className="text-[0.55rem] ml-1.5 opacity-60">({set.setType})</span>}
                          </td>
                          <td
                            className="py-1.5 text-right text-[0.68rem] font-semibold"
                            style={{ color: set.rpe ? "var(--accent)" : "var(--text-muted)" }}
                          >
                            {set.rpe ? (
                              <>
                                {set.rpe}{" "}
                                <span className="text-[0.5rem] opacity-60">({set.rir ?? 10 - set.rpe} RIR)</span>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* end summaryRef */}

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowShareCard(true)}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Share2 size={16} /> Share Card
        </button>
        <button
          onClick={shareWorkoutSummary}
          disabled={sharing}
          className="btn btn-ghost flex-1 flex items-center justify-center gap-2"
        >
          {sharing ? <span className="text-xs">Generando...</span> : <><Download size={16} /> Screenshot</>}
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={copySummaryAsText}
          className="btn btn-ghost flex-1 flex items-center justify-center gap-2"
        >
          {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar Texto</>}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => router.push("/")} className="btn btn-ghost flex-1">Dashboard</button>
        <button onClick={() => router.push("/workout")} className="btn btn-primary flex-1">Ver Plan</button>
      </div>
      {showShareCard && <WorkoutShareCard session={savedSession} onClose={() => setShowShareCard(false)} />}
    </main>
  );
}
