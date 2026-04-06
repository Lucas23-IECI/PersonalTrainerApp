"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWorkoutById, getWeeklyPlan, type Exercise, type WorkoutDay } from "@/data/workouts";
import { getCurrentPhase } from "@/data/phases";
import { getProgramWorkoutById } from "@/data/programs";
import {
  generateId,
  today,
  saveSession,
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
  getSettings,
  type WorkoutSession,
  type LoggedExercise,
  type SetType,
} from "@/lib/storage";
import {
  getSuggestion,
  isNewPR,
  getExerciseHistory,
  getWarmupSets,
} from "@/lib/progression";
import {
  sendWorkoutNotification,
  clearWorkoutNotification,
  requestNotificationPermission,
} from "@/lib/native";
import {
  Check, ChevronDown, Timer, Plus, Trash2, Minus as MinusIcon,
  ArrowUp, ArrowDown, RefreshCw, Link2, MessageSquare,
} from "lucide-react";
import AddExerciseModal from "@/components/AddExerciseModal";
import RestTimer from "@/components/RestTimer";
import ExerciseProgressInline from "@/components/workout/ExerciseProgressInline";
import SessionSummary from "@/components/workout/session/SessionSummary";
import { type SessionSet, type SessionExercise, SUPERSET_COLORS, SUPERSET_TAGS, formatDuration, formatRest } from "@/components/workout/session/types";
import SetTypeBadge, { nextSetType, isWarmupType } from "@/components/SetTypeBadge";
import { vibrateTimerComplete, vibrateMedium, vibrateHeavy, vibrateSuccess, vibrateLight } from "@/lib/haptics";
import { exerciseLibrary, type LibraryExercise, type ExerciseCategory } from "@/data/exercises";
import WarmupGenerator from "@/components/WarmupGenerator";
import { checkDeload, type DeloadCheck } from "@/lib/deload";

// 4.3 — Smart rest times: compound vs accessory, RPE-adjusted
const REST_BY_CATEGORY: Record<ExerciseCategory, number> = {
  barbell: 150,
  dumbbell: 90,
  machine: 90,
  cable: 75,
  bodyweight: 60,
  band: 45,
  cardio: 30,
};

// Compound exercises get longer rest; RPE adjusts further
function getSmartRest(exerciseId: string | undefined, restStr: string | undefined, isCompound: boolean, lastRpe?: number): number {
  // If explicitly defined, use it
  if (restStr) {
    const parsed = parseInt(restStr.replace(/[^0-9]/g, ""), 10);
    if (parsed > 0) return parsed;
  }
  // Base rest by compound/accessory
  let base = isCompound ? 180 : 75; // 3min compounds, 75s accessories

  // Refine by category if available
  if (exerciseId) {
    const lib = exerciseLibrary.find((e) => e.id === exerciseId);
    if (lib) {
      base = isCompound
        ? (lib.category === "barbell" ? 210 : 180) // barbell compounds 3.5min
        : REST_BY_CATEGORY[lib.category];
    }
  }

  // RPE adjustment: higher RPE = more rest
  if (lastRpe && lastRpe >= 9) base = Math.round(base * 1.3);      // RPE 9-10: +30%
  else if (lastRpe && lastRpe >= 8) base = Math.round(base * 1.15); // RPE 8-8.5: +15%

  return base;
}

function getDefaultRest(exerciseId?: string, restStr?: string): number {
  return getSmartRest(exerciseId, restStr, false);
}



