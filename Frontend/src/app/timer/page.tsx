"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Play, Pause, RotateCcw, Timer, ChevronRight, Zap, Clock, Target,
  Settings2, History, Minus, Plus,
} from "lucide-react";
import { PageTransition } from "@/components/motion";
import { vibrateHeavy, vibrateLight, vibrateTimerComplete } from "@/lib/haptics";
import {
  TIMER_PRESETS, MODE_LABELS, MODE_COLORS, MODE_DESCRIPTIONS,
  type TimerMode, type TimerPreset,
  saveTimerSession, getTimerHistory, type TimerSession,
} from "@/lib/timer-presets";

// ── SVG ring constants ──
const RADIUS = 90;
const STROKE = 6;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Phase = "work" | "rest" | "idle" | "done";

export default function TimerPage() {
  // ── View state ──
  const [view, setView] = useState<"menu" | "config" | "active" | "history">("menu");
  const [selectedMode, setSelectedMode] = useState<TimerMode>("tabata");

  // ── Config state ──
  const [workSec, setWorkSec] = useState(20);
  const [restSec, setRestSec] = useState(10);
  const [rounds, setRounds] = useState(8);

  // ── Active timer state ──
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [amrapRounds, setAmrapRounds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const presetNameRef = useRef("");

  // ── History ──
  const [history, setHistory] = useState<TimerSession[]>([]);

  // ── Audio beep ──
  const audioCtx = useRef<AudioContext | null>(null);
  const playBeep = useCallback((freq = 880, dur = 0.15) => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.stop(ctx.currentTime + dur);
    } catch { /* ignore audio errors */ }
  }, []);

  const playCountdown = useCallback(() => playBeep(660, 0.1), [playBeep]);
  const playPhaseChange = useCallback(() => playBeep(1100, 0.2), [playBeep]);

  // ── Cleanup interval on unmount ──
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // ── Load history when tab opens ──
  useEffect(() => {
    if (view === "history") setHistory(getTimerHistory());
  }, [view]);

  // ── Select preset ──
  function selectPreset(preset: TimerPreset) {
    setSelectedMode(preset.mode);
    setWorkSec(preset.workSec);
    setRestSec(preset.restSec);
    setRounds(preset.rounds);
    presetNameRef.current = preset.name;
    setView("config");
  }

  function selectMode(mode: TimerMode) {
    setSelectedMode(mode);
    switch (mode) {
      case "tabata": setWorkSec(20); setRestSec(10); setRounds(8); break;
      case "emom": setWorkSec(60); setRestSec(0); setRounds(10); break;
      case "amrap": setWorkSec(600); setRestSec(0); setRounds(1); break;
      case "custom": setWorkSec(40); setRestSec(20); setRounds(6); break;
    }
    presetNameRef.current = MODE_LABELS[mode];
    setView("config");
  }

  // ── Start timer ──
  function startTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("work");
    setCurrentRound(1);
    setTimeLeft(workSec);
    setTotalElapsed(0);
    setIsPaused(false);
    setAmrapRounds(0);
    startTimeRef.current = Date.now();
    setView("active");
    vibrateLight();
  }

  // ── Tick logic ──
  useEffect(() => {
    if (phase === "idle" || phase === "done" || isPaused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      setTotalElapsed((e) => e + 1);
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up for current segment
          if (selectedMode === "amrap") {
            finishTimer();
            return 0;
          }
          if (phase === "work") {
            if (restSec > 0) {
              playPhaseChange();
              vibrateHeavy();
              setPhase("rest");
              return restSec;
            } else {
              // No rest phase (EMOM) — next round
              if (currentRound >= rounds) {
                finishTimer();
                return 0;
              }
              playPhaseChange();
              vibrateHeavy();
              setCurrentRound((r) => r + 1);
              return workSec;
            }
          }
          if (phase === "rest") {
            if (currentRound >= rounds) {
              finishTimer();
              return 0;
            }
            playPhaseChange();
            vibrateHeavy();
            setCurrentRound((r) => r + 1);
            setPhase("work");
            return workSec;
          }
          return 0;
        }
        // Countdown beeps at 3, 2, 1
        if (prev <= 4) playCountdown();
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isPaused, selectedMode, workSec, restSec, rounds, currentRound]);

  function finishTimer() {
    setPhase("done");
    vibrateTimerComplete();
    playBeep(1320, 0.4);
    // Save session
    saveTimerSession({
      id: Date.now().toString(36),
      date: new Date().toISOString().slice(0, 10),
      mode: selectedMode,
      presetName: presetNameRef.current || MODE_LABELS[selectedMode],
      totalSec: totalElapsed,
      roundsCompleted: selectedMode === "amrap" ? amrapRounds : currentRound,
      roundsTotal: rounds,
    });
  }

  function togglePause() {
    setIsPaused((p) => !p);
    vibrateLight();
  }

  function resetTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("idle");
    setTimeLeft(0);
    setCurrentRound(1);
    setTotalElapsed(0);
    setIsPaused(false);
    setAmrapRounds(0);
    setView("config");
  }

  // ── Format time ──
  function fmt(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // ── Progress for ring ──
  const totalPhaseTime = phase === "work" ? workSec : restSec;
  const progress = totalPhaseTime > 0 ? timeLeft / totalPhaseTime : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  const modeColor = MODE_COLORS[selectedMode];
  const phaseColor = phase === "rest" ? "#30D158" : modeColor;

  // ── Stepper helper ──
  function Stepper({ value, onChange, min, max, step, label, formatVal }: {
    value: number; onChange: (v: number) => void; min: number; max: number;
    step: number; label: string; formatVal?: (v: number) => string;
  }) {
    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-[0.8rem] font-semibold">{label}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { vibrateLight(); onChange(Math.max(min, value - step)); }}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
          >
            <Minus size={16} />
          </button>
          <span className="text-[1rem] font-black tabular-nums w-16 text-center">
            {formatVal ? formatVal(value) : value}
          </span>
          <button
            onClick={() => { vibrateLight(); onChange(Math.min(max, value + step)); }}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════
  // ── MENU VIEW ──
  // ═══════════════════════════════════
  if (view === "menu") {
    const modes: { mode: TimerMode; icon: typeof Timer }[] = [
      { mode: "tabata", icon: Zap },
      { mode: "emom", icon: Clock },
      { mode: "amrap", icon: Target },
      { mode: "custom", icon: Settings2 },
    ];

    return (
      <PageTransition>
        <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/" style={{ color: "var(--accent)" }}><ArrowLeft size={22} /></Link>
            <div>
              <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
                <Timer size={18} style={{ color: modeColor }} /> Timer
              </h1>
              <p className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>EMOM · Tabata · AMRAP · Custom</p>
            </div>
            <button
              onClick={() => setView("history")}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.7rem] font-bold border-none cursor-pointer"
              style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
            >
              <History size={14} /> Historial
            </button>
          </div>

          {/* Mode selector cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {modes.map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => selectMode(mode)}
                className="card p-4 text-left border-none cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-transform"
                style={{ borderLeft: `3px solid ${MODE_COLORS[mode]}` }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={16} style={{ color: MODE_COLORS[mode] }} />
                  <span className="text-[0.85rem] font-bold">{MODE_LABELS[mode]}</span>
                </div>
                <p className="text-[0.6rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {MODE_DESCRIPTIONS[mode]}
                </p>
              </button>
            ))}
          </div>

          {/* Quick presets */}
          <h2 className="text-[0.8rem] font-bold mb-3">⚡ Presets Rápidos</h2>
          <div className="space-y-2">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className="card flex items-center gap-3 px-4 py-3 w-full text-left border-none cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-transform"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[0.65rem] font-black flex-shrink-0"
                  style={{ background: MODE_COLORS[preset.mode] }}
                >
                  {MODE_LABELS[preset.mode].slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.8rem] font-bold block">{preset.name}</span>
                  <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{preset.description}</span>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            ))}
          </div>
        </main>
      </PageTransition>
    );
  }

  // ═══════════════════════════════════
  // ── CONFIG VIEW ──
  // ═══════════════════════════════════
  if (view === "config") {
    const totalTime = selectedMode === "amrap"
      ? workSec
      : (workSec + restSec) * rounds;

    return (
      <PageTransition>
        <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setView("menu")} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
                <Settings2 size={18} style={{ color: modeColor }} />
                {MODE_LABELS[selectedMode]}
              </h1>
              <p className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>Configurá tu timer</p>
            </div>
          </div>

          <div className="card p-4 mb-4">
            {selectedMode !== "amrap" && (
              <Stepper
                label="⏱ Trabajo"
                value={workSec}
                onChange={setWorkSec}
                min={5}
                max={300}
                step={5}
                formatVal={(v) => `${v}s`}
              />
            )}
            {selectedMode === "amrap" && (
              <Stepper
                label="⏱ Tiempo total"
                value={workSec}
                onChange={setWorkSec}
                min={60}
                max={3600}
                step={60}
                formatVal={(v) => fmt(v)}
              />
            )}
            {(selectedMode === "tabata" || selectedMode === "custom") && (
              <Stepper
                label="😮‍💨 Descanso"
                value={restSec}
                onChange={setRestSec}
                min={0}
                max={120}
                step={5}
                formatVal={(v) => `${v}s`}
              />
            )}
            {selectedMode !== "amrap" && (
              <Stepper
                label="🔄 Rondas"
                value={rounds}
                onChange={setRounds}
                min={1}
                max={50}
                step={1}
              />
            )}
          </div>

          {/* Summary */}
          <div className="card p-4 mb-6 text-center" style={{ borderTop: `3px solid ${modeColor}` }}>
            <div className="text-[0.6rem] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Tiempo total
            </div>
            <div className="text-3xl font-black tabular-nums" style={{ color: modeColor }}>
              {fmt(totalTime)}
            </div>
            {selectedMode !== "amrap" && (
              <div className="text-[0.65rem] mt-1" style={{ color: "var(--text-muted)" }}>
                {rounds} rondas · {workSec}s trabajo {restSec > 0 ? `· ${restSec}s descanso` : ""}
              </div>
            )}
          </div>

          <button
            onClick={startTimer}
            className="w-full py-4 rounded-2xl text-[1rem] font-black border-none cursor-pointer flex items-center justify-center gap-2"
            style={{ background: modeColor, color: "#fff" }}
          >
            <Play size={20} fill="#fff" /> INICIAR
          </button>
        </main>
      </PageTransition>
    );
  }

  // ═══════════════════════════════════
  // ── HISTORY VIEW ──
  // ═══════════════════════════════════
  if (view === "history") {
    return (
      <PageTransition>
        <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setView("menu")} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
              <History size={18} /> Historial Timer
            </h1>
          </div>

          {history.length === 0 ? (
            <div className="card p-8 text-center">
              <Timer size={32} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
              <p className="text-[0.8rem] font-bold mb-1">Sin sesiones</p>
              <p className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                Completá un timer para ver tu historial acá
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((s) => (
                <div key={s.id} className="card flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[0.6rem] font-black flex-shrink-0"
                    style={{ background: MODE_COLORS[s.mode] }}
                  >
                    {MODE_LABELS[s.mode].slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.75rem] font-bold block">{s.presetName}</span>
                    <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {s.date} · {fmt(s.totalSec)} · {s.roundsCompleted}/{s.roundsTotal} rondas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    );
  }

  // ═══════════════════════════════════
  // ── ACTIVE TIMER VIEW ──
  // ═══════════════════════════════════
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      {/* Phase indicator */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: phaseColor, opacity: 0.8 }} />

      <div className="text-center">
        {/* Mode badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider mb-4"
          style={{ background: `${modeColor}20`, color: modeColor }}
        >
          {MODE_LABELS[selectedMode]}
        </div>

        {/* Round counter */}
        {selectedMode !== "amrap" && (
          <div className="text-[0.8rem] font-bold mb-6" style={{ color: "var(--text-muted)" }}>
            Ronda {currentRound} / {rounds}
          </div>
        )}

        {/* AMRAP round counter */}
        {selectedMode === "amrap" && phase !== "done" && (
          <div className="mb-6">
            <div className="text-[0.7rem] mb-2" style={{ color: "var(--text-muted)" }}>Rondas completadas</div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => { vibrateLight(); setAmrapRounds(Math.max(0, amrapRounds - 1)); }}
                className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: "var(--card-bg)" }}
              >
                <Minus size={18} />
              </button>
              <span className="text-4xl font-black tabular-nums" style={{ color: modeColor }}>{amrapRounds}</span>
              <button
                onClick={() => { vibrateLight(); setAmrapRounds(amrapRounds + 1); }}
                className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: "var(--card-bg)" }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        )}

        {/* SVG Ring Timer */}
        {phase !== "done" ? (
          <div className="relative inline-block mb-6">
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <circle
                cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS}
                fill="none" stroke="var(--border)" strokeWidth={STROKE}
              />
              <circle
                cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS}
                fill="none" stroke={phaseColor} strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
                transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tabular-nums tracking-tight">{fmt(timeLeft)}</span>
              <span
                className="text-[0.7rem] font-bold uppercase tracking-wider mt-1"
                style={{ color: phaseColor }}
              >
                {phase === "work" ? "TRABAJO" : "DESCANSO"}
              </span>
            </div>
          </div>
        ) : (
          /* Done view */
          <div className="mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-2xl font-black mb-2">¡Completado!</div>
            <div className="text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
              {fmt(totalElapsed)} total
              {selectedMode === "amrap" && ` · ${amrapRounds} rondas`}
              {selectedMode !== "amrap" && ` · ${rounds} rondas`}
            </div>
          </div>
        )}

        {/* Elapsed */}
        {phase !== "done" && (
          <div className="text-[0.7rem] mb-8" style={{ color: "var(--text-muted)" }}>
            Tiempo total: {fmt(totalElapsed)}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {phase !== "done" ? (
            <>
              <button
                onClick={resetTimer}
                className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: "var(--card-bg)" }}
              >
                <RotateCcw size={22} style={{ color: "var(--text-muted)" }} />
              </button>
              <button
                onClick={togglePause}
                className="w-20 h-20 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: phaseColor, color: "#fff" }}
              >
                {isPaused ? <Play size={32} fill="#fff" /> : <Pause size={32} />}
              </button>
              <div className="w-14" /> {/* spacer */}
            </>
          ) : (
            <>
              <button
                onClick={resetTimer}
                className="px-6 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer"
                style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
              >
                Volver
              </button>
              <button
                onClick={startTimer}
                className="px-6 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer"
                style={{ background: modeColor, color: "#fff" }}
              >
                Repetir
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && phase !== "done" && (
        <div className="absolute top-8 left-0 right-0 text-center">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[0.75rem] font-bold animate-pulse"
            style={{ background: "rgba(255,149,0,0.15)", color: "#FF9500" }}
          >
            ⏸ PAUSADO
          </span>
        </div>
      )}
    </div>
  );
}
