"use client";

import { useState, useEffect, useMemo } from "react";
import { getProfileData } from "@/data/profile";
import {
  getCheckins,
  getSessions,
  getTrainingStreak,
  getSettings,
  kgToLbs,
  type DailyCheckin,
  type WorkoutSession,
} from "@/lib/storage";
import { getCurrentPhase, getPhaseWeek, isDeloadWeek } from "@/data/phases";
import { Dumbbell, Flame, AlertTriangle, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import dynamic from "next/dynamic";
import { PageTransition, TabContent, SwipeTabs } from "@/components/motion";

const E1RMChart = dynamic(() => import("@/components/charts/E1RMChart"), { ssr: false });
const MuscleVolumeChart = dynamic(() => import("@/components/charts/MuscleVolumeChart"), { ssr: false });
const SessionVolumeChart = dynamic(() => import("@/components/charts/SessionVolumeChart"), { ssr: false });
const TrainingHeatmap = dynamic(() => import("@/components/charts/TrainingHeatmap"), { ssr: false });
const BodyWeightPRChart = dynamic(() => import("@/components/charts/BodyWeightPRChart"), { ssr: false });
const MuscleDistributionRadar = dynamic(() => import("@/components/charts/MuscleDistributionRadar"), { ssr: false });
const TrainingStreakCard = dynamic(() => import("@/components/charts/TrainingStreakCard"), { ssr: false });
const PRSystemComplete = dynamic(() => import("@/components/charts/PRSystemComplete"), { ssr: false });

type Tab = "cuerpo" | "fuerza" | "volumen";

export default function ProgressPage() {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [streak, setStreak] = useState(0);
  const [tab, setTab] = useState<Tab>("cuerpo");
  const unit = getSettings().unit;

  const profileData = useMemo(() => getProfileData(), []);

  useEffect(() => {
    const ci = getCheckins();
    ci.sort((a, b) => a.date.localeCompare(b.date));
    setCheckins(ci);
    setSessions(getSessions());
    setStreak(getTrainingStreak());
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

  // 4.7 — Weekly executive summary (this week vs last week)
  const weeklySummary = useMemo(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    const lastMonday = new Date(monday);
    lastMonday.setDate(monday.getDate() - 7);

    const thisWeekStr = monday.toISOString().slice(0, 10);
    const lastWeekStr = lastMonday.toISOString().slice(0, 10);

    const thisWeek = sessions.filter((s) => s.completed && s.date >= thisWeekStr);
    const lastWeek = sessions.filter((s) => s.completed && s.date >= lastWeekStr && s.date < thisWeekStr);

    const calc = (list: WorkoutSession[]) => ({
      sessions: list.length,
      sets: list.reduce((a, s) => a + s.exercises.reduce((b, e) => b + (e.skipped ? 0 : e.sets.length), 0), 0),
      volume: list.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets.reduce((c, set) => c + (set.weight || 0) * set.reps, 0), 0), 0),
      avgRating: (() => {
        const rated = list.filter((s) => s.rating);
        return rated.length > 0 ? rated.reduce((a, s) => a + s.rating!, 0) / rated.length : 0;
      })(),
    });

    return { thisWeek: calc(thisWeek), lastWeek: calc(lastWeek) };
  }, [sessions]);

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
    <PageTransition>
    <main className="max-w-[600px] mx-auto px-4 py-5">
      <h1 className="text-[1.3rem] font-black tracking-tight mb-1">Progreso</h1>
      <p className="text-[0.7rem] text-zinc-600 mb-4">
        {checkins.length} check-ins · {trainingDays} días de entreno
      </p>

      {/* 4.7 — Executive Summary: This week vs Last week */}
      {(weeklySummary.thisWeek.sessions > 0 || weeklySummary.lastWeek.sessions > 0) && (
        <div className="card mb-4">
          <div className="text-[0.6rem] text-zinc-500 uppercase tracking-widest mb-2.5">Resumen Semanal</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {([
              { label: "Sesiones", curr: weeklySummary.thisWeek.sessions, prev: weeklySummary.lastWeek.sessions, fmt: (v: number) => String(v) },
              { label: "Sets", curr: weeklySummary.thisWeek.sets, prev: weeklySummary.lastWeek.sets, fmt: (v: number) => String(v) },
              { label: "Volumen", curr: weeklySummary.thisWeek.volume, prev: weeklySummary.lastWeek.volume, fmt: (v: number) => v > 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) },
              { label: "Rating", curr: weeklySummary.thisWeek.avgRating, prev: weeklySummary.lastWeek.avgRating, fmt: (v: number) => v > 0 ? v.toFixed(1) : "—" },
            ] as const).map((item) => {
              const diff = item.prev > 0 ? ((item.curr - item.prev) / item.prev) * 100 : (item.curr > 0 ? 100 : 0);
              const TrendIcon = diff > 5 ? TrendingUp : diff < -5 ? TrendingDown : Minus;
              const trendColor = diff > 5 ? "#34C759" : diff < -5 ? "#FF3B30" : "var(--text-muted)";
              return (
                <div key={item.label}>
                  <div className="text-[0.5rem] text-zinc-500 uppercase">{item.label}</div>
                  <div className="text-[1rem] font-black">{item.fmt(item.curr)}</div>
                  {item.prev > 0 && (
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      <TrendIcon size={9} style={{ color: trendColor }} />
                      <span className="text-[0.5rem] font-bold" style={{ color: trendColor }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      <SwipeTabs tabs={["cuerpo", "fuerza", "volumen"] as const} current={tab} onChange={(t) => setTab(t as typeof tab)}>
      {/* ========== CUERPO TAB ========== */}
      {tab === "cuerpo" && (
        <TabContent tabKey="cuerpo">
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{unit === "lbs" ? kgToLbs(latestWeight) : latestWeight}{unit}</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">Peso</div>
              {weightChange !== 0 && (
                <div className={`text-[0.6rem] font-bold ${weightChange < 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                  {weightChange > 0 ? "+" : ""}{(unit === "lbs" ? kgToLbs(weightChange) : weightChange).toFixed(1)}
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

          {/* Training Streak (Feature 2.7) */}
          <TrainingStreakCard />

          {/* Body Weight + PRs (Feature 2.5) */}
          <BodyWeightPRChart />

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
        </TabContent>
      )}

      {/* ========== FUERZA TAB ========== */}
      {tab === "fuerza" && (
        <TabContent tabKey="fuerza">
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

          {/* PR System Complete (Feature 2.8) */}
          <PRSystemComplete />
        </TabContent>
      )}

      {/* ========== VOLUMEN TAB ========== */}
      {tab === "volumen" && (
        <TabContent tabKey="volumen">
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

          {/* Training Heatmap (Feature 2.4) */}
          <TrainingHeatmap />

          {/* Muscle Distribution Radar (Feature 2.6) */}
          <MuscleDistributionRadar />

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
        </TabContent>
      )}
      </SwipeTabs>
    </main>
    </PageTransition>
  );
}
