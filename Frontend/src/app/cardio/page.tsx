"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Play, Pause, SkipForward, RotateCcw, ChevronRight,
  Clock, Flame, Heart, MapPin, Star, Plus, History,
} from "lucide-react";
import { PageTransition } from "@/components/motion";
import { vibrateLight, vibrateHeavy, vibrateTimerComplete } from "@/lib/haptics";
import {
  CARDIO_TEMPLATES, CARDIO_TYPE_LABELS, INTENSITY_COLORS,
  type CardioTemplate, type CardioType, type CardioSession,
  saveCardioSession, getCardioSessions,
} from "@/data/cardio-templates";

type View = "menu" | "guided" | "free-log" | "history";

const RADIUS = 80;
const STROKE = 5;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CardioPage() {
  const [view, setView] = useState<View>("menu");

  // ── Guided session ──
  const [template, setTemplate] = useState<CardioTemplate | null>(null);
  const [intervalIdx, setIntervalIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Free log ──
  const [freeType, setFreeType] = useState<CardioType>("steady");
  const [freeDuration, setFreeDuration] = useState(30);
  const [freeDistance, setFreeDistance] = useState("");
  const [freeHR, setFreeHR] = useState("");
  const [freeNotes, setFreeNotes] = useState("");
  const [freeRating, setFreeRating] = useState(0);
  const [freeSaved, setFreeSaved] = useState(false);

  // ── History ──
  const [history, setHistory] = useState<CardioSession[]>([]);

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

  useEffect(() => {
    if (view === "history") setHistory(getCardioSessions());
  }, [view]);

  // Tick
  useEffect(() => {
    if (!isRunning || done || !template?.intervals) return;
    intervalRef.current = setInterval(() => {
      setTotalElapsed((e) => e + 1);
      setTimeLeft((prev) => {
        if (prev <= 1) {
          vibrateHeavy();
          playBeep(1100, 0.2);
          // Next interval
          if (intervalIdx + 1 >= template.intervals!.length) {
            finishGuided();
            return 0;
          }
          const next = intervalIdx + 1;
          setIntervalIdx(next);
          return template.intervals![next].durationSec;
        }
        if (prev <= 4) playBeep(660, 0.1);
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, done, intervalIdx, template]);

  function startGuided(t: CardioTemplate) {
    if (!t.intervals?.length) return;
    setTemplate(t);
    setIntervalIdx(0);
    setTimeLeft(t.intervals[0].durationSec);
    setTotalElapsed(0);
    setIsRunning(true);
    setDone(false);
    setView("guided");
    vibrateLight();
  }

  function finishGuided() {
    setDone(true);
    setIsRunning(false);
    vibrateTimerComplete();
    if (template) {
      saveCardioSession({
        id: Date.now().toString(36),
        date: new Date().toISOString().slice(0, 10),
        templateId: template.id,
        templateName: template.name,
        type: template.type,
        durationMin: Math.round(totalElapsed / 60),
      });
    }
  }

  function resetGuided() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setDone(false);
    setView("menu");
  }

  function saveFreeLog() {
    saveCardioSession({
      id: Date.now().toString(36),
      date: new Date().toISOString().slice(0, 10),
      templateName: CARDIO_TYPE_LABELS[freeType],
      type: freeType,
      durationMin: freeDuration,
      distanceKm: freeDistance ? parseFloat(freeDistance) : undefined,
      avgHeartRate: freeHR ? parseInt(freeHR) : undefined,
      notes: freeNotes || undefined,
      rating: freeRating > 0 ? (freeRating as 1 | 2 | 3 | 4 | 5) : undefined,
    });
    setFreeSaved(true);
    vibrateLight();
    setTimeout(() => {
      setFreeSaved(false);
      setView("menu");
      setFreeDistance("");
      setFreeHR("");
      setFreeNotes("");
      setFreeRating(0);
    }, 1200);
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
                <Flame size={18} style={{ color: "#FF3B30" }} /> Cardio
              </h1>
              <p className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                HIIT · Intervalos · Steady State · Sprint
              </p>
            </div>
            <button
              onClick={() => setView("history")}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.7rem] font-bold border-none cursor-pointer"
              style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
            >
              <History size={14} /> Historial
            </button>
          </div>

          {/* Free log button */}
          <button
            onClick={() => setView("free-log")}
            className="w-full card flex items-center gap-3 px-4 py-4 mb-5 border-none cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-transform"
            style={{ borderLeft: "3px solid #30D158" }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#30D158] flex items-center justify-center flex-shrink-0">
              <Plus size={20} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-[0.85rem] font-bold block">Registrar Cardio Libre</span>
              <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                Logueá duración, distancia, FC manualmente
              </span>
            </div>
          </button>

          {/* Guided templates */}
          <h2 className="text-[0.8rem] font-bold mb-3">⚡ Entrenamientos Guiados</h2>
          <div className="space-y-2">
            {CARDIO_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => startGuided(t)}
                className="card flex items-center gap-3 px-4 py-3.5 w-full text-left border-none cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${t.color}15` }}>
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8rem] font-bold">{t.name}</span>
                    <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${t.color}20`, color: t.color }}>
                      {CARDIO_TYPE_LABELS[t.type]}
                    </span>
                  </div>
                  <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                    {t.description} · ~{t.durationMin} min
                  </span>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            ))}
          </div>
        </main>
      </PageTransition>
    );
  }

  // ═══════════════════════════════
  // FREE LOG
  // ═══════════════════════════════
  if (view === "free-log") {
    return (
      <PageTransition>
        <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setView("menu")} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-[1.1rem] font-black tracking-tight">Registrar Cardio</h1>
          </div>

          <div className="card p-4 mb-4">
            {/* Type */}
            <label className="text-[0.7rem] font-bold block mb-2">Tipo</label>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["steady", "hiit", "intervals", "sprint"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFreeType(t)}
                  className="px-3 py-1.5 rounded-lg text-[0.7rem] font-bold border-none cursor-pointer"
                  style={{
                    background: freeType === t ? "var(--accent)" : "var(--card-bg)",
                    color: freeType === t ? "#fff" : "var(--text-main)",
                  }}
                >
                  {CARDIO_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Duration */}
            <label className="text-[0.7rem] font-bold block mb-2">Duración (min)</label>
            <div className="flex items-center gap-3 mb-4">
              {[15, 20, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setFreeDuration(d)}
                  className="px-3 py-1.5 rounded-lg text-[0.7rem] font-bold border-none cursor-pointer"
                  style={{
                    background: freeDuration === d ? "var(--accent)" : "var(--card-bg)",
                    color: freeDuration === d ? "#fff" : "var(--text-main)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Distance */}
            <label className="text-[0.7rem] font-bold block mb-1.5">
              <MapPin size={12} className="inline mr-1" />Distancia (km, opcional)
            </label>
            <input
              type="number"
              value={freeDistance}
              onChange={(e) => setFreeDistance(e.target.value)}
              placeholder="5.0"
              step="0.1"
              className="w-full px-3 py-2 rounded-lg text-[0.8rem] mb-4 border-none"
              style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
            />

            {/* Heart rate */}
            <label className="text-[0.7rem] font-bold block mb-1.5">
              <Heart size={12} className="inline mr-1" />FC promedio (bpm, opcional)
            </label>
            <input
              type="number"
              value={freeHR}
              onChange={(e) => setFreeHR(e.target.value)}
              placeholder="145"
              className="w-full px-3 py-2 rounded-lg text-[0.8rem] mb-4 border-none"
              style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
            />

            {/* Notes */}
            <label className="text-[0.7rem] font-bold block mb-1.5">Notas (opcional)</label>
            <textarea
              value={freeNotes}
              onChange={(e) => setFreeNotes(e.target.value)}
              placeholder="¿Cómo te sentiste?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-[0.8rem] mb-4 border-none resize-none"
              style={{ background: "var(--card-bg)", color: "var(--text-main)" }}
            />

            {/* Rating */}
            <label className="text-[0.7rem] font-bold block mb-1.5">Valoración</label>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setFreeRating(s)}
                  className="bg-transparent border-none cursor-pointer p-0.5"
                >
                  <Star size={24} fill={s <= freeRating ? "#FFD60A" : "transparent"} stroke={s <= freeRating ? "#FFD60A" : "var(--text-muted)"} />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveFreeLog}
            disabled={freeSaved}
            className="w-full py-3.5 rounded-2xl text-[0.9rem] font-black border-none cursor-pointer"
            style={{ background: freeSaved ? "#30D158" : "var(--accent)", color: "#fff" }}
          >
            {freeSaved ? "✅ Guardado" : "Guardar Cardio"}
          </button>
        </main>
      </PageTransition>
    );
  }

  // ═══════════════════════════════
  // HISTORY
  // ═══════════════════════════════
  if (view === "history") {
    return (
      <PageTransition>
        <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setView("menu")} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
              <History size={18} /> Historial Cardio
            </h1>
          </div>

          {history.length === 0 ? (
            <div className="card p-8 text-center">
              <Flame size={32} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
              <p className="text-[0.8rem] font-bold mb-1">Sin sesiones</p>
              <p className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                Completá un cardio para ver el historial
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((s) => (
                <div key={s.id} className="card px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[0.55rem] font-black flex-shrink-0" style={{ background: "#FF3B30" }}>
                    {CARDIO_TYPE_LABELS[s.type].slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.75rem] font-bold block">{s.templateName}</span>
                    <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {s.date} · {s.durationMin} min
                      {s.distanceKm ? ` · ${s.distanceKm} km` : ""}
                      {s.avgHeartRate ? ` · ${s.avgHeartRate} bpm` : ""}
                    </span>
                  </div>
                  {s.rating && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: s.rating }).map((_, i) => (
                        <Star key={i} size={10} fill="#FFD60A" stroke="#FFD60A" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    );
  }

  // ═══════════════════════════════
  // GUIDED SESSION
  // ═══════════════════════════════
  if (!template?.intervals) return null;
  const currentInterval = template.intervals[intervalIdx];
  const progress = currentInterval ? timeLeft / currentInterval.durationSec : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const intensityColor = INTENSITY_COLORS[currentInterval?.intensity || "media"];

  if (done) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-2xl font-black mb-2">¡Cardio Completado!</h1>
          <p className="text-[0.85rem] mb-1" style={{ color: "var(--text-muted)" }}>{template.name}</p>
          <p className="text-[0.75rem] mb-8" style={{ color: "var(--text-muted)" }}>
            {fmt(totalElapsed)} total · {template.intervals.length} intervalos
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={resetGuided} className="px-6 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer" style={{ background: "var(--card-bg)", color: "var(--text-main)" }}>
              Volver
            </button>
            <button onClick={() => startGuided(template)} className="px-6 py-3 rounded-xl text-[0.85rem] font-bold border-none cursor-pointer" style={{ background: template.color, color: "#fff" }}>
              Repetir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: intensityColor, opacity: 0.8 }} />
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <button onClick={resetGuided} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={22} />
        </button>
        <span className="text-[0.7rem] font-bold" style={{ color: "var(--text-muted)" }}>
          {intervalIdx + 1} / {template.intervals.length}
        </span>
      </div>

      <div className="text-center">
        {/* Intensity badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider mb-3" style={{ background: `${intensityColor}20`, color: intensityColor }}>
          {currentInterval.intensity.toUpperCase()}
        </div>

        <h2 className="text-[1rem] font-black mb-6">{currentInterval.label}</h2>

        {/* Ring */}
        <div className="relative inline-block mb-6">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
            <circle
              cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS}
              fill="none" stroke={intensityColor} strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
              transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black tabular-nums">{fmt(timeLeft)}</span>
          </div>
        </div>

        <div className="text-[0.7rem] mb-8" style={{ color: "var(--text-muted)" }}>
          Tiempo total: {fmt(totalElapsed)}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={resetGuided} className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: "var(--card-bg)" }}>
            <RotateCcw size={20} style={{ color: "var(--text-muted)" }} />
          </button>
          <button
            onClick={() => { setIsRunning((r) => !r); vibrateLight(); }}
            className="w-20 h-20 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: intensityColor, color: "#fff" }}
          >
            {isRunning ? <Pause size={32} /> : <Play size={32} fill="#fff" />}
          </button>
          <button
            onClick={() => {
              vibrateLight();
              if (intervalIdx + 1 >= template.intervals!.length) { finishGuided(); return; }
              const next = intervalIdx + 1;
              setIntervalIdx(next);
              setTimeLeft(template.intervals![next].durationSec);
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: "var(--card-bg)" }}
          >
            <SkipForward size={20} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {!isRunning && !done && (
        <div className="absolute top-12 left-0 right-0 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-[0.75rem] font-bold animate-pulse" style={{ background: "rgba(255,149,0,0.15)", color: "#FF9500" }}>
            ⏸ PAUSADO
          </span>
        </div>
      )}
    </div>
  );
}
