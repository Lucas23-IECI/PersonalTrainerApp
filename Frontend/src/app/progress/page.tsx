"use client";

import { useState, useEffect, useMemo } from "react";
import { getProfileData } from "@/data/profile";
import {
  getCheckins,
  getSessions,
  getTrainingStreak,
  type DailyCheckin,
  type WorkoutSession,
} from "@/lib/storage";
import {
  getPersonalRecords,
  getExerciseHistory,
  type PersonalRecord,
} from "@/lib/progression";
import { getCurrentPhase, getPhaseWeek, isDeloadWeek } from "@/data/phases";
import { TrendingDown, Moon, Dumbbell, Flame, Trophy, BarChart3, AlertTriangle, Activity } from "lucide-react";
import dynamic from "next/dynamic";

const E1RMChart = dynamic(() => import("@/components/charts/E1RMChart"), { ssr: false });
const MuscleVolumeChart = dynamic(() => import("@/components/charts/MuscleVolumeChart"), { ssr: false });
const SessionVolumeChart = dynamic(() => import("@/components/charts/SessionVolumeChart"), { ssr: false });

type Tab = "cuerpo" | "fuerza" | "volumen";

export default function ProgressPage() {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [streak, setStreak] = useState(0);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [selectedLift, setSelectedLift] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("cuerpo");

  const profileData = useMemo(() => getProfileData(), []);

  useEffect(() => {
    const ci = getCheckins();
    ci.sort((a, b) => a.date.localeCompare(b.date));
    setCheckins(ci);
    setSessions(getSessions());
    setStreak(getTrainingStreak());
    setPrs(getPersonalRecords());
  }, []);

  const weighIns = checkins.filter((c) => c.weight);
  const latestWeight = weighIns.length > 0 ? weighIns[weighIns.length - 1].weight! : profileData.weight;
  const weightChange = latestWeight - profileData.weight;
  const sleepAvg = checkins.length > 0
    ? (checkins.reduce((s, c) => s + (c.sleepHours || 0), 0) / checkins.length).toFixed(1)
    : "—";
  const energyAvg = checkins.length > 0
    ? (checkins.reduce((s, c) => s + c.energy, 0) / checkins.length).toFixed(1)
    : "—";

  const trainingDays = new Set(sessions.filter((s) => s.completed).map((s) => s.date)).size;

  // Weight chart data
  const weightData = weighIns.slice(-14);
  const minW = weightData.length > 0 ? Math.min(...weightData.map((w) => w.weight!)) - 0.5 : 0;
  const maxW = weightData.length > 0 ? Math.max(...weightData.map((w) => w.weight!)) + 0.5 : 1;
  const rangeW = maxW - minW || 1;

  // Volume data: sets per week
  const weeklyVolume = useMemo(() => {
    const byWeek = new Map<string, { sets: number; volume: number; sessions: number }>();
    sessions.forEach((s) => {
      if (!s.completed) return;
      const d = new Date(s.date);
      // ISO week start (Monday)
      const day = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + 1);
      const key = monday.toISOString().slice(0, 10);
      const cur = byWeek.get(key) || { sets: 0, volume: 0, sessions: 0 };
      s.exercises.forEach((e) => {
        if (e.skipped) return;
        cur.sets += e.sets.length;
        e.sets.forEach((set) => {
          cur.volume += (set.weight || 0) * set.reps;
        });
      });
      cur.sessions += 1;
      byWeek.set(key, cur);
    });
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, data]) => ({ week, ...data }));
  }, [sessions]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "cuerpo", label: "Cuerpo" },
    { id: "fuerza", label: "Fuerza" },
    { id: "volumen", label: "Volumen" },
  ];

  return (
    <main className="max-w-[600px] mx-auto px-4 py-5">
      <h1 className="text-[1.3rem] font-black tracking-tight mb-1">Progreso</h1>
      <p className="text-[0.7rem] text-zinc-600 mb-4">
        {checkins.length} check-ins · {trainingDays} días de entreno
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 text-[0.72rem] font-bold py-2 rounded-lg cursor-pointer border-none transition-all"
            style={{
              background: tab === t.id ? "var(--bg-card)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-muted)",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========== CUERPO TAB ========== */}
      {tab === "cuerpo" && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{latestWeight}kg</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Peso</div>
              {weightChange !== 0 && (
                <div className={`text-[0.6rem] font-bold ${weightChange < 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                  {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}
                </div>
              )}
            </div>
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{sleepAvg}h</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Sueño</div>
            </div>
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{energyAvg}</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Energía</div>
            </div>
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{streak}</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Racha</div>
            </div>
          </div>

          {/* Weight Chart */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">
              Evolución de Peso
            </div>
            {weightData.length < 2 ? (
              <div className="text-center py-5 text-zinc-400 text-[0.8rem]">
                Necesitás al menos 2 pesajes en check-ins
              </div>
            ) : (
              <div className="relative h-[140px]">
                <div className="absolute left-0 top-0 bottom-0 w-[35px] flex flex-col justify-between text-[0.55rem] text-zinc-400">
                  <span>{maxW.toFixed(1)}</span>
                  <span>{((maxW + minW) / 2).toFixed(1)}</span>
                  <span>{minW.toFixed(1)}</span>
                </div>
                <div className="ml-10 h-full relative">
                  {[0, 0.5, 1].map((p) => (
                    <div key={p} className="absolute left-0 right-0" style={{ top: `${p * 100}%`, borderBottom: "1px solid var(--border-subtle)" }} />
                  ))}
                  {profileData.goalWeight >= minW && profileData.goalWeight <= maxW && (
                    <div className="absolute left-0 right-0 border-b border-dashed border-[#34C75966]" style={{ top: `${((maxW - profileData.goalWeight) / rangeW) * 100}%` }}>
                      <span className="absolute right-0 -top-3 text-[0.5rem] text-[#34C759]">Meta {profileData.goalWeight}</span>
                    </div>
                  )}
                  <svg viewBox={`0 0 ${(weightData.length - 1) * 40 + 20} 140`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {weightData.map((d, i) => {
                      if (i === 0) return null;
                      const x1 = (i - 1) * 40 + 10;
                      const y1 = ((maxW - weightData[i - 1].weight!) / rangeW) * 140;
                      const x2 = i * 40 + 10;
                      const y2 = ((maxW - d.weight!) / rangeW) * 140;
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2C6BED" strokeWidth="2" />;
                    })}
                    {weightData.map((d, i) => {
                      const x = i * 40 + 10;
                      const y = ((maxW - d.weight!) / rangeW) * 140;
                      return <circle key={i} cx={x} cy={y} r="4" fill="#2C6BED" stroke="#fff" strokeWidth="2" />;
                    })}
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Sleep History */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">Sueño</div>
            {checkins.length === 0 ? (
              <div className="text-center py-5 text-zinc-400 text-[0.8rem]">Sin datos todavía</div>
            ) : (
              <>
                <div className="flex gap-0.5 items-end h-[60px]">
                  {checkins.slice(-21).map((c, i) => {
                    const h = c.sleepHours || 0;
                    const pct = Math.min((h / 10) * 100, 100);
                    const bad = h < 7;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className={`w-full max-w-[14px] rounded-sm min-h-[2px] opacity-70 ${bad ? "bg-[#FF3B30]" : "bg-[#34C759]"}`}
                          style={{ height: `${pct}%` }}
                        />
                        <span className="text-[0.45rem] text-zinc-400">{c.date.slice(-2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex justify-between text-[0.55rem] text-zinc-400">
                  <span className="text-[#FF3B30]">&lt;7h</span>
                  <span className="text-[#34C759]">≥7h</span>
                </div>
              </>
            )}
          </div>

          {/* Energy Trend */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">
              Energía · {energyAvg}/5
            </div>
            {checkins.length === 0 ? (
              <div className="text-center py-2.5 text-zinc-400 text-[0.8rem]">Sin datos todavía</div>
            ) : (
              <div className="flex gap-0.5 items-end h-[40px]">
                {checkins.slice(-21).map((c, i) => {
                  const colors: Record<number, string> = { 1: "bg-[#FF3B30]", 2: "bg-[#FF9500]", 3: "bg-[#FFCC00]", 4: "bg-[#34C759]", 5: "bg-[#34C759]" };
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className={`w-full max-w-[14px] rounded-sm min-h-[2px] opacity-70 ${colors[c.energy] || ""}`} style={{ height: `${(c.energy / 5) * 100}%` }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Check-in History */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">Check-ins</div>
            {checkins.length === 0 ? (
              <div className="text-center py-2.5 text-zinc-400 text-[0.8rem]">Hacé tu primer check-in desde el dashboard</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[0.7rem]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="text-[0.55rem] text-zinc-400 uppercase">
                      <th className="text-left py-1 font-semibold">Fecha</th>
                      <th className="text-center py-1 font-semibold">Peso</th>
                      <th className="text-center py-1 font-semibold">Sueño</th>
                      <th className="text-center py-1 font-semibold">Energía</th>
                      <th className="text-center py-1 font-semibold">Dolor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...checkins].reverse().slice(0, 14).map((c, i) => {
                      const sorenessLabels = ["—", "Leve", "Mod", "Alto"];
                      const energyLabels = ["", "1", "2", "3", "4", "5"];
                      return (
                        <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          <td className="py-1.5 text-zinc-500">{c.date.slice(5)}</td>
                          <td className="py-1.5 text-center font-bold">{c.weight ? `${c.weight}` : "—"}</td>
                          <td className={`py-1.5 text-center ${(c.sleepHours || 0) < 7 ? "text-[#FF3B30]" : "text-[#34C759]"}`}>{c.sleepHours || "—"}h</td>
                          <td className="py-1.5 text-center">{energyLabels[c.energy]}/5</td>
                          <td className="py-1.5 text-center text-zinc-600">{sorenessLabels[c.soreness]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========== FUERZA TAB ========== */}
      {tab === "fuerza" && (
        <>
          {/* Deload Warning */}
          {(() => {
            const phase = getCurrentPhase();
            const week = getPhaseWeek(phase);
            const deload = isDeloadWeek(phase);
            if (deload) {
              return (
                <div className="card mb-3.5 flex items-center gap-3" style={{ borderLeft: "3px solid #FF9500" }}>
                  <AlertTriangle size={20} className="text-[#FF9500] shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-[#FF9500]">Semana de Deload</div>
                    <div className="text-[0.68rem] text-zinc-500">Reducí volumen -40%, mantené intensidad.</div>
                  </div>
                </div>
              );
            }
            if (phase.deloadWeek && week >= phase.deloadWeek - 1) {
              return (
                <div className="card mb-3.5 flex items-center gap-3" style={{ borderLeft: "3px solid #FFCC00" }}>
                  <AlertTriangle size={18} className="text-[#FFCC00] shrink-0" />
                  <div>
                    <div className="text-[0.75rem] font-bold">Deload la próxima semana</div>
                    <div className="text-[0.65rem] text-zinc-500">Pusheá fuerte esta semana.</div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* E1RM Chart (Feature 2.1) */}
          <E1RMChart />

          {/* Personal Records */}
          <div className="card mb-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <Trophy size={16} className="text-[#FFD700]" />
              <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">Records Personales</div>
            </div>
            {prs.length === 0 ? (
              <div className="text-center py-5 text-zinc-400 text-[0.8rem]">Completá sesiones para desbloquear PRs</div>
            ) : (() => {
              const byExercise = new Map<string, PersonalRecord>();
              prs.forEach((pr) => {
                if (pr.type === "weight") {
                  const current = byExercise.get(pr.exerciseName);
                  if (!current || pr.value > current.value) byExercise.set(pr.exerciseName, pr);
                }
              });
              const weightPrs = Array.from(byExercise.values()).sort((a, b) => b.value - a.value);
              const e1rmByEx = new Map<string, PersonalRecord>();
              prs.forEach((pr) => {
                if (pr.type === "e1rm") {
                  const current = e1rmByEx.get(pr.exerciseName);
                  if (!current || pr.value > current.value) e1rmByEx.set(pr.exerciseName, pr);
                }
              });
              return (
                <div>
                  {weightPrs.slice(0, 10).map((pr, i) => {
                    const e1rm = e1rmByEx.get(pr.exerciseName);
                    return (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2 cursor-pointer"
                        style={{ borderBottom: i < Math.min(weightPrs.length, 10) - 1 ? "1px solid var(--border-subtle)" : "none" }}
                        onClick={() => setSelectedLift(selectedLift === pr.exerciseName ? null : pr.exerciseName)}
                      >
                        <div>
                          <div className="text-[0.8rem] font-semibold text-zinc-800">{pr.exerciseName}</div>
                          <div className="text-[0.6rem] text-zinc-500">{pr.date.slice(5)} · {pr.detail}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-[#2C6BED]">{pr.value}kg</div>
                          {e1rm && <div className="text-[0.55rem] text-zinc-400">e1RM ~{Math.round(e1rm.value)}kg</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Exercise Progression Chart */}
          {selectedLift && (() => {
            const history = getExerciseHistory(selectedLift, 12);
            if (history.length < 2) return (
              <div className="card mb-3.5">
                <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2">
                  <BarChart3 size={14} className="inline mr-1" /> {selectedLift}
                </div>
                <div className="text-center py-4 text-zinc-400 text-[0.75rem]">Necesitás al menos 2 sesiones</div>
              </div>
            );

            const reversed = [...history].reverse();
            const weights = reversed.map((h) => h.topSet.weight);
            const minVal = Math.min(...weights) - 2.5;
            const maxVal = Math.max(...weights) + 2.5;
            const range = maxVal - minVal || 1;
            const chartW = (reversed.length - 1) * 50 + 20;

            return (
              <div className="card mb-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                    <BarChart3 size={14} className="text-[#2C6BED]" /> {selectedLift}
                  </div>
                  <button onClick={() => setSelectedLift(null)} className="text-[0.6rem] text-zinc-500 bg-transparent border-none cursor-pointer">Cerrar</button>
                </div>
                <div className="relative h-[120px]">
                  <div className="absolute left-0 top-0 bottom-0 w-[35px] flex flex-col justify-between text-[0.55rem] text-zinc-400">
                    <span>{maxVal.toFixed(1)}</span>
                    <span>{((maxVal + minVal) / 2).toFixed(1)}</span>
                    <span>{minVal.toFixed(1)}</span>
                  </div>
                  <div className="ml-10 h-full relative overflow-x-auto">
                    <svg viewBox={`0 0 ${chartW} 120`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      {[0, 0.5, 1].map((p) => (
                        <line key={p} x1="0" y1={p * 120} x2={chartW} y2={p * 120} stroke="var(--border-subtle)" strokeWidth="0.5" />
                      ))}
                      {reversed.map((h, i) => {
                        if (i === 0) return null;
                        const x1 = (i - 1) * 50 + 10;
                        const y1 = ((maxVal - reversed[i - 1].topSet.weight) / range) * 120;
                        const x2 = i * 50 + 10;
                        const y2 = ((maxVal - h.topSet.weight) / range) * 120;
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2C6BED" strokeWidth="2" />;
                      })}
                      {reversed.map((h, i) => {
                        const x = i * 50 + 10;
                        const y = ((maxVal - h.topSet.weight) / range) * 120;
                        return <circle key={i} cx={x} cy={y} r="4" fill="#2C6BED" stroke="#fff" strokeWidth="2" />;
                      })}
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-[0.55rem] text-zinc-400 ml-10">
                  <span>{reversed[0]?.date.slice(5)}</span>
                  <span>{reversed[reversed.length - 1]?.date.slice(5)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {reversed.slice(-3).map((h, i) => (
                    <div key={i} className="flex-1 text-center py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                      <div className="text-[0.7rem] font-bold">{h.topSet.weight}×{h.topSet.reps}</div>
                      <div className="text-[0.5rem] text-zinc-500">{h.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ========== VOLUMEN TAB ========== */}
      {tab === "volumen" && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="card p-3 text-center">
              <Dumbbell size={16} className="text-[#34C759] mx-auto mb-1" />
              <div className="text-xl font-black">{trainingDays}</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Días entreno</div>
            </div>
            <div className="card p-3 text-center">
              <Activity size={16} className="text-[#2C6BED] mx-auto mb-1" />
              <div className="text-xl font-black">{sessions.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets.length, 0), 0)}</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Sets totales</div>
            </div>
            <div className="card p-3 text-center">
              <Flame size={16} className="text-[#FF9500] mx-auto mb-1" />
              <div className="text-xl font-black">{streak}</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Racha</div>
            </div>
          </div>

          {/* Session Volume Chart (Feature 2.3) */}
          <SessionVolumeChart />

          {/* Muscle Volume Chart (Feature 2.2) */}
          <MuscleVolumeChart />

          {/* Sets per week chart */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">Sets por Semana</div>
            {weeklyVolume.length < 2 ? (
              <div className="text-center py-5 text-zinc-400 text-[0.8rem]">Necesitás al menos 2 semanas de datos</div>
            ) : (() => {
              const maxSets = Math.max(...weeklyVolume.map((w) => w.sets));
              return (
                <div>
                  <div className="flex gap-1 items-end h-[100px]">
                    {weeklyVolume.map((w, i) => {
                      const pct = maxSets > 0 ? (w.sets / maxSets) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[0.55rem] font-bold text-zinc-600">{w.sets}</span>
                          <div className="w-full max-w-[24px] rounded-t-md" style={{ height: `${pct}%`, minHeight: 4, background: "#2C6BED" }} />
                          <span className="text-[0.45rem] text-zinc-400">{w.week.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Volume (weight × reps) per week */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">Volumen Total (kg × reps)</div>
            {weeklyVolume.length < 2 ? (
              <div className="text-center py-5 text-zinc-400 text-[0.8rem]">Necesitás más datos</div>
            ) : (() => {
              const maxVol = Math.max(...weeklyVolume.map((w) => w.volume));
              return (
                <div className="flex gap-1 items-end h-[100px]">
                  {weeklyVolume.map((w, i) => {
                    const pct = maxVol > 0 ? (w.volume / maxVol) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[0.5rem] font-bold text-zinc-600">{w.volume > 1000 ? `${(w.volume / 1000).toFixed(0)}k` : w.volume}</span>
                        <div className="w-full max-w-[24px] rounded-t-md" style={{ height: `${pct}%`, minHeight: 4, background: "#34C759" }} />
                        <span className="text-[0.45rem] text-zinc-400">{w.week.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Sessions per week */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">Sesiones por Semana</div>
            {weeklyVolume.length < 2 ? (
              <div className="text-center py-5 text-zinc-400 text-[0.8rem]">Necesitás más datos</div>
            ) : (
              <div className="flex gap-1 items-end h-[70px]">
                {weeklyVolume.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[0.6rem] font-bold text-zinc-600">{w.sessions}</span>
                    <div className="w-full max-w-[24px] rounded-t-md" style={{ height: `${(w.sessions / 7) * 100}%`, minHeight: 4, background: "#FF9500" }} />
                    <span className="text-[0.45rem] text-zinc-400">{w.week.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly breakdown table */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2.5">Detalle Semanal</div>
            {weeklyVolume.length === 0 ? (
              <div className="text-center py-2.5 text-zinc-400 text-[0.8rem]">Sin datos</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[0.7rem]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="text-[0.55rem] text-zinc-400 uppercase">
                      <th className="text-left py-1 font-semibold">Semana</th>
                      <th className="text-center py-1 font-semibold">Sesiones</th>
                      <th className="text-center py-1 font-semibold">Sets</th>
                      <th className="text-right py-1 font-semibold">Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...weeklyVolume].reverse().map((w, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td className="py-1.5 text-zinc-500">{w.week.slice(5)}</td>
                        <td className="py-1.5 text-center font-bold">{w.sessions}</td>
                        <td className="py-1.5 text-center">{w.sets}</td>
                        <td className="py-1.5 text-right text-zinc-600">{w.volume > 1000 ? `${(w.volume / 1000).toFixed(1)}k` : w.volume}kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
