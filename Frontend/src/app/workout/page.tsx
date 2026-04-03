"use client";

import { useState, useEffect } from "react";
import { getWeeklyPlan } from "@/data/workouts";
import { getCurrentPhaseInfo } from "@/data/profile";
import { getActiveSession, clearActiveSession, type ActiveSessionData } from "@/lib/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Clock, ChevronDown, ChevronUp, Pencil, Trash2, ChevronRight } from "lucide-react";

export default function WorkoutPage() {
  const router = useRouter();
  const dayIndex = new Date().getDay();
  const plan = getWeeklyPlan();
  // Find today's workout by checking dayOfWeek match
  const todayWorkout = plan.find((w) => {
    // The id encoding tells us the day via the weekday abbreviation
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return w.id.endsWith(dayNames[dayIndex]);
  });
  const todayId = todayWorkout?.id || plan[0]?.id;
  const [expanded, setExpanded] = useState<string | null>(todayId);

  const phaseInfo = getCurrentPhaseInfo();

  // Active session state
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [activeElapsed, setActiveElapsed] = useState(0);
  const [confirmNewDay, setConfirmNewDay] = useState<string | null>(null);

  // Load active session on mount
  useEffect(() => {
    setActiveSession(getActiveSession());
  }, []);

  // Live timer for active session bar
  useEffect(() => {
    if (!activeSession) return;
    const tick = () => setActiveElapsed(Date.now() - activeSession.sessionStart);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  function formatDuration(ms: number) {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}m`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleStartWorkout(dayId: string) {
    if (activeSession && activeSession.dayId !== dayId) {
      setConfirmNewDay(dayId);
    } else {
      router.push(`/workout/session?day=${dayId}`);
    }
  }

  function confirmDiscardAndStart() {
    clearActiveSession();
    setActiveSession(null);
    if (confirmNewDay) {
      router.push(`/workout/session?day=${confirmNewDay}`);
    }
    setConfirmNewDay(null);
  }

  function discardActiveSession() {
    clearActiveSession();
    setActiveSession(null);
  }

  // Current exercise name for active bar
  const activeExName = activeSession
    ? (() => {
        const exs = activeSession.exercises;
        // Find first exercise with incomplete sets
        const current = exs.find((e) => e.sets.some((s) => !s.completed && !s.isWarmup));
        return current?.name || exs[exs.length - 1]?.name || "";
      })()
    : "";

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6" style={{ paddingBottom: activeSession ? 80 : undefined }}>
      <div className="flex items-center justify-between mb-0.5">
        <h1 className="text-xl font-extrabold tracking-tight">Plan Semanal</h1>
        <Link href="/workout/editor" className="flex items-center gap-1 text-[0.7rem] text-[#2C6BED] no-underline font-semibold">
          <Pencil size={13} /> Editar
        </Link>
      </div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[0.68rem] text-zinc-500 uppercase tracking-wider">
          {phaseInfo.label}
        </p>
        <span className="text-[0.6rem] text-zinc-400">
          Semana {phaseInfo.week} de {phaseInfo.totalWeeks}
        </span>
      </div>
      {/* Phase progress bar */}
      <div className="w-full h-1.5 rounded-full bg-zinc-800 mb-5">
        <div
          className="h-full rounded-full bg-[#0A84FF] transition-all"
          style={{ width: `${phaseInfo.progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {plan.map((w) => {
          const isToday = w.id === todayId;
          const isOpen = expanded === w.id;
          const isRest = w.type === "rest" || w.type === "optional";

          return (
            <div
              key={w.id}
              className="card"
              style={{
                borderColor: isToday ? w.color + "60" : undefined,
              }}
            >
              {/* Header */}
              <div
                onClick={() => setExpanded(isOpen ? null : w.id)}
                className="flex justify-between items-start cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isToday && (
                      <span
                        className="text-[0.55rem] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: w.color }}
                      >
                        HOY
                      </span>
                    )}
                    <span className="text-[0.65rem] text-zinc-500 font-medium">{w.day}</span>
                  </div>
                  <div className="text-[0.9rem] font-bold mb-1" style={{ color: w.color }}>
                    {w.name}
                  </div>
                  {w.exercises.length > 0 && (
                    <div className="flex gap-2">
                      <span className="badge badge-blue">{w.focus}</span>
                      <span className="badge badge-blue">
                        <Clock size={10} className="mr-1" />
                        {w.duration}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-zinc-600 ml-2 shrink-0">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div className="mt-3">
                  {w.note && (
                    <div
                      className="text-[0.7rem] text-zinc-400 mb-3 py-2 px-3 rounded-lg"
                      style={{
                        background: "var(--bg-elevated)",
                        borderLeft: `3px solid ${w.color}`,
                      }}
                    >
                      {w.note}
                    </div>
                  )}

                  {isRest && w.exercises.length === 0 ? (
                    <div className="text-center py-6 text-zinc-600">
                      <div className="text-2xl mb-2">🧘</div>
                      <div className="text-sm">Recuperación</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[0.78rem]">
                        {w.exercises.map((ex, i) => {
                          const showSS =
                            ex.superset &&
                            (i === 0 || w.exercises[i - 1]?.superset !== ex.superset);
                          return (
                            <div key={i}>
                              {showSS && (
                                <div className="text-[0.6rem] text-[#2C6BED] font-bold py-1 mt-1">
                                  ↔ Superset {ex.superset}
                                </div>
                              )}
                              <div
                                className="grid items-center py-1.5"
                                style={{
                                  gridTemplateColumns: "1fr auto auto auto",
                                  gap: 8,
                                  borderBottom: "1px solid var(--border-subtle)",
                                }}
                              >
                                <div>
                                  <span className="text-zinc-800 font-semibold">{ex.name}</span>
                                  {ex.notes && (
                                    <div className="text-[0.6rem] text-zinc-600 mt-0.5 leading-tight">
                                      {ex.notes}
                                    </div>
                                  )}
                                </div>
                                <span className="text-zinc-500 text-[0.72rem] text-right">
                                  {ex.sets}×{ex.reps}
                                </span>
                                <span className="text-zinc-600 text-[0.65rem] text-right min-w-[50px]">
                                  {ex.load}
                                </span>
                                <span className="text-zinc-400 text-[0.65rem] text-right">
                                  RPE {ex.rpe}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {w.type !== "football" && w.exercises.length > 0 && (
                        <button
                          onClick={() => handleStartWorkout(w.id)}
                          className="btn btn-primary w-full mt-4 text-[0.85rem]"
                        >
                          <Play size={16} /> Empezar Entrenamiento
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Active Workout Bar (Hevy-style) ── */}
      {activeSession && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40"
          style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-[540px] mx-auto flex items-center gap-3 px-4 py-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#34C759" }} />
            <button
              onClick={() => router.push(`/workout/session?day=${activeSession.dayId}`)}
              className="flex-1 text-left bg-transparent border-none cursor-pointer p-0"
            >
              <div className="text-[0.82rem] font-bold truncate" style={{ color: "var(--text)" }}>
                {activeSession.workoutName}
                <span className="text-[0.72rem] font-semibold ml-2" style={{ color: "#34C759" }}>
                  {formatDuration(activeElapsed)}
                </span>
              </div>
              <div className="text-[0.68rem] truncate" style={{ color: "var(--text-muted)" }}>
                {activeExName}
              </div>
            </button>
            <button
              onClick={() => router.push(`/workout/session?day=${activeSession.dayId}`)}
              className="bg-transparent border-none cursor-pointer p-1"
              style={{ color: "var(--accent)" }}
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={discardActiveSession}
              className="bg-transparent border-none cursor-pointer p-1"
              style={{ color: "#FF3B30" }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm discard & start new ── */}
      {confirmNewDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="card mx-6 p-5 text-center" style={{ maxWidth: 320 }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Descartar entrenamiento?</h3>
            <p className="text-[0.78rem] mb-4" style={{ color: "var(--text-muted)" }}>
              Hay un entrenamiento en progreso ({activeSession?.workoutName}). Se va a perder todo el progreso.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmNewDay(null)} className="btn btn-ghost flex-1">Cancelar</button>
              <button onClick={confirmDiscardAndStart} className="btn btn-danger flex-1">Descartar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
