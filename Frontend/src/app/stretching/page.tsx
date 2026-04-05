"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Play, Pause, SkipForward, RotateCcw, ChevronRight,
  Clock, CheckCircle2, Flame,
} from "lucide-react";
import { PageTransition } from "@/components/motion";
import { vibrateLight, vibrateHeavy, vibrateTimerComplete } from "@/lib/haptics";
import {
  STRETCH_ROUTINES, STRETCHES, getStretchById,
  type StretchRoutine, type Stretch,
} from "@/data/stretches";

type View = "menu" | "session";

// SVG ring
const RADIUS = 70;
const STROKE = 5;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StretchingPage() {
  const [view, setView] = useState<View>("menu");
  const [activeRoutine, setActiveRoutine] = useState<StretchRoutine | null>(null);
  const [stretchList, setStretchList] = useState<Stretch[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio
  const audioCtx = useRef<AudioContext | null>(null);
  const playBeep = useCallback((freq = 880, dur = 0.15) => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; gain.gain.value = 0.25;
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.stop(ctx.currentTime + dur);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Tick
  useEffect(() => {
    if (!isRunning || completed) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          vibrateHeavy();
          playBeep(1100, 0.2);
          nextStretch();
          return 0;
        }
        if (prev <= 4) playBeep(660, 0.1);
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, completed, currentIdx]);

  function startRoutine(routine: StretchRoutine) {
    const list = routine.stretches
      .map((id) => getStretchById(id))
      .filter(Boolean) as Stretch[];
    setActiveRoutine(routine);
    setStretchList(list);
    setCurrentIdx(0);
    setTimeLeft(list[0]?.durationSec ?? 30);
    setIsRunning(true);
    setCompleted(false);
    setCompletedCount(0);
    setView("session");
    vibrateLight();
  }

  function nextStretch() {
    setCompletedCount((c) => c + 1);
    if (currentIdx + 1 >= stretchList.length) {
      setCompleted(true);
      setIsRunning(false);
      vibrateTimerComplete();
      return;
    }
    const next = currentIdx + 1;
    setCurrentIdx(next);
    setTimeLeft(stretchList[next].durationSec);
  }

  function skipStretch() {
    vibrateLight();
    nextStretch();
  }

  function togglePause() {
    setIsRunning((r) => !r);
    vibrateLight();
  }

  function resetRoutine() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setView("menu");
    setIsRunning(false);
    setCompleted(false);
  }

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ═══════════════════════════════
  // MENU
  // ═══════════════════════════════
  if (view === "menu") {
    return (
      <PageTransition>
        <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/" style={{ color: "var(--accent)" }}><ArrowLeft size={22} /></Link>
            <div>
              <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
                🤸 Stretching & Movilidad
              </h1>
              <p className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                {STRETCHES.length} estiramientos · {STRETCH_ROUTINES.length} rutinas
              </p>
            </div>
          </div>

          {/* Routines */}
          <h2 className="text-[0.8rem] font-bold mb-3">🗂 Rutinas Guiadas</h2>
          <div className="space-y-2 mb-6">
            {STRETCH_ROUTINES.map((r) => (
              <button
                key={r.id}
                onClick={() => startRoutine(r)}
                className="card flex items-center gap-3 px-4 py-3.5 w-full text-left border-none cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-transform"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${r.color}15` }}
                >
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.8rem] font-bold block">{r.name}</span>
                  <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                    {r.description} · {r.durationMin} min · {r.stretches.length} ejercicios
                  </span>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            ))}
          </div>

          {/* All stretches library */}
          <h2 className="text-[0.8rem] font-bold mb-3">📖 Biblioteca ({STRETCHES.length})</h2>
          <div className="space-y-1.5">
            {STRETCHES.map((s) => (
              <div key={s.id} className="card px-4 py-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.75rem] font-bold">{s.name}</span>
                    <span
                      className="text-[0.5rem] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: s.difficulty === "fácil" ? "#30D15820" : s.difficulty === "medio" ? "#FF950020" : "#FF3B3020",
                        color: s.difficulty === "fácil" ? "#30D158" : s.difficulty === "medio" ? "#FF9500" : "#FF3B30",
                      }}
                    >
                      {s.difficulty}
                    </span>
                  </div>
                  <p className="text-[0.6rem] leading-relaxed mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {s.instructions}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                      ⏱ {s.durationSec}s
                    </span>
                    <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                      · {s.muscles.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </PageTransition>
    );
  }

  // ═══════════════════════════════
  // SESSION
  // ═══════════════════════════════
  const current = stretchList[currentIdx];
  const progress = current ? timeLeft / current.durationSec : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const routineColor = activeRoutine?.color || "var(--accent)";

  if (completed) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-black mb-2">¡Rutina completada!</h1>
          <p className="text-[0.85rem] mb-1" style={{ color: "var(--text-muted)" }}>
            {activeRoutine?.name}
          </p>
          <p className="text-[0.75rem] mb-8" style={{ color: "var(--text-muted)" }}>
            {completedCount} estiramientos · ~{activeRoutine?.durationMin} min
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetRoutine}
              className="px-6 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer"
              style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
            >
              Volver
            </button>
            <button
              onClick={() => startRoutine(activeRoutine!)}
              className="px-6 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer"
              style={{ background: routineColor, color: "#fff" }}
            >
              Repetir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: routineColor, opacity: 0.8 }} />
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <button onClick={resetRoutine} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={22} />
        </button>
        <span className="text-[0.7rem] font-bold" style={{ color: "var(--text-muted)" }}>
          {currentIdx + 1} / {stretchList.length}
        </span>
      </div>

      {/* Stretch info */}
      <div className="text-center mb-4">
        <span className="text-4xl block mb-2">{current?.icon}</span>
        <h2 className="text-[1.1rem] font-black">{current?.name}</h2>
        <p className="text-[0.65rem] mt-1 max-w-[300px] mx-auto" style={{ color: "var(--text-muted)" }}>
          {current?.instructions}
        </p>
      </div>

      {/* Timer ring */}
      <div className="relative inline-block mb-4">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
          <circle
            cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS}
            fill="none" stroke={routineColor} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
            transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tabular-nums">{fmt(timeLeft)}</span>
        </div>
      </div>

      {/* Muscles */}
      <div className="flex gap-1.5 flex-wrap justify-center mb-6">
        {current?.muscles.map((m) => (
          <span key={m} className="text-[0.55rem] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${routineColor}15`, color: routineColor }}>
            {m}
          </span>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6 flex-wrap justify-center max-w-[250px]">
        {stretchList.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: i < currentIdx ? routineColor : i === currentIdx ? routineColor : "var(--border)",
              opacity: i === currentIdx ? 1 : i < currentIdx ? 0.5 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={resetRoutine}
          className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ background: "var(--card-bg)" }}
        >
          <RotateCcw size={20} style={{ color: "var(--text-muted)" }} />
        </button>
        <button
          onClick={togglePause}
          className="w-16 h-16 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ background: routineColor, color: "#fff" }}
        >
          {isRunning ? <Pause size={28} /> : <Play size={28} fill="#fff" />}
        </button>
        <button
          onClick={skipStretch}
          className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ background: "var(--card-bg)" }}
        >
          <SkipForward size={20} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Paused overlay */}
      {!isRunning && !completed && (
        <div className="absolute top-12 left-0 right-0 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-[0.75rem] font-bold animate-pulse"
            style={{ background: "rgba(255,149,0,0.15)", color: "#FF9500" }}>
            ⏸ PAUSADO
          </span>
        </div>
      )}
    </div>
  );
}
