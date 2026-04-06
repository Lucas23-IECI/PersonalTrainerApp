"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle,
  Zap,
  Shield,
  Target,
  GripVertical,
  Repeat,
} from "lucide-react";
import { PHASES, getCurrentPhase, getPhaseProgress, getPhaseWeek, getPhaseTotalWeeks, isDeloadWeek, type Phase } from "@/data/phases";
import { calculateFatigue, FATIGUE_COLORS, FATIGUE_LABELS, getFatigueHistory, type FatigueScore } from "@/lib/deload";
import { getWeeklyMuscleData } from "@/lib/storage";
import { getAllVolumeLandmarks, getVolumeZone, ZONE_COLORS, ZONE_LABELS, type VolumeZone } from "@/data/volume-landmarks";
import { MUSCLE_LABELS, type MuscleGroup } from "@/data/exercises";
import { getWeeklyPlan } from "@/data/workouts";
import { PageTransition, StaggerList, StaggerItem } from "@/components/motion";
import { AnimatePresence, motion } from "framer-motion";
import WeeklyPlannerDnD from "@/components/planning/WeeklyPlannerDnD";
import DUPPanel from "@/components/planning/DUPPanel";

const PHASE_TYPE_COLORS: Record<Phase["type"], string> = {
  reactivation: "#0A84FF",
  accumulation: "#34C759",
  intensification: "#FF9500",
  deload: "#5E5CE6",
  peaking: "#FF375F",
};

const PHASE_TYPE_LABELS: Record<Phase["type"], string> = {
  reactivation: "Reactivación",
  accumulation: "Acumulación",
  intensification: "Intensificación",
  deload: "Deload",
  peaking: "Peaking",
};

type Tab = "timeline" | "fatigue" | "volume" | "planner" | "dup";

