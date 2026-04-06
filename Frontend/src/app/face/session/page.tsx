"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  getFaceRoutineById,
  getFaceExerciseById,
  startFaceSession,
  completeFaceSession,
  saveFaceSession,
  type FaceSession,
  type FaceRoutineExercise,
} from "@/lib/face-exercises";
import { getSettings } from "@/lib/storage";
import type { TimeOfDay } from "@/lib/habits";

function SessionContent() {
  const params = useSearchParams();
  const routineId = params.get("routine") || "";
  const timeOfDay = (params.get("time") || null) as TimeOfDay | null;

  const [session, setSession] = useState<FaceSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [repsCount, setRepsCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const routine = getFaceRoutineById(routineId);
  const routineExercises = routine?.exercises.sort((a, b) => a.order - b.order) || [];

  const currentRE = routineExercises[currentIdx] as FaceRoutineExercise | undefined;
  const currentExercise = currentRE ? getFaceExerciseById(currentRE.exerciseId) : undefined;

  // Start session on mount
  useEffect(() => {
    if (!routineId || !routine) return;
    const s = startFaceSession(routineId, timeOfDay);
    setSession(s);
    // Total timer
    totalRef.current = setInterval(() => {
      setTotalElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (totalRef.current) clearInterval(totalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId]);

  // Set up timer for current exercise
  useEffect(() => {
    if (currentRE && currentExercise?.type === "timed") {
      setTimeLeft(currentRE.duration || currentExercise.defaultDuration || 30);
      setIsRunning(false);
    } else if (currentRE && currentExercise?.type === "reps") {
      setRepsCount(0);
      setIsRunning(false);
    }
  }, [currentIdx, currentRE, currentExercise]);

  // Countdown interval
  useEffect(() => {
    if (isRunning && currentExercise?.type === "timed" && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            playBeep();
            doHaptic();
            return 0;
          }
          if (prev <= 4) playTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);

  function getAudioCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  function playBeep() {
    if (!soundEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  function playTick() {
    if (!soundEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  function doHaptic() {
    const settings = getSettings();
    if (settings.hapticsEnabled && navigator.vibrate) navigator.vibrate(200);
  }

  function handleNext() {
    if (!session) return;
    // Mark current exercise completed
    const updated = { ...session };
    if (updated.exercises[currentIdx]) {
      updated.exercises[currentIdx].completed = true;
      if (currentExercise?.type === "timed") {
        updated.exercises[currentIdx].actualDuration = (currentRE?.duration || 0) - timeLeft;
      } else if (currentExercise?.type === "reps") {
        updated.exercises[currentIdx].actualReps = repsCount;
      }
    }
    saveFaceSession(updated);
    setSession(updated);

    if (currentIdx < routineExercises.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Finish
      completeFaceSession(session.id, totalElapsed);
      setFinished(true);
      if (totalRef.current) clearInterval(totalRef.current);
      playBeep();
      doHaptic();
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = routineExercises.length > 0
    ? ((currentIdx + (finished ? 1 : 0)) / routineExercises.length) * 100
    : 0;

  if (!routine) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--text-muted)]">{t("face.routineNotFound")}</p>
            <Link href="/face" className="text-[var(--accent)] mt-2 inline-block">{t("common.back")}</Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (finished) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <CheckCircle2 size={64} className="text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">{t("face.sessionComplete")}</h2>
            <p className="text-[var(--text-muted)]">
              {routine.name} · {formatTime(totalElapsed)}
            </p>
            <Link
              href="/face"
              className="inline-block px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
            >
              {t("common.back")}
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
        {/* Top bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/face" className="p-2 -ml-2 rounded-xl hover:bg-[var(--bg-elevated)]">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm text-[var(--text-muted)]">
            {currentIdx + 1}/{routineExercises.length} · {formatTime(totalElapsed)}
          </span>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-xl">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} className="text-[var(--text-muted)]" />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--bg-elevated)] mx-4 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Exercise content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          {currentExercise && (
            <>
              <h2 className="text-2xl font-bold text-center">{currentExercise.name}</h2>
              <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
                {currentExercise.description}
              </p>

              {/* Timer ring (timed exercises) */}
              {currentExercise.type === "timed" && (
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeDasharray={`${((currentRE?.duration || 30) - timeLeft) / (currentRE?.duration || 30) * 97.5} 97.5`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold font-mono">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Reps counter */}
              {currentExercise.type === "reps" && (
                <div className="text-center space-y-4">
                  <p className="text-6xl font-bold font-mono">{repsCount}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    / {currentRE?.reps || currentExercise.defaultReps || 0} {t("face.reps")}
                  </p>
                  <button
                    onClick={() => { setRepsCount(prev => prev + 1); doHaptic(); }}
                    className="px-8 py-4 rounded-2xl bg-[var(--accent)] text-white text-lg font-bold active:scale-95 transition-transform"
                  >
                    +1
                  </button>
                </div>
              )}

              {/* Check type */}
              {currentExercise.type === "check" && (
                <div className="text-center">
                  <CheckCircle2 size={80} className="text-[var(--text-muted)] mx-auto" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          {currentExercise?.type === "timed" && (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setTimeLeft(currentRE?.duration || currentExercise.defaultDuration || 30);
                  setIsRunning(false);
                }}
                className="p-3 rounded-xl bg-[var(--bg-elevated)]"
              >
                <RotateCcw size={24} />
              </button>
              <button
                onClick={() => { setIsRunning(!isRunning); if (!isRunning) doHaptic(); }}
                className="p-4 rounded-2xl bg-[var(--accent)] text-white"
              >
                {isRunning ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button onClick={handleNext} className="p-3 rounded-xl bg-[var(--bg-elevated)]">
                <SkipForward size={24} />
              </button>
            </div>
          )}

          {(currentExercise?.type === "reps" || currentExercise?.type === "check") && (
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-semibold text-lg"
            >
              {currentIdx < routineExercises.length - 1 ? t("common.next") : t("face.finish")}
            </button>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default function FaceSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
      <SessionContent />
    </Suspense>
  );
}