function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dayId = searchParams.get("day") || "";

  const isQuickStart = dayId === 'quickstart';
  const workout = useMemo(() => {
    if (dayId === 'quickstart') {
      const active = getActiveSession();
      return { id: 'quickstart', name: active?.workoutName || 'Quick Workout', day: '', focus: 'Custom', duration: '', color: '#0A84FF', type: 'full' as const, exercises: [], note: '' } satisfies WorkoutDay;
    }
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
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [replaceExerciseIdx, setReplaceExerciseIdx] = useState<number | null>(null);
  const [warmupDismissed, setWarmupDismissed] = useState(false);
  const [deloadDismissed, setDeloadDismissed] = useState(false);
  const deloadCheck = useMemo(() => checkDeload(), []);

  // Collect target muscles for warmup generator
  const targetMuscles = useMemo(() => {
    const muscles = new Set<string>();
    for (const ex of workout.exercises) {
      for (const m of (ex.primaryMuscles || [])) muscles.add(m);
    }
    return [...muscles] as import("@/data/exercises").MuscleGroup[];
  }, [workout.exercises]);
  const [expandedSetNote, setExpandedSetNote] = useState<string | null>(null); // "exIdx-setIdx"

  const [swipeState, setSwipeState] = useState<{ key: string; startX: number; dx: number } | null>(null);

  // Rest timer
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const notifDataRef = useRef({ exName: '', completed: 0, total: 0 });

  // ── Initialize exercises (or restore active session) ──
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const active = getActiveSession();
    if (active && active.dayId === dayId) {
      // Restore from persisted active session (migrate old isWarmup-only data)
      const restored = (active.exercises as SessionExercise[]).map(e => ({
        ...e,
        sets: e.sets.map(s => ({ ...s, setType: s.setType || (s.isWarmup ? 'warmup' as SetType : 'normal' as SetType) })),
      }));
      setExercises(restored);
      setSessionStart(active.sessionStart);
      setStarted(true);
      return;
    }

    // Quick start: empty session, auto-start
    if (isQuickStart) {
      setExercises([]);
      setStarted(true);
      setSessionStart(Date.now());
      requestNotificationPermission();
      return;
    }

    const exs: SessionExercise[] = workout.exercises.map((ex, i) => {
      const history = getExerciseHistory(ex.name, 1);
      const prev = history[0]?.sets.map((s) => ({ weight: s.weight || 0, reps: s.reps })) || [];
      const restStr = ex.rest || "";
      const progEx = programDay?.exercises[i];
      const restSec = getSmartRest(ex.exerciseId, restStr, progEx?.isCompound ?? false);

      const plannedSets: SessionSet[] = [];
      // Warmup sets for compound exercises
      if (progEx?.isCompound) {
        const sug = getSuggestion(ex.name, progEx);
        const targetWeight = sug?.weight || parseFloat(ex.load.match(/[\d.]+/)?.[0] || "0") || 0;
        if (targetWeight > 20) {
          const warmups = getWarmupSets(targetWeight);
          warmups.forEach((ws) => {
            plannedSets.push({ reps: ws.reps, weight: ws.weight, completed: false, isWarmup: true, setType: 'warmup' });
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
          setType: 'normal',
        });
      }

      return {
        name: ex.name,
        exerciseRef: ex,
        exIndex: i,
        notes: "",
        restSeconds: restSec,
        isCompound: progEx?.isCompound ?? false,
        sets: plannedSets,
        supersetTag: ex.superset,
        previousSets: prev,
      };
    });
    setExercises(exs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId]);

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
        vibrateTimerComplete();
      }
      return;
    }
    const id = setInterval(() => setRestSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [restActive, restSeconds]);

  // ── Auto-save active session to localStorage ──
  useEffect(() => {
    if (!started || finished || exercises.length === 0) return;
    saveActiveSession({
      dayId,
      workoutName: workout.name,
      sessionStart,
      exercises: exercises.map((e) => ({
        name: e.name,
        exerciseRef: e.exerciseRef,
        exIndex: e.exIndex,
        notes: e.notes,
        restSeconds: e.restSeconds,
        sets: e.sets.map((s) => ({ reps: s.reps, weight: s.weight, rpe: s.rpe, rir: s.rir, completed: s.completed, isWarmup: s.isWarmup, setType: s.setType })),
        supersetTag: e.supersetTag,
        previousSets: e.previousSets,
      })),
    });
  }, [started, finished, exercises, sessionStart, dayId, workout.name]);

  // ── Notification data ref — updated when exercises change ──
  useEffect(() => {
    const currentEx = exercises.find((e) => e.sets.some((s) => !s.completed && !isWarmupType(s.setType)));
    notifDataRef.current = {
      exName: currentEx?.name || exercises[exercises.length - 1]?.name || '',
      completed: exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed && !isWarmupType(s.setType)).length, 0),
      total: exercises.reduce((a, e) => a + e.sets.filter((s) => !isWarmupType(s.setType)).length, 0),
    };
  }, [exercises]);

  // ── Persistent notification — updates every 10s independently ──
  useEffect(() => {
    if (!started || finished) return;
    const startMs = sessionStart;

    const update = () => {
      const elMs = Date.now() - startMs;
      const sec = Math.floor(elMs / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      const time = `${m}:${s.toString().padStart(2, '0')}`;
      const { exName, completed, total } = notifDataRef.current;
      sendWorkoutNotification(
        `${workout.name} — ${time}`,
        `${exName} · ${completed}/${total} sets`
      );
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [started, finished, sessionStart, workout.name]);

  // ── Handle Android hardware back button ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let removeListener: (() => void) | undefined;

    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => {
        if (started && !finished) {
          // Minimize session - navigate to workout page (session persists)
          router.push('/workout');
        } else {
          router.back();
        }
      }).then(handle => {
        removeListener = () => handle.remove();
      });
    }).catch(() => { /* not in Capacitor */ });

    return () => { removeListener?.(); };
  }, [started, finished, router]);

  // ── Computed stats ──
  const totalSets = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.completed && !isWarmupType(s.setType)).length, 0);
  const totalVolume = exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).reduce((v, s) => v + (s.weight || 0) * s.reps, 0), 0
  );

  // ── Helpers ──
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

      // 4.4 Special set protocols
      if (set.setType === 'dropset') {
        // Auto-add next drop set with ~20% less weight
        const nextWeight = set.weight ? Math.round(set.weight * 0.8 / 2.5) * 2.5 : undefined;
        setExercises((prev) =>
          prev.map((e, i) => {
            if (i !== exIdx) return e;
            const insertIdx = setIdx + 1;
            const newSet: SessionSet = { reps: set.reps, weight: nextWeight, completed: false, isWarmup: false, setType: 'dropset' };
            const sets = [...e.sets];
            sets.splice(insertIdx, 0, newSet);
            return { ...e, sets };
          })
        );
        // Short rest for drop sets (10s)
        setRestTotal(10);
        setRestSeconds(10);
        setRestActive(true);
        return;
      }

      if (set.setType === 'restpause') {
        // Rest-pause: 15s mini-rest between mini-sets
        setRestTotal(15);
        setRestSeconds(15);
        setRestActive(true);
        return;
      }

      if (set.setType === 'myoreps') {
        // Myo-reps: 5s breaths between "match" sets
        // If reps dropped significantly (< 50% of first myo set), don't auto-rest
        const myoSets = ex.sets.filter((s) => s.setType === 'myoreps' && s.completed);
        const firstMyo = ex.sets.find((s) => s.setType === 'myoreps');
        if (firstMyo && set.reps < firstMyo.reps * 0.5) {
          // Reps dropped too much — myo-rep cluster done, normal rest
          const smartRest = getSmartRest(ex.exerciseRef.exerciseId, ex.exerciseRef.rest, ex.isCompound, set.rpe);
          setRestTotal(smartRest);
          setRestSeconds(smartRest);
        } else {
          setRestTotal(5);
          setRestSeconds(5);
        }
        setRestActive(true);
        return;
      }

      if (set.setType === 'cluster') {
        // Cluster sets: 20s micro-pause between mini-sets within a cluster
        setRestTotal(20);
        setRestSeconds(20);
        setRestActive(true);
        return;
      }

      // 4.3 Smart rest: adjust by compound/accessory + RPE
      const smartRest = getSmartRest(ex.exerciseRef.exerciseId, ex.exerciseRef.rest, ex.isCompound, set.rpe);
      setRestTotal(smartRest);
      setRestSeconds(smartRest);
      setRestActive(true);
    }
  }

  function addSet(exIdx: number) {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        const lastWorking = [...e.sets].reverse().find((s) => !isWarmupType(s.setType));
        return {
          ...e,
          sets: [...e.sets, { reps: lastWorking?.reps || 10, weight: lastWorking?.weight, completed: false, isWarmup: false, setType: 'normal' as SetType }],
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

  function addExerciseFromLibrary(libEx: LibraryExercise) {
    const history = getExerciseHistory(libEx.name, 1);
    const prev = history[0]?.sets.map((s) => ({ weight: s.weight || 0, reps: s.reps })) || [];
    setExercises((p) => [
      ...p,
      {
        name: libEx.name,
        exerciseRef: { name: libEx.name, sets: 3, reps: '10', rest: '60s', load: '', rpe: '', primaryMuscles: libEx.primaryMuscles },
        exIndex: p.length,
        notes: '',
        restSeconds: REST_BY_CATEGORY[libEx.category] || 60,
        isCompound: false,
        sets: [
          { reps: prev[0]?.reps || 10, weight: prev[0]?.weight || undefined, completed: false, isWarmup: false, setType: 'normal' as SetType },
          { reps: prev[1]?.reps || 10, weight: prev[1]?.weight || undefined, completed: false, isWarmup: false, setType: 'normal' as SetType },
          { reps: prev[2]?.reps || 10, weight: prev[2]?.weight || undefined, completed: false, isWarmup: false, setType: 'normal' as SetType },
        ],
        previousSets: prev,
      },
    ]);
    setShowAddExercise(false);
  }

  function replaceExerciseFromLibrary(libEx: LibraryExercise) {
    if (replaceExerciseIdx === null) return;
    const history = getExerciseHistory(libEx.name, 1);
    const prev = history[0]?.sets.map((s) => ({ weight: s.weight || 0, reps: s.reps })) || [];
    setExercises((p) =>
      p.map((e, i) =>
        i === replaceExerciseIdx
          ? {
              ...e,
              name: libEx.name,
              exerciseRef: { name: libEx.name, sets: 3, reps: '10', rest: '60s', load: '', rpe: '', primaryMuscles: libEx.primaryMuscles },
              previousSets: prev,
              sets: e.sets.map((s, si) => ({ ...s, weight: prev[si]?.weight || s.weight, reps: prev[si]?.reps || s.reps })),
            }
          : e
      )
    );
    setReplaceExerciseIdx(null);
    setShowAddExercise(false);
  }

  function moveExercise(exIdx: number, direction: -1 | 1) {
    const target = exIdx + direction;
    if (target < 0 || target >= exercises.length) return;
    setExercises((prev) => {
      const arr = [...prev];
      [arr[exIdx], arr[target]] = [arr[target], arr[exIdx]];
      return arr;
    });
  }

  function cycleSuperset(exIdx: number) {
    setExercises((prev) => {
      const tag = prev[exIdx].supersetTag;
      const idx = tag ? SUPERSET_TAGS.indexOf(tag) : -1;
      const next = idx + 1 < SUPERSET_TAGS.length ? SUPERSET_TAGS[idx + 1] : undefined;
      return prev.map((e, i) => i === exIdx ? { ...e, supersetTag: next } : e);
    });
  }

  function updateSetNote(exIdx: number, setIdx: number, note: string) {
    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, note } : s)) } : e
      )
    );
  }

  function handleSwipeStart(key: string, x: number) {
    setSwipeState({ key, startX: x, dx: 0 });
  }
  function handleSwipeMove(x: number) {
    if (!swipeState) return;
    const dx = Math.min(0, x - swipeState.startX);
    setSwipeState((s) => s ? { ...s, dx } : null);
  }
  function handleSwipeEnd(exIdx: number, setIdx: number) {
    if (swipeState && swipeState.dx < -80) {
      removeSet(exIdx, setIdx);
    }
    setSwipeState(null);
  }

  function fillFromPrevious(exIdx: number, setIdx: number) {
    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];
    const wIdx = isWarmupType(set.setType) ? undefined : ex.sets.filter((s, si) => si < setIdx && !isWarmupType(s.setType)).length;
    const prev = wIdx !== undefined ? ex.previousSets[wIdx] : undefined;
    if (!prev) return;
    setExercises((p) => p.map((e, i) => i === exIdx ? { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, weight: prev.weight || s.weight, reps: prev.reps || s.reps } : s) } : e));
  }

  // ── Notification helpers ──
  // (Now using native.ts: sendWorkoutNotification / clearWorkoutNotification)

  function startSession() {
    setStarted(true);
    setSessionStart(Date.now());
    requestNotificationPermission();
  }

  const finishSession = useCallback(() => {
    const logged: LoggedExercise[] = exercises.map((ex) => ({
      name: ex.name,
      plannedSets: ex.exerciseRef.sets,
      plannedReps: ex.exerciseRef.reps,
      sets: ex.sets.filter((s) => s.completed && !isWarmupType(s.setType)).map((s) => ({ reps: s.reps, weight: s.weight, rpe: s.rpe, rir: s.rir, setType: s.setType === 'normal' ? undefined : s.setType })),
      skipped: ex.sets.filter((s) => s.completed && !isWarmupType(s.setType)).length === 0,
      notes: ex.notes || ex.sets.filter(s => s.note).map((s, i) => `Set ${i + 1}: ${s.note}`).join('; ') || undefined,
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
      rating: undefined,
      sessionNotes: undefined,
    };
    saveSession(session);
    clearActiveSession();
    clearWorkoutNotification();

    // Advance DUP counter for this workout day
    import("@/lib/dup").then(({ isDUPEnabled, advanceDUPCounter }) => {
      if (isDUPEnabled()) advanceDUPCounter(workout.id);
    });

    setSavedSession(session);
    setFinished(true);
  }, [exercises, sessionStart, workout]);

  // ═════════════════════════════════════
  // FINISHED SUMMARY
  // ═════════════════════════════════════
  if (finished && savedSession) {
    return <SessionSummary session={savedSession} workoutName={workout.name} />;
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
        {/* 4.1 — Warmup Generator */}
        {!warmupDismissed && targetMuscles.length > 0 && (
          <WarmupGenerator targetMuscles={targetMuscles} onClose={() => setWarmupDismissed(true)} />
        )}
        {/* 4.7 — Deload Alert */}
        {deloadCheck.shouldDeload && !deloadDismissed && (
          <div className="mb-4 rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", borderLeft: "3px solid #FF9500" }}>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.8rem] font-bold" style={{ color: "#FF9500" }}>⚠️ Semana de Descarga</span>
                <button onClick={() => setDeloadDismissed(true)} className="text-[0.65rem] bg-transparent border-none cursor-pointer" style={{ color: "var(--text-muted)" }}>
                  Ignorar
                </button>
              </div>
              <p className="text-[0.7rem] leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
                {deloadCheck.reason}
              </p>
              <div className="flex gap-3 text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                <span>RPE promedio: <strong style={{ color: "#FF9500" }}>{deloadCheck.avgRpe}</strong></span>
                <span>Sesiones altas: <strong style={{ color: "#FF9500" }}>{deloadCheck.consecutiveHighSessions}</strong></span>
              </div>
              <p className="text-[0.62rem] mt-2 leading-snug" style={{ color: "var(--text-muted)" }}>
                💡 Reducí el peso al 60%, quitá 1 serie por ejercicio, y mantené RPE 6-7 esta semana.
              </p>
            </div>
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
      <div className="sticky top-0 z-30" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/workout")} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
              <ChevronDown size={20} />
            </button>
            <div>
              <div className="text-[0.82rem] font-bold" style={{ color: "var(--text)" }}>{workout.name}</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent)" }}>{formatDuration(elapsed)}</div>
            </div>
          </div>
          <button
            onClick={finishSession}
            className="text-[0.8rem] font-bold text-white px-5 py-2 rounded-xl cursor-pointer border-none"
            style={{ background: "var(--accent-green)" }}
          >
            Finish
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex px-4 pb-2 gap-6">
          <div>
            <div className="text-[0.5rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Volume</div>
            <div className="text-[0.82rem] font-bold" style={{ color: "var(--text)" }}>{totalVolume.toLocaleString()} kg</div>
          </div>
          <div>
            <div className="text-[0.5rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Sets</div>
            <div className="text-[0.82rem] font-bold" style={{ color: "var(--text)" }}>{totalSets}</div>
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
          const workingSets = ex.sets.filter((s) => !isWarmupType(s.setType));
          const completedWorking = workingSets.filter((s) => s.completed).length;

          return (
            <div key={exIdx} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderLeft: ex.supersetTag ? `3px solid ${SUPERSET_COLORS[ex.supersetTag] || '#FF9500'}` : undefined }}>
              {/* Exercise Header */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[0.92rem] font-bold truncate" style={{ color: "var(--accent)" }}>{ex.name}</span>
                    {ex.supersetTag && (
                      <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: SUPERSET_COLORS[ex.supersetTag] || '#FF9500', color: "#fff" }}>
                        SS-{ex.supersetTag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => moveExercise(exIdx, -1)} disabled={exIdx === 0} className="bg-transparent border-none cursor-pointer p-1 disabled:opacity-20" style={{ color: "var(--text-muted)" }}>
                      <ArrowUp size={15} />
                    </button>
                    <button onClick={() => moveExercise(exIdx, 1)} disabled={exIdx === exercises.length - 1} className="bg-transparent border-none cursor-pointer p-1 disabled:opacity-20" style={{ color: "var(--text-muted)" }}>
                      <ArrowDown size={15} />
                    </button>
                    <button onClick={() => cycleSuperset(exIdx)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: ex.supersetTag ? (SUPERSET_COLORS[ex.supersetTag] || '#FF9500') : "var(--text-muted)" }}>
                      <Link2 size={15} />
                    </button>
                    <button onClick={() => { setReplaceExerciseIdx(exIdx); setShowAddExercise(true); }} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                      <RefreshCw size={14} />
                    </button>
                    <button onClick={() => removeExercise(exIdx)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
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

                {/* Inline Progress */}
                <ExerciseProgressInline exerciseName={ex.name} />

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
                <div className="grid grid-cols-[36px_1fr_1fr_1fr_42px_40px] gap-1 px-2 py-1.5 text-[0.6rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                  <span>SET</span>
                  <span>PREV</span>
                  <span className="text-center">KG</span>
                  <span className="text-center">REPS</span>
                  <span className="text-center">RPE</span>
                  <span className="text-center">{"\u2713"}</span>
                </div>

                {/* Set Rows */}
                {ex.sets.map((set, setIdx) => {
                  const isWarmup = isWarmupType(set.setType);
                  const workingIdx = isWarmup ? undefined : ex.sets.filter((s, si) => si < setIdx && !isWarmupType(s.setType)).length;
                  const prevSet = workingIdx !== undefined ? ex.previousSets[workingIdx] : undefined;
                  const swipeKey = `${exIdx}-${setIdx}`;
                  const isNoteOpen = expandedSetNote === swipeKey;
                  const swipeDx = swipeState?.key === swipeKey ? swipeState.dx : 0;

                  return (
                    <div key={setIdx} className="relative overflow-hidden rounded-lg mb-0.5">
                      {/* Swipe-to-delete background */}
                      {swipeDx < -20 && (
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 rounded-r-lg" style={{ background: '#FF3B30' }}>
                          <Trash2 size={16} style={{ color: '#fff' }} />
                        </div>
                      )}
                    <div
                      className="grid grid-cols-[36px_1fr_1fr_1fr_42px_40px] gap-1 items-center px-2 py-1.5 relative"
                      style={{ background: set.completed ? "rgba(48, 209, 88, 0.08)" : "var(--bg-card)", transform: `translateX(${swipeDx}px)`, transition: swipeState?.key === swipeKey ? 'none' : 'transform 0.2s' }}
                      onTouchStart={(e) => handleSwipeStart(swipeKey, e.touches[0].clientX)}
                      onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
                      onTouchEnd={() => handleSwipeEnd(exIdx, setIdx)}
                    >
                      {/* Set type badge (tappable to cycle) */}
                      <div className="flex justify-center">
                        <SetTypeBadge
                          type={set.setType}
                          index={(workingIdx ?? 0) + 1}
                          onCycle={() => {
                            const next = nextSetType(set.setType);
                            updateSet(exIdx, setIdx, "setType", next);
                            updateSet(exIdx, setIdx, "isWarmup", isWarmupType(next));
                          }}
                        />
                      </div>

                      {/* Previous — tap to fill */}
                      <button
                        onClick={() => prevSet && prevSet.weight > 0 && fillFromPrevious(exIdx, setIdx)}
                        disabled={!prevSet || prevSet.weight <= 0}
                        className="text-[0.7rem] bg-transparent border-none p-0 text-left cursor-pointer disabled:cursor-default"
                        style={{ color: prevSet && prevSet.weight > 0 ? "var(--accent)" : "var(--text-muted)" }}
                      >
                        {prevSet && prevSet.weight > 0 ? `${prevSet.weight}×${prevSet.reps}` : "\u2014"}
                      </button>

                      {/* Weight Input with Stepper — 6.4/6.10 */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const inc = getSettings().weightIncrement;
                            const cur = set.weight ?? 0;
                            const next = Math.max(0, cur - inc);
                            updateSet(exIdx, setIdx, "weight", next || undefined);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md border-none cursor-pointer text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          step={0.5}
                          min={0}
                          pattern="[0-9]*\.?[0-9]*"
                          enterKeyHint="next"
                          placeholder="kg"
                          value={set.weight ?? ""}
                          onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value ? parseFloat(e.target.value) : undefined)}
                          onFocus={(e) => e.target.select()}
                          className="session-input text-center flex-1 min-w-0"
                          style={{ color: set.completed ? "var(--accent-green)" : "var(--text)", fontWeight: 600 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const inc = getSettings().weightIncrement;
                            const cur = set.weight ?? 0;
                            updateSet(exIdx, setIdx, "weight", cur + inc);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md border-none cursor-pointer text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                        >
                          +
                        </button>
                      </div>

                      {/* Reps Input */}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        pattern="[0-9]*"
                        enterKeyHint="next"
                        placeholder="reps"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value ? parseInt(e.target.value, 10) : 0)}
                        onFocus={(e) => e.target.select()}
                        className="session-input text-center"
                        style={{ color: set.completed ? "var(--accent-green)" : "var(--text)", fontWeight: 600 }}
                      />

                      {/* RPE Input */}
                      <select
                        value={set.rpe ?? ""}
                        onChange={(e) => {
                          const rpe = e.target.value ? parseFloat(e.target.value) : undefined;
                          updateSet(exIdx, setIdx, "rpe", rpe);
                          updateSet(exIdx, setIdx, "rir", rpe !== undefined ? 10 - rpe : undefined);
                        }}
                        className="session-input text-center text-[0.7rem] appearance-none px-0"
                        style={{ color: set.rpe ? "var(--accent)" : "var(--text-muted)", fontWeight: 600 }}
                      >
                        <option value="">—</option>
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>

                      {/* Complete Check */}
                      <div className="flex justify-center gap-0.5 items-center">
                        {set.tempo && (
                          <span className="text-[0.45rem] font-bold px-1 rounded" style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                            {set.tempo}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedSetNote(isNoteOpen ? null : swipeKey)}
                          className="bg-transparent border-none cursor-pointer p-0"
                          style={{ color: set.note || set.tempo ? 'var(--accent)' : 'var(--text-muted)', opacity: set.note || set.tempo ? 1 : 0.4 }}
                        >
                          <MessageSquare size={12} />
                        </button>
                        <button
                          onClick={() => toggleSetComplete(exIdx, setIdx)}
                          className="w-[28px] h-[28px] rounded-lg flex items-center justify-center border-none cursor-pointer transition-colors"
                          style={{ background: set.completed ? "var(--accent-green)" : "var(--bg-elevated)", border: set.completed ? "none" : "1px solid var(--border)" }}
                        >
                          <Check size={14} strokeWidth={3} style={{ color: set.completed ? "#fff" : "var(--text-muted)" }} />
                        </button>
                      </div>
                    </div>
                    {/* Per-set note input */}
                    {isNoteOpen && (
                      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <input
                          type="text"
                          placeholder="Nota del set..."
                          value={set.note || ''}
                          onChange={(e) => updateSetNote(exIdx, setIdx, e.target.value)}
                          className="w-full text-[0.7rem] py-1.5 px-3 bg-transparent border-none outline-none"
                          style={{ color: 'var(--text-secondary)' }}
                          autoFocus
                        />
                        {/* 4.8 Tempo input */}
                        <div className="flex items-center gap-2 px-3 pb-1.5">
                          <span className="text-[0.6rem] font-semibold" style={{ color: 'var(--text-muted)' }}>Tempo:</span>
                          <input
                            type="text"
                            placeholder="3-1-2-0"
                            value={set.tempo || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9\-]/g, '');
                              updateSet(exIdx, setIdx, "tempo", val || undefined);
                            }}
                            className="text-[0.7rem] py-0.5 px-2 rounded bg-transparent border-none outline-none w-20 text-center"
                            style={{ color: set.tempo ? 'var(--accent)' : 'var(--text-muted)', background: 'var(--bg-elevated)' }}
                          />
                          <span className="text-[0.5rem]" style={{ color: 'var(--text-muted)' }}>ecc-pausa-con-pausa</span>
                        </div>
                      </div>
                    )}
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
          onClick={() => setShowAddExercise(true)}
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

      {/* ── Rest Timer ── */}
      <RestTimer
        seconds={restSeconds}
        total={restTotal}
        isActive={restActive}
        onAdjust={(delta) => setRestSeconds((s) => Math.max(0, s + delta))}
        onSkip={() => setRestActive(false)}
      />

      {/* ── Add Exercise Modal ── */}
      <AddExerciseModal
        open={showAddExercise}
        onClose={() => { setShowAddExercise(false); setReplaceExerciseIdx(null); }}
        onSelect={replaceExerciseIdx !== null ? replaceExerciseFromLibrary : addExerciseFromLibrary}
        recentExerciseNames={exercises.map((e) => e.name)}
      />

      {/* ── Discard Modal ── */}
      {confirmDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="card mx-6 p-5 text-center" style={{ maxWidth: 320 }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Descartar entrenamiento?</h3>
            <p className="text-[0.78rem] mb-4" style={{ color: "var(--text-muted)" }}>Se va a perder todo el progreso de esta sesion.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDiscard(false)} className="btn btn-ghost flex-1">Cancelar</button>
              <button onClick={() => { clearActiveSession(); clearWorkoutNotification(); router.push("/workout"); }} className="btn btn-danger flex-1">Descartar</button>
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
