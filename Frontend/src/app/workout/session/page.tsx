"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
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
  type ProgressionSuggestion,
} from "@/lib/progression";
import {
  Play, Check, ChevronRight, ChevronLeft,
  SkipForward, Timer, TrendingUp, TrendingDown, Minus, Zap,
} from "lucide-react";

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dayId = searchParams.get("day") || "";

  const workout = useMemo(() => {
    const plan = getWeeklyPlan();
    return getWorkoutById(dayId) || plan[0];
  }, [dayId]);

  // Get ProgramExercises for progression suggestions
  const phase = getCurrentPhase();
  const programDay = useMemo(() => getProgramWorkoutById(phase.id, dayId), [phase.id, dayId]);

  const [started, setStarted] = useState(false);
  const [currentEx, setCurrentEx] = useState(0);
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [sessionStart, setSessionStart] = useState(0);
  const [finished, setFinished] = useState(false);
  const [savedSession, setSavedSession] = useState<WorkoutSession | null>(null);
  const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(null);
  const [prAlert, setPrAlert] = useState<string | null>(null);
  const [showWarmup, setShowWarmup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);

  const [inputReps, setInputReps] = useState("");
  const [inputWeight, setInputWeight] = useState("");
  const [inputRpe, setInputRpe] = useState("");

  useEffect(() => {
    const logged: LoggedExercise[] = workout.exercises.map((ex) => ({
      name: ex.name,
      plannedSets: ex.sets,
      plannedReps: ex.reps,
      sets: [],
      skipped: false,
      notes: "",
      primaryMuscles: ex.primaryMuscles,
    }));
    setExercises(logged);
  }, [workout]);

  useEffect(() => {
    if (!restActive || restSeconds <= 0) {
      if (restActive && restSeconds <= 0) {
        setRestActive(false);
        // Vibrate when rest timer completes
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
      return;
    }
    const id = setInterval(() => setRestSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [restActive, restSeconds]);

  const ex = workout.exercises[currentEx];
  const loggedEx = exercises[currentEx];
  const completedSets = loggedEx?.sets.length || 0;
  const totalExercises = workout.exercises.length;
  const completedExercises = exercises.filter(
    (e) => e.skipped || e.sets.length >= (workout.exercises.find((w) => w.name === e.name)?.sets || 0)
  ).length;

  function startSession() {
    setStarted(true);
    setSessionStart(Date.now());
    if (ex) {
      prefillInputs(ex, 0);
      // Show warmup for first compound exercise
      const progEx = programDay?.exercises[0];
      if (progEx?.isCompound && parseFloat(inputWeight) > 10) {
        setShowWarmup(true);
      }
    }
  }

  function prefillInputs(exercise: Exercise, exIndex: number) {
    // Try smart suggestion from progression engine
    const progEx = programDay?.exercises[exIndex];
    if (progEx) {
      const sug = getSuggestion(exercise.name, progEx);
      setSuggestion(sug);
      // Show warmup for compound exercises on first set
      setShowWarmup(progEx.isCompound);
      if (sug) {
        setInputWeight(sug.weight && sug.weight > 0 ? String(sug.weight) : "");
        setInputReps(String(sug.reps));
        setInputRpe(exercise.rpe || "");
        return;
      }
    } else {
      setSuggestion(null);
      setShowWarmup(false);
    }
    // Fallback: use programmed values
    setInputReps(exercise.reps.split("–")[0].replace(/[^0-9]/g, "") || "");
    const loadNum = exercise.load.match(/[\d.]+/)?.[0] || "";
    setInputWeight(loadNum);
    setInputRpe(exercise.rpe || "");
  }

  function logSet() {
    if (!inputReps) return;
    const newSet: LoggedSet = {
      reps: parseInt(inputReps, 10),
      weight: inputWeight ? parseFloat(inputWeight) : undefined,
      rpe: inputRpe ? parseFloat(inputRpe) : undefined,
    };

    // PR detection
    if (ex) {
      const pr = isNewPR(ex.name, newSet);
      if (pr.isPR) {
        setPrAlert(ex.name);
        setTimeout(() => setPrAlert(null), 3000);
      }
    }

    setExercises((prev) => {
      const copy = [...prev];
      copy[currentEx] = { ...copy[currentEx], sets: [...copy[currentEx].sets, newSet] };
      return copy;
    });
    const restStr = ex?.rest || "60s";
    const restSec = parseInt(restStr.replace(/[^0-9]/g, ""), 10) || 60;
    setRestTotal(restSec);
    setRestSeconds(restSec);
    setRestActive(true);
    setInputReps(ex?.reps.split("–")[0].replace(/[^0-9]/g, "") || "");
  }

  function skipExercise() {
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentEx] = { ...copy[currentEx], skipped: true };
      return copy;
    });
    goNext();
  }

  function goNext() {
    setRestActive(false);
    if (currentEx < totalExercises - 1) {
      const next = currentEx + 1;
      setCurrentEx(next);
      prefillInputs(workout.exercises[next], next);
    } else {
      finishSession();
    }
  }

  function goPrev() {
    if (currentEx > 0) {
      const prev = currentEx - 1;
      setCurrentEx(prev);
      prefillInputs(workout.exercises[prev], prev);
      setRestActive(false);
    }
  }

  const finishSession = useCallback(() => {
    const session: WorkoutSession = {
      id: generateId(),
      date: today(),
      workoutId: workout.id,
      workoutName: workout.name,
      exercises,
      completed: true,
      startTime: sessionStart,
      endTime: Date.now(),
    };
    saveSession(session);
    setSavedSession(session);
    setFinished(true);
  }, [exercises, sessionStart, workout]);

  function formatTime(ms: number) {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ===== FINISHED =====
  if (finished && savedSession) {
    const duration = formatTime(savedSession.endTime - savedSession.startTime);
    const totalSets = savedSession.exercises.reduce((s, e) => s + e.sets.length, 0);
    const totalVolume = savedSession.exercises.reduce((s, e) => s + e.sets.reduce((a, set) => a + (set.weight || 0) * set.reps, 0), 0);
    const skipped = savedSession.exercises.filter((e) => e.skipped).length;
    return (
      <main className="max-w-[540px] mx-auto px-4 pt-10 pb-6 text-center">
        <div className="text-5xl mb-3">💪</div>
        <h1 className="text-2xl font-black mb-1">¡Sesión Completada!</h1>
        <p className="text-sm text-zinc-500 mb-6">{workout.name}</p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="card py-4 text-center">
            <div className="text-2xl font-black">{duration}</div>
            <div className="text-[0.6rem] text-zinc-500 uppercase">Duración</div>
          </div>
          <div className="card py-4 text-center">
            <div className="text-2xl font-black text-[#34C759]">{totalSets}</div>
            <div className="text-[0.6rem] text-zinc-500 uppercase">Sets</div>
          </div>
          <div className="card py-4 text-center">
            <div className="text-2xl font-black text-[#2C6BED]">{totalVolume.toLocaleString()}</div>
            <div className="text-[0.6rem] text-zinc-500 uppercase">kg Vol</div>
          </div>
        </div>

        <div className="card text-left mb-6">
          {savedSession.exercises.map((e, i) => (
            <div key={i} className="py-3" style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
              <div className={`text-[0.82rem] font-bold mb-2 ${e.skipped ? "text-zinc-400 line-through" : ""}`}>
                {e.name}
                {e.skipped && <span className="text-[#FF9500] text-[0.6rem] ml-1.5 font-normal">saltado</span>}
              </div>
              {e.sets.length > 0 && (
                <table className="w-full text-[0.72rem]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="text-zinc-400 text-[0.6rem] uppercase tracking-wider">
                      <th className="text-left py-1 w-12">Set</th>
                      <th className="text-left py-1">Peso &amp; Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.sets.map((set, j) => (
                      <tr key={j} style={{ background: j % 2 === 1 ? "var(--bg-elevated)" : "transparent" }}>
                        <td className="py-1.5 px-1 rounded-l-lg font-bold" style={{ color: "#FF9500" }}>{j + 1}</td>
                        <td className="py-1.5 rounded-r-lg">
                          {set.weight ? <span className="font-semibold">{set.weight}kg</span> : "—"} × <span className="font-semibold">{set.reps} reps</span>
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

  // ===== START SCREEN =====
  if (!started) {
    return (
      <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-zinc-500 mb-4 bg-transparent border-none cursor-pointer p-0">
          <ChevronLeft size={16} /> Volver
        </button>

        <div className="text-center mb-6">
          <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-1">{workout.day}</div>
          <h1 className="text-xl font-black mb-2" style={{ color: workout.color }}>{workout.name}</h1>
          <div className="flex gap-2 justify-center">
            <span className="badge badge-blue">{workout.focus}</span>
            <span className="badge badge-blue">{workout.duration}</span>
            <span className="badge">{workout.exercises.length} ejercicios</span>
          </div>
        </div>

        {workout.note && (
          <div className="text-[0.72rem] text-zinc-400 mb-4 py-2.5 px-3 rounded-xl leading-relaxed" style={{ background: "var(--bg-card)", borderLeft: `3px solid ${workout.color}` }}>
            {workout.note}
          </div>
        )}

        <div className="card mb-5">
          {workout.exercises.map((ex, i) => (
            <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: i < workout.exercises.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <div>
                <div className="text-sm font-semibold text-zinc-800">{ex.name}</div>
                {ex.notes && <div className="text-[0.6rem] text-zinc-600">{ex.notes}</div>}
              </div>
              <div className="text-right">
                <div className="text-[0.75rem] text-zinc-400">{ex.sets}×{ex.reps}</div>
                <div className="text-[0.6rem] text-zinc-600">{ex.load}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={startSession} className="btn btn-primary w-full text-base py-3.5 font-extrabold" style={{ background: workout.color }}>
          <Play size={22} /> EMPEZAR
        </button>
      </main>
    );
  }

  // ===== ACTIVE SESSION =====
  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-[0.65rem] text-zinc-500 flex items-center gap-1">
          <Timer size={12} /> {formatTime(Date.now() - sessionStart)}
        </div>
        <div className="text-sm font-bold" style={{ color: workout.color }}>{currentEx + 1}/{totalExercises}</div>
        <button onClick={finishSession} className="text-[0.7rem] font-bold text-white px-2.5 py-1 rounded-lg cursor-pointer border-none" style={{ background: "#34C759" }}>
          Terminar
        </button>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-4">
        <div className="progress-fill" style={{ width: `${(completedExercises / totalExercises) * 100}%`, background: workout.color }} />
      </div>

      {/* PR Alert */}
      {prAlert && (
        <div className="mb-3 py-2.5 px-3 rounded-xl text-center text-sm font-bold animate-pulse" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000" }}>
          🏆 ¡Nuevo PR en {prAlert}!
        </div>
      )}

      {/* Current Exercise */}
      <div className="card mb-3">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-lg font-extrabold mb-1 cursor-pointer" style={{ color: workout.color }} onClick={() => setShowHistory(!showHistory)}>{ex?.name}</h2>
            <div className="text-[0.75rem] text-zinc-400">{ex?.sets}×{ex?.reps} · {ex?.load} · RPE {ex?.rpe}</div>
            {ex?.notes && <div className="text-[0.65rem] text-zinc-600 mt-0.5">{ex.notes}</div>}
          </div>
          {ex?.superset && (
            <span className="badge badge-orange text-[0.55rem] font-bold">SS-{ex.superset}</span>
          )}
        </div>

        {/* Exercise History Drawer */}
        {showHistory && ex && (() => {
          const history = getExerciseHistory(ex.name, 5);
          if (history.length === 0) return (
            <div className="mb-3 py-2 px-3 rounded-lg text-[0.72rem] text-zinc-500 text-center" style={{ background: "var(--bg-elevated)" }}>
              Sin historial previo
            </div>
          );
          return (
            <div className="mb-3 py-2.5 px-3 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-[0.6rem] text-zinc-600 uppercase font-bold mb-2">Últimas sesiones</div>
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 text-[0.7rem]" style={{ borderBottom: i < history.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span className="text-zinc-500">{h.date.slice(5)}</span>
                  <div className="flex gap-1.5">
                    <span className="font-semibold">{h.topSet.weight}kg×{h.topSet.reps}</span>
                    {h.avgRpe > 0 && <span className="text-zinc-400">RPE {h.avgRpe.toFixed(1)}</span>}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Warmup Sets */}
        {showWarmup && completedSets === 0 && (() => {
          const w = parseFloat(inputWeight) || 0;
          const warmupSets = getWarmupSets(w);
          if (warmupSets.length === 0) return null;
          return (
            <div className="mb-3 py-2.5 px-3 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
              <div className="flex justify-between items-center mb-2">
                <div className="text-[0.65rem] text-zinc-600 uppercase font-bold flex items-center gap-1">
                  <Zap size={12} className="text-[#FF9500]" /> Calentamiento
                </div>
                <button onClick={() => setShowWarmup(false)} className="text-[0.6rem] text-zinc-500 bg-transparent border-none cursor-pointer">Ocultar</button>
              </div>
              {warmupSets.map((ws, i) => (
                <div key={i} className="flex justify-between text-[0.72rem] py-1" style={{ borderBottom: i < warmupSets.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span className="text-zinc-600">{ws.weight === 0 ? "Barra vacía" : `${ws.weight}kg`}</span>
                  <span className="text-zinc-500">{ws.reps} reps</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Progression Suggestion */}
        {suggestion && !restActive && completedSets < (ex?.sets || 0) && (
          <div className="mb-3 py-2 px-3 rounded-lg text-[0.72rem] flex items-center gap-2" style={{ background: "var(--bg-elevated)" }}>
            {suggestion.trend === "up" && <TrendingUp size={14} className="text-[#34C759]" />}
            {suggestion.trend === "down" && <TrendingDown size={14} className="text-[#FF3B30]" />}
            {suggestion.trend === "same" && <Minus size={14} className="text-zinc-400" />}
            <span className="text-zinc-600">{suggestion.reason}</span>
          </div>
        )}

        {/* Logged sets — table */}
        {loggedEx && loggedEx.sets.length > 0 && (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-[0.72rem]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="text-[0.6rem] text-zinc-500 uppercase">
                  <th className="text-left py-1 pr-2 font-semibold" style={{ width: 40 }}>Set</th>
                  <th className="text-center py-1 px-1 font-semibold">Reps</th>
                  <th className="text-center py-1 px-1 font-semibold">kg</th>
                  <th className="text-center py-1 px-1 font-semibold">RPE</th>
                </tr>
              </thead>
              <tbody>
                {loggedEx.sets.map((s, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td className="py-1.5 pr-2 text-zinc-400 font-medium">{i + 1}</td>
                    <td className="py-1.5 px-1 text-center font-bold">{s.reps}</td>
                    <td className="py-1.5 px-1 text-center text-zinc-600">{s.weight ?? "—"}</td>
                    <td className="py-1.5 px-1 text-center text-zinc-500">{s.rpe ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Set progress dots */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: ex?.sets || 0 }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < completedSets ? "#34C759" : "var(--bg-elevated)" }} />
          ))}
        </div>

        {completedSets < (ex?.sets || 0) && (
          <>
            {/* Rest Timer */}
            {restActive && (
              <div className="text-center mb-3 py-3 px-3 rounded-xl" style={{ background: "var(--bg)" }}>
                <div className="text-[0.6rem] text-zinc-600 uppercase mb-1">Descanso</div>
                <div className="text-4xl font-black" style={{ color: restSeconds <= 5 ? "#FF3B30" : "var(--text)" }}>{restSeconds}s</div>
                <div className="progress-bar mt-2 mb-2">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(restSeconds / restTotal) * 100}%`, background: restSeconds <= 5 ? "#FF3B30" : "#34C759" }} />
                </div>
                <button onClick={() => setRestActive(false)} className="text-[0.7rem] text-zinc-500 bg-transparent cursor-pointer py-1 px-3 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                  Saltar descanso
                </button>
              </div>
            )}

            {/* Input Row — table-aligned */}
            {!restActive && (
              <div className="flex gap-1.5 items-end">
                <div className="flex-1">
                  <label className="block text-[0.55rem] text-zinc-500 uppercase mb-1 text-center">Reps</label>
                  <input type="number" value={inputReps} onChange={(e) => setInputReps(e.target.value)} className="w-full text-center text-[0.9rem] font-bold py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
                </div>
                <div className="flex-1">
                  <label className="block text-[0.55rem] text-zinc-500 uppercase mb-1 text-center">kg</label>
                  <input type="number" step={0.5} value={inputWeight} onChange={(e) => setInputWeight(e.target.value)} className="w-full text-center text-[0.9rem] font-bold py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
                </div>
                <div className="flex-1">
                  <label className="block text-[0.55rem] text-zinc-500 uppercase mb-1 text-center">RPE</label>
                  <input type="number" step={0.5} value={inputRpe} onChange={(e) => setInputRpe(e.target.value)} className="w-full text-center text-[0.9rem] font-bold py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
                </div>
                <button
                  onClick={logSet}
                  disabled={!inputReps}
                  className="h-[42px] w-[42px] rounded-xl border-none cursor-pointer text-white font-bold flex items-center justify-center shrink-0"
                  style={{ background: inputReps ? "#34C759" : "var(--bg-elevated)" }}
                >
                  <Check size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {completedSets >= (ex?.sets || 0) && (
          <div className="text-center py-2.5 text-[#34C759] text-sm font-bold">✓ Ejercicio completado</div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-3">
        <button onClick={goPrev} disabled={currentEx === 0} className="btn btn-ghost flex-1 text-sm" style={{ opacity: currentEx === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={16} /> Anterior
        </button>
        <button onClick={skipExercise} className="btn btn-ghost px-3">
          <SkipForward size={14} />
        </button>
        <button onClick={goNext} className="btn flex-1 text-sm font-bold text-white border-none cursor-pointer" style={{ background: workout.color }}>
          {currentEx === totalExercises - 1 ? "Finalizar" : "Siguiente"} <ChevronRight size={16} />
        </button>
      </div>

      {/* Mini exercise list */}
      <div className="card">
        <div className="text-[0.6rem] text-zinc-600 uppercase mb-2">Ejercicios</div>
        {workout.exercises.map((e, i) => {
          const log = exercises[i];
          const done = log?.skipped || (log?.sets.length || 0) >= e.sets;
          const active = i === currentEx;
          return (
            <div
              key={i}
              onClick={() => { setCurrentEx(i); prefillInputs(e, i); setRestActive(false); }}
              className="flex justify-between items-center py-1.5 px-1 cursor-pointer rounded"
              style={{
                background: active ? "var(--bg-elevated)" : "transparent",
                borderLeft: active ? `2px solid ${workout.color}` : "2px solid transparent",
              }}
            >
              <span className={`text-[0.72rem] ${done ? "text-[#34C759]" : active ? "text-zinc-800 font-bold" : "text-zinc-600"} ${log?.skipped ? "line-through" : ""}`}>
                {done && !log?.skipped ? "✓ " : ""}{e.name}
              </span>
              <span className="text-[0.6rem] text-zinc-600">{log?.sets.length || 0}/{e.sets}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function WorkoutSessionPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-zinc-600">Cargando...</div>}>
      <SessionContent />
    </Suspense>
  );
}