export default function PlanningPage() {
  const [currentPhase, setCurrentPhase] = useState<Phase>(PHASES[0]);
  const [fatigue, setFatigue] = useState<FatigueScore | null>(null);
  const [tab, setTab] = useState<Tab>("timeline");

  useEffect(() => {
    setCurrentPhase(getCurrentPhase());
    setFatigue(calculateFatigue());
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: "timeline", label: "Meso", icon: Calendar },
    { id: "fatigue", label: "Fatiga", icon: Activity },
    { id: "volume", label: "Vol.", icon: Target },
    { id: "planner", label: "Planner", icon: GripVertical },
    { id: "dup", label: "DUP", icon: Repeat },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 pt-3 pb-2" style={{ background: "var(--bg)" }}>
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="p-1.5 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
              <ChevronLeft size={18} style={{ color: "var(--text)" }} />
            </Link>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Planificación</h1>
              <p className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                Mesociclo • Fatiga • Volumen • Planner • DUP
              </p>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[0.65rem] font-bold py-2 rounded-md cursor-pointer border-none transition-all"
                style={{
                  background: tab === t.id ? "var(--bg-card)" : "transparent",
                  color: tab === t.id ? "var(--text)" : "var(--text-muted)",
                }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-2">
          <AnimatePresence mode="wait">
            {tab === "timeline" && (
              <motion.div key="timeline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <MesocycleTimeline currentPhase={currentPhase} />
              </motion.div>
            )}
            {tab === "fatigue" && (
              <motion.div key="fatigue" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <FatiguePanel fatigue={fatigue} />
              </motion.div>
            )}
            {tab === "volume" && (
              <motion.div key="volume" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <VolumeLandmarksPanel currentPhase={currentPhase} />
              </motion.div>
            )}
            {tab === "planner" && (
              <motion.div key="planner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <WeeklyPlannerDnD plan={getWeeklyPlan()} />
              </motion.div>
            )}
            {tab === "dup" && (
              <motion.div key="dup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <DUPPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}

// ═══════════════════════════════════════════
// 5.1 — Mesocycle Timeline
// ═══════════════════════════════════════════

function MesocycleTimeline({ currentPhase }: { currentPhase: Phase }) {
  const progress = getPhaseProgress(currentPhase);
  const week = getPhaseWeek(currentPhase);
  const totalWeeks = getPhaseTotalWeeks(currentPhase);
  const deloadActive = isDeloadWeek(currentPhase);

  // Calculate total span for relative widths
  const totalSpan = useMemo(() => {
    const first = new Date(PHASES[0].startDate).getTime();
    const last = new Date(PHASES[PHASES.length - 1].endDate).getTime();
    return last - first;
  }, []);

  return (
    <StaggerList>
      {/* Current phase summary card */}
      <StaggerItem>
        <div className="card mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: PHASE_TYPE_COLORS[currentPhase.type] }} />
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{currentPhase.name}</span>
            </div>
            <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-bold"
              style={{ background: PHASE_TYPE_COLORS[currentPhase.type] + "20", color: PHASE_TYPE_COLORS[currentPhase.type] }}>
              {PHASE_TYPE_LABELS[currentPhase.type]}
            </span>
          </div>
          <p className="text-[0.7rem] mb-3" style={{ color: "var(--text-secondary)" }}>{currentPhase.description}</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <MiniStat label="Semana" value={`${week}/${totalWeeks}`} />
            <MiniStat label="RPE" value={`${currentPhase.rpeRange[0]}-${currentPhase.rpeRange[1]}`} />
            <MiniStat label="Reps" value={currentPhase.repRangeCompound} />
            <MiniStat label="Volumen" value={currentPhase.volumeLevel === "high" ? "Alto" : currentPhase.volumeLevel === "medium" ? "Medio" : "Bajo"} />
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: PHASE_TYPE_COLORS[currentPhase.type] }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
              {formatDate(currentPhase.startDate)}
            </span>
            <span className="text-[0.55rem] font-bold" style={{ color: PHASE_TYPE_COLORS[currentPhase.type] }}>
              {progress}%
            </span>
            <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
              {formatDate(currentPhase.endDate)}
            </span>
          </div>
          {deloadActive && (
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[0.65rem] font-bold"
              style={{ background: "#5E5CE620", color: "#5E5CE6" }}>
              <Shield size={12} />
              Semana de Deload activa
            </div>
          )}
        </div>
      </StaggerItem>

      {/* Horizontal block timeline */}
      <StaggerItem>
        <div className="card mb-3">
          <div className="text-[0.6rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
            Timeline del Mesociclo
          </div>
          <div className="flex gap-0.5 h-10 rounded-lg overflow-hidden mb-2">
            {PHASES.map((phase) => {
              const start = new Date(phase.startDate).getTime();
              const end = new Date(phase.endDate).getTime();
              const width = ((end - start) / totalSpan) * 100;
              const isCurrent = phase.id === currentPhase.id;
              return (
                <div
                  key={phase.id}
                  className="relative flex items-center justify-center transition-all"
                  style={{
                    width: `${width}%`,
                    background: PHASE_TYPE_COLORS[phase.type] + (isCurrent ? "" : "40"),
                    borderRadius: 4,
                    border: isCurrent ? `2px solid ${PHASE_TYPE_COLORS[phase.type]}` : "none",
                    boxShadow: isCurrent ? `0 0 8px ${PHASE_TYPE_COLORS[phase.type]}40` : "none",
                  }}
                >
                  {width > 8 && (
                    <span className="text-[0.45rem] font-bold text-white truncate px-0.5">
                      {phase.id}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {(["accumulation", "intensification", "deload", "peaking", "reactivation"] as const).map((type) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: PHASE_TYPE_COLORS[type] }} />
                <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                  {PHASE_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </StaggerItem>

      {/* All phases detailed list */}
      <StaggerItem>
        <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
          Todas las Fases
        </div>
      </StaggerItem>
      {PHASES.map((phase) => {
        const isCurrent = phase.id === currentPhase.id;
        const isPast = new Date(phase.endDate) < new Date();
        const totalW = getPhaseTotalWeeks(phase);
        return (
          <StaggerItem key={phase.id}>
            <div
              className="card mb-2 transition-all"
              style={{
                opacity: isPast && !isCurrent ? 0.5 : 1,
                borderLeft: isCurrent ? `3px solid ${PHASE_TYPE_COLORS[phase.type]}` : "none",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-[0.7rem] font-bold w-5 h-5 flex items-center justify-center rounded"
                    style={{ background: PHASE_TYPE_COLORS[phase.type] + "20", color: PHASE_TYPE_COLORS[phase.type] }}>
                    {phase.id}
                  </div>
                  <div>
                    <div className="text-[0.75rem] font-bold" style={{ color: "var(--text)" }}>{phase.name}</div>
                    <div className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                      {formatDate(phase.startDate)} — {formatDate(phase.endDate)} • {totalW} sem
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {phase.deloadWeek && (
                    <span className="text-[0.5rem] px-1.5 py-0.5 rounded" style={{ background: "#5E5CE615", color: "#5E5CE6" }}>
                      DL sem {phase.deloadWeek}
                    </span>
                  )}
                  {isPast && !isCurrent && (
                    <span className="text-[0.5rem] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                      ✓
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[0.5rem] px-1.5 py-0.5 rounded font-bold" style={{ background: PHASE_TYPE_COLORS[phase.type] + "20", color: PHASE_TYPE_COLORS[phase.type] }}>
                      ACTUAL
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="text-[0.55rem]" style={{ color: "var(--text-secondary)" }}>RPE {phase.rpeRange[0]}-{phase.rpeRange[1]}</span>
                <span className="text-[0.55rem]" style={{ color: "var(--text-secondary)" }}>Reps {phase.repRangeCompound}</span>
                <span className="text-[0.55rem]" style={{ color: "var(--text-secondary)" }}>Vol: {phase.volumeLevel}</span>
                <span className="text-[0.55rem]" style={{ color: "var(--text-secondary)" }}>Split: {phase.splitType.replace("_", "/")}</span>
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}

// ═══════════════════════════════════════════
// 5.2 — Fatigue Panel
// ═══════════════════════════════════════════

function FatiguePanel({ fatigue }: { fatigue: FatigueScore | null }) {
  const history = useMemo(() => getFatigueHistory().slice(-14), []);

  if (!fatigue) return null;

  const gaugeAngle = (fatigue.overall / 100) * 180; // semicircle

  return (
    <StaggerList>
      {/* Main gauge */}
      <StaggerItem>
        <div className="card mb-3 text-center">
          <div className="text-[0.6rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
            Índice de Fatiga Acumulada
          </div>
          {/* Semicircle gauge */}
          <div className="relative mx-auto" style={{ width: 180, height: 100 }}>
            <svg viewBox="0 0 180 100" style={{ width: "100%", height: "100%" }}>
              {/* Background arc */}
              <path
                d="M 10 90 A 80 80 0 0 1 170 90"
                fill="none"
                stroke="var(--bg-elevated)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Filled arc */}
              <path
                d="M 10 90 A 80 80 0 0 1 170 90"
                fill="none"
                stroke={FATIGUE_COLORS[fatigue.level]}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(gaugeAngle / 180) * 251.3} 251.3`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <span className="text-2xl font-black" style={{ color: FATIGUE_COLORS[fatigue.level] }}>
                {fatigue.overall}
              </span>
              <span className="text-[0.6rem] font-bold" style={{ color: FATIGUE_COLORS[fatigue.level] }}>
                {FATIGUE_LABELS[fatigue.level]}
              </span>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Breakdown */}
      <StaggerItem>
        <div className="card mb-3">
          <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Componentes
          </div>
          <FatigueBar label="RPE Promedio" value={fatigue.rpeComponent} max={40} color="#FF9500" />
          <FatigueBar label="Volumen vs MRV" value={fatigue.volumeComponent} max={40} color="#FF453A" />
          <FatigueBar label="Frecuencia" value={fatigue.frequencyComponent} max={20} color="#5E5CE6" />
        </div>
      </StaggerItem>

      {/* Recommendation */}
      <StaggerItem>
        <div className="card mb-3 flex items-start gap-2" style={{
          borderLeft: `3px solid ${FATIGUE_COLORS[fatigue.level]}`,
        }}>
          {fatigue.level === "critical" || fatigue.level === "high"
            ? <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: FATIGUE_COLORS[fatigue.level] }} />
            : <Zap size={16} className="mt-0.5 shrink-0" style={{ color: FATIGUE_COLORS[fatigue.level] }} />
          }
          <div>
            <div className="text-[0.7rem] font-bold mb-0.5" style={{ color: "var(--text)" }}>Recomendación</div>
            <p className="text-[0.65rem]" style={{ color: "var(--text-secondary)" }}>{fatigue.recommendation}</p>
          </div>
        </div>
      </StaggerItem>

      {/* Over MRV muscles */}
      {fatigue.musclesOverMrv.length > 0 && (
        <StaggerItem>
          <div className="card mb-3">
            <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "#FF453A" }}>
              Músculos sobre MRV
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fatigue.musclesOverMrv.map((m) => (
                <span key={m} className="text-[0.6rem] px-2 py-1 rounded-lg font-bold"
                  style={{ background: "#FF453A20", color: "#FF453A" }}>
                  {MUSCLE_LABELS[m as MuscleGroup] || m}
                </span>
              ))}
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Mini history chart */}
      {history.length > 1 && (
        <StaggerItem>
          <div className="card mb-3">
            <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
              Historial de Fatiga (últimos 14 días)
            </div>
            <div className="flex items-end gap-1" style={{ height: 60 }}>
              {history.map((h, i) => {
                const height = Math.max(4, (h.score / 100) * 56);
                const color = h.score <= 15 ? "#34C759" : h.score <= 35 ? "#0A84FF" : h.score <= 55 ? "#FFD60A" : h.score <= 75 ? "#FF9500" : "#FF453A";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-t" style={{ height, background: color, minWidth: 4 }} />
                    <span className="text-[0.4rem]" style={{ color: "var(--text-muted)" }}>
                      {h.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </StaggerItem>
      )}
    </StaggerList>
  );
}

function FatigueBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[0.6rem]" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-[0.6rem] font-bold" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 5.3 — Volume Landmarks Panel
// ═══════════════════════════════════════════

function VolumeLandmarksPanel({ currentPhase }: { currentPhase: Phase }) {
  const data = useMemo(() => {
    const landmarks = getAllVolumeLandmarks(currentPhase);
    const weeklyData = getWeeklyMuscleData();

    return (Object.keys(landmarks) as MuscleGroup[]).map((muscle) => {
      const lm = landmarks[muscle];
      const current = weeklyData[muscle]?.sets ?? 0;
      const zone = getVolumeZone(current, lm);
      return { muscle, label: MUSCLE_LABELS[muscle], current, ...lm, zone };
    }).sort((a, b) => {
      // Sort: over_mrv first, then approaching, then by current sets desc
      const zoneOrder: Record<VolumeZone, number> = { over_mrv: 0, approaching_mrv: 1, productive: 2, below_mev: 3 };
      if (zoneOrder[a.zone] !== zoneOrder[b.zone]) return zoneOrder[a.zone] - zoneOrder[b.zone];
      return b.current - a.current;
    });
  }, [currentPhase]);

  const zoneCounts = useMemo(() => {
    const counts: Record<VolumeZone, number> = { below_mev: 0, productive: 0, approaching_mrv: 0, over_mrv: 0 };
    data.forEach((d) => { if (d.current > 0) counts[d.zone]++; });
    return counts;
  }, [data]);

  return (
    <StaggerList>
      {/* Summary */}
      <StaggerItem>
        <div className="card mb-3">
          <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Resumen Semanal — {PHASE_TYPE_LABELS[currentPhase.type]}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <ZoneBadge zone="below_mev" count={zoneCounts.below_mev} />
            <ZoneBadge zone="productive" count={zoneCounts.productive} />
            <ZoneBadge zone="approaching_mrv" count={zoneCounts.approaching_mrv} />
            <ZoneBadge zone="over_mrv" count={zoneCounts.over_mrv} />
          </div>
        </div>
      </StaggerItem>

      {/* Legend */}
      <StaggerItem>
        <div className="card mb-3">
          <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Landmarks
          </div>
          <div className="grid grid-cols-3 gap-2 text-[0.55rem]" style={{ color: "var(--text-secondary)" }}>
            <div><span className="font-bold" style={{ color: "#FFD60A" }}>MEV</span> = Vol. Mínimo Efectivo</div>
            <div><span className="font-bold" style={{ color: "#34C759" }}>MAV</span> = Vol. Máx. Adaptativo</div>
            <div><span className="font-bold" style={{ color: "#FF453A" }}>MRV</span> = Vol. Máx. Recuperable</div>
          </div>
        </div>
      </StaggerItem>

      {/* Per-muscle bars */}
      <StaggerItem>
        <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
          Volumen por Músculo (sets/semana)
        </div>
      </StaggerItem>
      {data.map((d) => (
        <StaggerItem key={d.muscle}>
          <div className="card mb-1.5 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.65rem] font-bold" style={{ color: "var(--text)" }}>{d.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] font-bold" style={{ color: ZONE_COLORS[d.zone] }}>
                  {d.current} sets
                </span>
                <span className="text-[0.5rem] px-1.5 py-0.5 rounded"
                  style={{ background: ZONE_COLORS[d.zone] + "20", color: ZONE_COLORS[d.zone] }}>
                  {ZONE_LABELS[d.zone]}
                </span>
              </div>
            </div>
            {/* Landmark bar */}
            <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              {/* MRV zone (orange) */}
              <div className="absolute h-full" style={{
                left: `${(d.mav / d.mrv) * 85}%`,
                right: `${100 - 85}%`,
                background: "#FF950030",
              }} />
              {/* Current fill */}
              <div className="absolute h-full rounded-full transition-all" style={{
                width: `${Math.min(100, (d.current / (d.mrv * 1.2)) * 100)}%`,
                background: ZONE_COLORS[d.zone],
              }} />
              {/* MEV marker */}
              <div className="absolute h-full w-0.5" style={{
                left: `${(d.mev / (d.mrv * 1.2)) * 100}%`,
                background: "#FFD60A",
              }} />
              {/* MAV marker */}
              <div className="absolute h-full w-0.5" style={{
                left: `${(d.mav / (d.mrv * 1.2)) * 100}%`,
                background: "#34C759",
              }} />
              {/* MRV marker */}
              <div className="absolute h-full w-0.5" style={{
                left: `${(d.mrv / (d.mrv * 1.2)) * 100}%`,
                background: "#FF453A",
              }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[0.45rem]" style={{ color: "#FFD60A" }}>MEV {d.mev}</span>
              <span className="text-[0.45rem]" style={{ color: "#34C759" }}>MAV {d.mav}</span>
              <span className="text-[0.45rem]" style={{ color: "#FF453A" }}>MRV {d.mrv}</span>
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}

function ZoneBadge({ zone, count }: { zone: VolumeZone; count: number }) {
  return (
    <div className="text-center p-2 rounded-lg" style={{ background: ZONE_COLORS[zone] + "15" }}>
      <div className="text-lg font-black" style={{ color: ZONE_COLORS[zone] }}>{count}</div>
      <div className="text-[0.45rem] font-bold" style={{ color: ZONE_COLORS[zone] }}>
        {ZONE_LABELS[zone]}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
      <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-[0.7rem] font-bold" style={{ color: "var(--text)" }}>{value}</div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
