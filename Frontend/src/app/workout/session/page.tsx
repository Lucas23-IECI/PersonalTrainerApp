"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWorkoutById, getWeeklyPlan, type Exercise } from "@/data/workouts";
import { getCurrentPhase } from "@/data/phases";
import { getProgramWorkoutById } from "@/data/programs";
import {
  generateId,
  today,
  saveSession,
  type WorkoutSession,
  type LoggedExercise,
  type LoggedSet,
} from "@/lib/storage";
import {
  getSuggestion,
  isNewPR,
  getExerciseHistory,
  getWarmupSets,
} from "@/lib/progression";
import {
  Check, ChevronDown, Timer, Plus, Trash2, Minus as MinusIcon,
} from "lucide-react";

// ── Types ──
interface SessionSet extends LoggedSet {
  completed: boolean;
  isWarmup: boolean;
}
interface SessionExercise {
  name: string;
  exerciseRef: Exercise;
  exIndex: number;
  notes: string;
  restSeconds: number;
  sets: SessionSet[];
  supersetTag?: string;
  previousSets: { weight: number; reps: number }[];
}

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dayId = searchParams.get("day") || "";

  const workout = useMemo(() => {
    const plan = getWeeklyPlan();
    return getWorkoutById(dayId) || plan[0];
  }, [dayId]);

  const phase = getCurrentPhase();
  const programDay = useMemo(() => getProgramWorkoutById(phase.id, dayId), [phase.id, dayId]);

  // ── State ──
  const [started, setStarted] = useState(false);
  const [sessionStart, setSessionStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [finished, setFinished] = useState(false);
  const [savedSession, setSavedSession] = useState<WorkoutSession | null>(null);
  const [prAlert, setPrAlert] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Rest timer
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Initialize exercises ──
  useEffect(() => {
    const exs: SessionExercise[] = workout.exercises.map((ex, i) => {
      const history = getExerciseHistory(ex.name, 1);
      const prev = history[0]?.sets.map((s) => ({ weight: s.weight || 0, reps: s.reps })) || [];
      const restStr = ex.rest || "60s";
      const restSec = parseInt(restStr.replace(/[^0-9]/g, ""), 10) || 60;
      const progEx = programDay?.exercises[i];

      const plannedSets: SessionSet[] = [];
      // Warmup sets for compound exercises
      if (progEx?.isCompound) {
        const sug = getSuggestion(ex.name, progEx);
        const targetWeight = sug?.weight || parseFloat(ex.load.match(/[\d.]+/)?.[0] || "0") || 0;
        if (targetWeight > 20) {
          const warmups = getWarmupSets(targetWeight);
          warmups.forEach((ws) => {
            plannedSets.push({ reps: ws.reps, weight: ws.weight, completed: false, isWarmup: true });
          });
        }
      }
      // Working sets
      for (let s = 0; s < ex.sets; s++) {
        const suggestion = progEx ? getSuggestion(ex.name, progEx) : null;
        const prevSet = prev[s];
        plannedSets.push({
          reps: prevSet?.reps || parseInt(ex.reps.split(/[-\u2013]/)[0].replace(/[^0-9]/g, ""), 10) || 10,
          weight: suggestion?.weight ?? prevSet?.weight ?? (parseFloat(ex.load.match(/[\d.]+/)?.[0] || "0") || undefined),
          completed: false,
          isWarmup: false,
        });
      }

      return {
        name: ex.name,
        exerciseRef: ex,
        exIndex: i,
        notes: "",
        restSeconds: restSec,
        sets: plannedSets,
        supersetTag: ex.superset,
        previousSets: prev,
      };
    });
    setExercises(exs);
  }, [workout, programDay]);

  // ── Session timer ──
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => setElapsed(Date.now() - sessionStart), 1000);
    return () => clearInterval(id);
  }, [started, finished, sessionStart]);

  // ── Rest timer ──
  useEffect(() => {
    if (!restActive || restSeconds <= 0) {
      if (restActive && restSeconds <= 0) {
        setRestActive(false);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
      return;
    }
    const id = setInterval(() => setRestSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [restActive, restSeconds]);

  // ── Computed stats ──
  const totalSets = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.completed && !s.isWarmup).length, 0);
  const totalVolume = exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).reduce((v, s) => v + (s.weight || 0) * s.reps, 0), 0
  );

  // ── Helpers ──
  function formatDuration(ms: number) {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatRest(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof SessionSet, value: any) {
    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) } : e
      )
    );
  }

  function toggleSetComplete(exIdx: number, setIdx: number) {
    const set = exercises[exIdx].sets[setIdx];
    const nowComplete = !set.completed;
    updateSet(exIdx, setIdx, "completed", nowComplete);

    if (nowComplete) {
      const ex = exercises[exIdx];
      const pr = isNewPR(ex.name, { reps: set.reps, weight: set.weight, rpe: set.rpe });
      if (pr.isPR) {
        setPrAlert(ex.name);
        setTimeout(() => setPrAlert(null), 3000);
      }
      setRestTotal(ex.restSeconds);
      setRestSeconds(ex.restSeconds);
      setRestActive(true);
    }
  }

  function addSet(exIdx: number) {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        const lastWorking = [...e.sets].reverse().find((s) => !s.isWarmup);
        return {
          ...e,
          sets: [...e.sets, { reps: lastWorking?.reps || 10, weight: lastWorking?.weight, completed: false, isWarmup: false }],
        };
      })
    );
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises((prev) =>
      prev.map((e, i) => (i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e))
    );
  }

  function removeExercise(exIdx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  }

  function updateNotes(exIdx: number, notes: string) {
    setExercises((prev) => prev.map((e, i) => (i === exIdx ? { ...e, notes } : e)));
  }

  function updateRestTime(exIdx: number, delta: number) {
    setExercises((prev) =>
      prev.map((e, i) => (i === exIdx ? { ...e, restSeconds: Math.max(0, e.restSeconds + delta) } : e))
    );
  }

  function startSession() {
    setStarted(true);
    setSessionStart(Date.now());
  }

  const finishSession = useCallback(() => {
    const logged: LoggedExercise[] = exercises.map((ex) => ({
      name: ex.name,
      plannedSets: ex.exerciseRef.sets,
      plannedReps: ex.exerciseRef.reps,
      sets: ex.sets.filter((s) => s.completed && !s.isWarmup).map((s) => ({ reps: s.reps, weight: s.weight, rpe: s.rpe })),
      skipped: ex.sets.filter((s) => s.completed && !s.isWarmup).length === 0,
      notes: ex.notes,
      primaryMuscles: ex.exerciseRef.primaryMuscles,
    }));

    const session: WorkoutSession = {
      id: generateId(),
      date: today(),
      workoutId: workout.id,
      workoutName: workout.name,
      exercises: logged,
      completed: true,
      startTime: sessionStart,
      endTime: Date.now(),
    };
    saveSession(session);
    setSavedSession(session);
    setFinished(true);
  }, [exercises, sessionStart, workout]);

  // ═════════════════════════════════════
  // FINISHED SUMMARY
  // ═════════════════════════════════════
  if (finished && savedSession) {
    const duration = formatDuration(savedSession.endTime - savedSession.startTime);
    const fSets = savedSession.exercises.reduce((s, e) => s + e.sets.length, 0);
    const fVolume = savedSession.exercises.reduce((s, e) => s + e.sets.reduce((a, set) => a + (set.weight || 0) * set.reps, 0), 0);
    return (
      <main className="max-w-[540px] mx-auto px-4 pt-10 pb-6 text-center">
        <div className="text-5xl mb-3">{"\u{1F4AA}"}</div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text)" }}>Sesi&oacute;n Completada!</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{workout.name}</p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="card py-4 text-center">
            <div className="text-2xl font-black" style={{ color: "var(--text)" }}>{duration}</div>
            <div className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>Duraci&oacute;n</div>
          </div>
          <div className="card py-4 text-center">
            <div className="text-2xl font-black" style={{ color: "#34C759" }}>{fSets}</div>
            <div className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>Sets</div>
          </div>
          <div className="card py-4 text-center">
            <div className="text-2xl font-black" style={{ color: "var(--accent)" }}>{fVolume.toLocaleString()}</div>
            <div className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>kg Vol</div>
          </div>
        </div>
        <div className="card text-left mb-6">
          {savedSession.exercises.map((e, i) => (
            <div key={i} className="py-3" style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
              <div className={`text-[0.82rem] font-bold mb-2 ${e.skipped ? "line-through" : ""}`} style={{ color: e.skipped ? "var(--text-muted)" : "var(--text)" }}>
                {e.name}
                {e.skipped && <span className="text-[0.6rem] ml-1.5 font-normal" style={{ color: "#FF9500" }}>saltado</span>}
              </div>
              {e.sets.length > 0 && (
                <table className="w-full text-[0.72rem]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      <th className="text-left py-1 w-12">Set</th>
                      <th className="text-left py-1">Peso &amp; Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.sets.map((set, j) => (
                      <tr key={j}>
                        <td className="py-1.5 px-1 font-bold" style={{ color: "#FF9500" }}>{j + 1}</td>
                        <td className="py-1.5">
                          {set.weight ? <span className="font-semibold">{set.weight}kg</span> : "\u2014"} &times; <span className="font-semibold">{set.reps}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/")} className="btn btn-ghost flex-1">Dashboard</button>
          <button onClick={() => router.push("/workout")} className="btn btn-primary flex-1">Ver Plan</button>
        </div>
      </main>
    );
  }

  // ═════════════════════════════════════
  // START SCREEN
  // ═════════════════════════════════════
  if (!started) {
    return (
      <main className="max-w-[540px] mx-auto px-4 pt-5 pb-24">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)" }}>
          <ChevronDown size={16} className="rotate-90" /> Volver
        </button>
        <div className="text-center mb-6">
          <div className="text-[0.65rem] uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>{workout.day}</div>
          <h1 className="text-xl font-black mb-2" style={{ color: workout.color }}>{workout.name}</h1>
          <div className="flex gap-2 justify-center flex-wrap">
            <span className="badge badge-blue">{workout.focus}</span>
            <span className="badge badge-blue">{workout.duration}</span>
            <span className="badge">{workout.exercises.length} ejercicios</span>
          </div>
        </div>
        {workout.note && (
          <div className="text-[0.72rem] mb-4 py-2.5 px-3 rounded-xl leading-relaxed" style={{ background: "var(--bg-card)", borderLeft: `3px solid ${workout.color}`, color: "var(--text-muted)" }}>
            {workout.note}
          </div>
        )}
        <div className="card mb-5">
          {workout.exercises.map((ex, i) => (
            <div key={i} className="flex justify-between items-center py-2.5" style={{ borderBottom: i < workout.exercises.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{ex.name}</div>
                {ex.notes && <div className="text-[0.6rem]" style={{ color: "var(--text-secondary)" }}>{ex.notes}</div>}
              </div>
              <div className="text-right">
                <div className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>{ex.sets}&times;{ex.reps}</div>
                <div className="text-[0.6rem]" style={{ color: "var(--text-secondary)" }}>{ex.load}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={startSession} className="btn w-full text-base py-3.5 font-extrabold text-white border-none cursor-pointer" style={{ background: workout.color }}>
          &#9654; EMPEZAR
        </button>
      </main>
    );
  }

  // ═════════════════════════════════════
  // ACTIVE SESSION — Hevy-style
  // ═════════════════════════════════════
  return (
    <main className="max-w-[540px] mx-auto px-0 pt-0" style={{ paddingBottom: restActive ? 100 : 96 }} ref={scrollRef}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30" style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)" }}>
              <ChevronDown size={20} />
            </button>
            <span className="text-base font-bold" style={{ color: "var(--text)" }}>Log Workout</span>
          </div>
          <div className="flex items-center gap-3">
            <Timer size={20} style={{ color: "var(--text-muted)" }} />
            <button
              onClick={finishSession}
              className="text-[0.8rem] font-bold text-white px-4 py-1.5 rounded-lg cursor-pointer border-none"
              style={{ background: "#34C759" }}
            >
              Finish
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex px-4 pb-2 gap-4">
          <div>
            <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>Duration</div>
            <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>{formatDuration(elapsed)}</div>
          </div>
          <div>
            <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>Volume</div>
            <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{totalVolume.toLocaleString()} kg</div>
          </div>
          <div>
            <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>Sets</div>
            <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{totalSets}</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="h-[3px]" style={{ background: "var(--border)" }}>
          <div
            className="h-full transition-all"
            style={{
              width: `${exercises.length > 0 ? (totalSets / Math.max(1, exercises.reduce((a, e) => a + e.sets.filter((s) => !s.isWarmup).length, 0))) * 100 : 0}%`,
              background: "var(--accent)",
            }}
          />
        </div>
      </div>

      {/* PR Alert */}
      {prAlert && (
        <div className="mx-4 mt-3 py-2.5 px-3 rounded-xl text-center text-sm font-bold animate-pulse" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000" }}>
          {"\u{1F3C6}"} Nuevo PR en {prAlert}!
        </div>
      )}

      {/* ── Exercise Cards ── */}
      <div className="flex flex-col gap-3 mt-3 px-4">
        {exercises.map((ex, exIdx) => {
          const workingSets = ex.sets.filter((s) => !s.isWarmup);
          const completedWorking = workingSets.filter((s) => s.completed).length;

          return (
            <div key={exIdx} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {/* Exercise Header */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base font-bold truncate" style={{ color: "var(--accent)" }}>{ex.name}</span>
                    {ex.supersetTag && (
                      <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: "#FF9500", color: "#fff" }}>
                        SS-{ex.supersetTag}
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeExercise(exIdx)} className="bg-transparent border-none cursor-pointer p-1 shrink-0" style={{ color: "var(--text-muted)" }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Notes */}
                <input
                  type="text"
                  placeholder="Agregar nota..."
                  value={ex.notes}
                  onChange={(e) => updateNotes(exIdx, e.target.value)}
                  className="w-full text-[0.75rem] bg-transparent border-none outline-none mt-1 p-0"
                  style={{ color: "var(--text-secondary)" }}
                />

                {/* Rest Timer Config */}
                <div className="flex items-center gap-2 mt-1.5">
                  <Timer size={13} style={{ color: "var(--accent)" }} />
                  <span className="text-[0.72rem] font-medium" style={{ color: "var(--accent)" }}>
                    Rest Timer: {formatRest(ex.restSeconds)}
                  </span>
                  <button onClick={() => updateRestTime(exIdx, -15)} className="session-rest-btn"><MinusIcon size={10} /></button>
                  <button onClick={() => updateRestTime(exIdx, 15)} className="session-rest-btn"><Plus size={10} /></button>
                </div>
              </div>

              {/* Sets Table */}
              <div className="px-2">
                {/* Table Header */}
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-1 px-2 py-1.5 text-[0.6rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                  <span>SET</span>
                  <span>PREVIOUS</span>
                  <span className="text-center">KG</span>
                  <span className="text-center">REPS</span>
                  <span className="text-center">{"\u2713"}</span>
                </div>

                {/* Set Rows */}
                {ex.sets.map((set, setIdx) => {
                  const workingIdx = set.isWarmup ? undefined : ex.sets.filter((s, si) => si < setIdx && !s.isWarmup).length;
                  const prevSet = workingIdx !== undefined ? ex.previousSets[workingIdx] : undefined;

                  return (
                    <div
                      key={setIdx}
                      className="grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-1 items-center px-2 py-1.5 rounded-lg mb-0.5"
                      style={{ background: set.completed ? "rgba(52, 199, 89, 0.12)" : "transparent" }}
                    >
                      {/* Set label */}
                      <div>
                        {set.isWarmup ? (
                          <span className="text-[0.8rem] font-bold" style={{ color: "#FF9500" }}>W</span>
                        ) : (
                          <span className="text-[0.8rem] font-bold" style={{ color: "var(--text)" }}>
                            {(workingIdx ?? 0) + 1}
                          </span>
                        )}
                      </div>

                      {/* Previous */}
                      <div className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                        {prevSet && prevSet.weight > 0 ? `${prevSet.weight}kg \u00d7 ${prevSet.reps}` : "\u2014"}
                      </div>

                      {/* Weight Input */}
                      <input
                        type="number"
                        inputMode="decimal"
                        step={0.5}
                        value={set.weight ?? ""}
                        onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="session-input text-center"
                        style={{ color: set.completed ? "#34C759" : "var(--text)", fontWeight: set.completed ? 700 : 600 }}
                      />

                      {/* Reps Input */}
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value ? parseInt(e.target.value, 10) : 0)}
                        className="session-input text-center"
                        style={{ color: set.completed ? "#34C759" : "var(--text)", fontWeight: set.completed ? 700 : 600 }}
                      />

                      {/* Complete Check */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleSetComplete(exIdx, setIdx)}
                          className="w-[30px] h-[30px] rounded-full flex items-center justify-center border-none cursor-pointer"
                          style={{ background: set.completed ? "#34C759" : "var(--bg-elevated)" }}
                        >
                          <Check size={16} style={{ color: set.completed ? "#fff" : "var(--text-muted)" }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* + Add Set */}
              <button
                onClick={() => addSet(exIdx)}
                className="w-full py-2.5 text-[0.78rem] font-semibold bg-transparent border-none cursor-pointer flex items-center justify-center gap-1"
                style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
              >
                <Plus size={14} /> Add Set
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Actions ── */}
      <div className="px-4 mt-4 flex flex-col gap-2 pb-4">
        <button
          onClick={() => {
            setExercises((prev) => [
              ...prev,
              {
                name: "Nuevo Ejercicio",
                exerciseRef: { name: "Nuevo Ejercicio", sets: 3, reps: "10", rest: "60s", load: "", rpe: "", primaryMuscles: [] },
                exIndex: prev.length,
                notes: "",
                restSeconds: 60,
                sets: [
                  { reps: 10, weight: undefined, completed: false, isWarmup: false },
                  { reps: 10, weight: undefined, completed: false, isWarmup: false },
                  { reps: 10, weight: undefined, completed: false, isWarmup: false },
                ],
                previousSets: [],
              },
            ]);
          }}
          className="w-full py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={18} /> Add Exercise
        </button>

        <button
          onClick={() => setConfirmDiscard(true)}
          className="w-full py-2.5 rounded-xl text-[0.78rem] font-semibold cursor-pointer"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "#FF3B30" }}
        >
          Discard Workout
        </button>
      </div>

      {/* ── Rest Timer Bottom Bar ── */}
      {restActive && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in" style={{ background: "var(--accent)" }}>
          <div className="h-[3px]" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div className="h-full transition-all duration-1000" style={{ width: `${(restSeconds / restTotal) * 100}%`, background: "#fff" }} />
          </div>
          <div className="max-w-[540px] mx-auto flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setRestSeconds((s) => Math.max(0, s - 15))}
              className="text-white text-[0.8rem] font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >-15</button>
            <div className="text-white text-center">
              <div className="text-2xl font-black tabular-nums">
                {Math.floor(restSeconds / 60).toString().padStart(2, "0")}:{(restSeconds % 60).toString().padStart(2, "0")}
              </div>
            </div>
            <button
              onClick={() => setRestSeconds((s) => s + 15)}
              className="text-white text-[0.8rem] font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >+15</button>
            <button
              onClick={() => setRestActive(false)}
              className="text-[0.8rem] font-bold px-4 py-1.5 rounded-lg border-none cursor-pointer"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
            >Skip</button>
          </div>
        </div>
      )}

      {/* ── Discard Modal ── */}
      {confirmDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="card mx-6 p-5 text-center" style={{ maxWidth: 320 }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Descartar entrenamiento?</h3>
            <p className="text-[0.78rem] mb-4" style={{ color: "var(--text-muted)" }}>Se va a perder todo el progreso de esta sesion.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDiscard(false)} className="btn btn-ghost flex-1">Cancelar</button>
              <button onClick={() => router.push("/workout")} className="btn btn-danger flex-1">Descartar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function WorkoutSessionPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</div>}>
      <SessionContent />
    </Suspense>
  );
}
