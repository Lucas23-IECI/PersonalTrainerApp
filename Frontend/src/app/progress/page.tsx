"use client";

import { useState, useEffect, useMemo } from "react";
import { getProfileData } from "@/data/profile";
import {
  getCheckins,
  getSessions,
  getTrainingStreak,
  getSettings,
  kgToLbs,
  getStressPerformanceData,
  type DailyCheckin,
  type WorkoutSession,
} from "@/lib/storage";
import { getCurrentPhase, getPhaseWeek, isDeloadWeek } from "@/data/phases";
import { Dumbbell, Flame, AlertTriangle, Activity, TrendingUp, TrendingDown, Minus, Moon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageTransition, TabContent, SwipeTabs } from "@/components/motion";
import { getSleepQualityAvg, QUALITY_EMOJIS } from "@/lib/sleep-utils";
import { t } from "@/lib/i18n";
import PullToRefresh from "@/components/PullToRefresh";

const E1RMChart = dynamic(() => import("@/components/charts/E1RMChart"), { ssr: false });
const MuscleVolumeChart = dynamic(() => import("@/components/charts/MuscleVolumeChart"), { ssr: false });
const SessionVolumeChart = dynamic(() => import("@/components/charts/SessionVolumeChart"), { ssr: false });
const TrainingHeatmap = dynamic(() => import("@/components/charts/TrainingHeatmap"), { ssr: false });
const BodyWeightPRChart = dynamic(() => import("@/components/charts/BodyWeightPRChart"), { ssr: false });
const MuscleDistributionRadar = dynamic(() => import("@/components/charts/MuscleDistributionRadar"), { ssr: false });
const TrainingStreakCard = dynamic(() => import("@/components/charts/TrainingStreakCard"), { ssr: false });
const PRSystemComplete = dynamic(() => import("@/components/charts/PRSystemComplete"), { ssr: false });
const OverloadDashboard = dynamic(() => import("@/components/charts/OverloadDashboard"), { ssr: false });
const WeightHistoryChart = dynamic(() => import("@/components/charts/WeightHistoryChart"), { ssr: false });

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
  const stressCheckins = checkins.filter((c) => c.stress);
  const stressAvg = stressCheckins.length > 0
    ? (stressCheckins.reduce((s, c) => s + (c.stress || 0), 0) / stressCheckins.length).toFixed(1)
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
    { id: "cuerpo", label: t("progress.body") },
    { id: "fuerza", label: t("progress.strength") },
    { id: "volumen", label: t("progress.volume") },
  ];

  return (
    <PullToRefresh onRefresh={() => {
      const ci = getCheckins(); ci.sort((a, b) => a.date.localeCompare(b.date));
      setCheckins(ci); setSessions(getSessions()); setStreak(getTrainingStreak());
    }}>
    <PageTransition>
    <main className="max-w-[600px] mx-auto px-4 py-5">
      <h1 className="text-[1.3rem] font-black tracking-tight mb-1">{t("progress.title")}</h1>
      <p className="text-[0.7rem] mb-4" style={{ color: "var(--text-secondary)" }}>
        {checkins.length} {t("progress.checkins")} · {trainingDays} {t("progress.trainingDays")}
      </p>

      {/* 4.7 — Executive Summary: This week vs Last week */}
      {(weeklySummary.thisWeek.sessions > 0 || weeklySummary.lastWeek.sessions > 0) && (
        <div className="card mb-4">
          <div className="text-[0.6rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-muted)" }}>{t("progress.weeklySummary")}</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {([
              { label: t("progress.sessions"), curr: weeklySummary.thisWeek.sessions, prev: weeklySummary.lastWeek.sessions, fmt: (v: number) => String(v) },
              { label: "Sets", curr: weeklySummary.thisWeek.sets, prev: weeklySummary.lastWeek.sets, fmt: (v: number) => String(v) },
              { label: t("progress.volume"), curr: weeklySummary.thisWeek.volume, prev: weeklySummary.lastWeek.volume, fmt: (v: number) => v > 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) },
              { label: "Rating", curr: weeklySummary.thisWeek.avgRating, prev: weeklySummary.lastWeek.avgRating, fmt: (v: number) => v > 0 ? v.toFixed(1) : "—" },
            ] as const).map((item) => {
              const diff = item.prev > 0 ? ((item.curr - item.prev) / item.prev) * 100 : (item.curr > 0 ? 100 : 0);
              const TrendIcon = diff > 5 ? TrendingUp : diff < -5 ? TrendingDown : Minus;
              const trendColor = diff > 5 ? "#34C759" : diff < -5 ? "#FF3B30" : "var(--text-muted)";
              return (
                <div key={item.label}>
                  <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{item.label}</div>
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
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className="flex-1 text-[0.72rem] font-bold py-2 rounded-lg cursor-pointer border-none transition-all"
            style={{
              background: tab === tb.id ? "var(--bg-card)" : "transparent",
              color: tab === tb.id ? "var(--text)" : "var(--text-muted)",
              boxShadow: tab === tb.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <SwipeTabs tabs={["cuerpo", "fuerza", "volumen"] as const} current={tab} onChange={(t) => setTab(t as typeof tab)}>
      {/* ========== CUERPO TAB ========== */}
      {tab === "cuerpo" && (
        <TabContent tabKey="cuerpo">
          {/* Summary row */}
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{unit === "lbs" ? kgToLbs(latestWeight) : latestWeight}{unit}</div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.weight")}</div>
              {weightChange !== 0 && (
                <div className={`text-[0.6rem] font-bold ${weightChange < 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                  {weightChange > 0 ? "+" : ""}{(unit === "lbs" ? kgToLbs(weightChange) : weightChange).toFixed(1)}
                </div>
              )}
            </div>
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{sleepAvg}h</div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.sleep")}</div>
            </div>
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{energyAvg}</div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.energy")}</div>
            </div>
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black" style={{ color: stressAvg !== "—" && parseFloat(stressAvg) >= 4 ? "#FF3B30" : "var(--text)" }}>{stressAvg}</div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("stress.title")}</div>
            </div>
            <div className="card p-2.5 text-center">
              <div className="text-lg font-black">{streak}</div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.streak")}</div>
            </div>
          </div>

          {/* Weight History Chart (Feature 6.7) */}
          <WeightHistoryChart />

          {/* Sleep History */}
          <div className="card mb-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{t("progress.sleep")}</div>
              <Link href="/sleep" className="text-[0.58rem] no-underline font-semibold" style={{ color: "#5E5CE6" }}>{t("progress.seeDetail")}</Link>
            </div>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="text-center">
                <div className="text-lg font-black">{sleepAvg}h</div>
                <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.average")}</div>
              </div>
              {getSleepQualityAvg(7) > 0 && (
                <div className="text-center">
                  <div className="text-lg">{QUALITY_EMOJIS[Math.round(getSleepQualityAvg(7))]}</div>
                  <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.quality")}</div>
                </div>
              )}
            </div>
            {checkins.length === 0 ? (
              <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("progress.noDataYet")}</div>
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
                        <span className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>{c.date.slice(-2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex justify-between text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                  <span className="text-[#FF3B30]">&lt;7h</span>
                  <span className="text-[#34C759]">≥7h</span>
                </div>
              </>
            )}
          </div>

          {/* Energy Trend */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>
              {t("progress.energy")} · {energyAvg}/5
            </div>
            {checkins.length === 0 ? (
              <div className="text-center py-2.5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("progress.noDataYet")}</div>
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

          {/* Stress Trend (7.3) */}
          {stressCheckins.length > 0 && (
            <div className="card mb-3.5">
              <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>
                {t("stress.title")} · {stressAvg}/5
              </div>
              <div className="flex gap-0.5 items-end h-[40px]">
                {checkins.slice(-21).map((c, i) => {
                  const sv = c.stress || 0;
                  const stressColors: Record<number, string> = { 1: "bg-[#34C759]", 2: "bg-[#34C759]", 3: "bg-[#FF9500]", 4: "bg-[#FF3B30]", 5: "bg-[#FF3B30]" };
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className={`w-full max-w-[14px] rounded-sm min-h-[2px] opacity-70 ${sv > 0 ? stressColors[sv] : "bg-[var(--border)]"}`} style={{ height: sv > 0 ? `${(sv / 5) * 100}%` : "4%" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stress vs Performance Correlation (7.3) */}
          {(() => {
            const spData = getStressPerformanceData();
            if (spData.length < 3) return null;
            const byStress: Record<number, { volumes: number[]; rpes: number[] }> = {};
            for (const d of spData) {
              if (!byStress[d.stress]) byStress[d.stress] = { volumes: [], rpes: [] };
              byStress[d.stress].volumes.push(d.volume);
              if (d.avgRPE > 0) byStress[d.stress].rpes.push(d.avgRPE);
            }
            const stressLabelMap = ["", t("stress.relaxed"), t("stress.low"), t("stress.normal"), t("stress.high"), t("stress.extreme")];
            return (
              <div className="card mb-3.5">
                <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>
                  {t("stress.correlation")}
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const data = byStress[level];
                    const avgVol = data ? Math.round(data.volumes.reduce((a, b) => a + b, 0) / data.volumes.length) : 0;
                    const avgRPE = data && data.rpes.length > 0 ? (data.rpes.reduce((a, b) => a + b, 0) / data.rpes.length).toFixed(1) : "—";
                    const count = data ? data.volumes.length : 0;
                    return (
                      <div key={level} className="p-1.5 rounded-lg" style={{ background: count > 0 ? "var(--bg-elevated)" : "transparent" }}>
                        <div className="text-[0.5rem] font-bold mb-0.5" style={{ color: level >= 4 ? "#FF3B30" : level <= 2 ? "#34C759" : "#FF9500" }}>
                          {stressLabelMap[level]}
                        </div>
                        {count > 0 ? (
                          <>
                            <div className="text-[0.65rem] font-black">{avgVol > 1000 ? `${(avgVol / 1000).toFixed(1)}k` : avgVol}</div>
                            <div className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>vol · RPE {avgRPE}</div>
                            <div className="text-[0.4rem]" style={{ color: "var(--text-muted)" }}>{count} días</div>
                          </>
                        ) : (
                          <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Body Weight + PRs (Feature 2.5) */}
          <BodyWeightPRChart />

          {/* Check-in History */}
          <div className="card">
            <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>Check-ins</div>
            {checkins.length === 0 ? (
              <div className="text-center py-2.5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("progress.makeFirstCheckin")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[0.7rem]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>
                      <th className="text-left py-1 font-semibold">{t("progress.dateCol")}</th>
                      <th className="text-center py-1 font-semibold">{t("progress.weightCol")}</th>
                      <th className="text-center py-1 font-semibold">{t("progress.sleepCol")}</th>
                      <th className="text-center py-1 font-semibold">{t("progress.energyCol")}</th>
                      <th className="text-center py-1 font-semibold">{t("stress.title")}</th>
                      <th className="text-center py-1 font-semibold">{t("progress.painCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...checkins].reverse().slice(0, 14).map((c, i) => {
                      const sorenessLabels = [t("progress.sorenessNone"), t("progress.sorenessLight"), t("progress.sorenessMod"), t("progress.sorenessHigh")];
                      const energyLabels = ["", "1", "2", "3", "4", "5"];
                      return (
                        <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          <td className="py-1.5" style={{ color: "var(--text-muted)" }}>{c.date.slice(5)}</td>
                          <td className="py-1.5 text-center font-bold">{c.weight ? `${c.weight}` : "—"}</td>
                          <td className={`py-1.5 text-center ${(c.sleepHours || 0) < 7 ? "text-[#FF3B30]" : "text-[#34C759]"}`}>{c.sleepHours || "—"}h</td>
                          <td className="py-1.5 text-center">{energyLabels[c.energy]}/5</td>
                          <td className="py-1.5 text-center" style={{ color: c.stress && c.stress >= 4 ? "#FF3B30" : c.stress && c.stress <= 2 ? "#34C759" : "var(--text-secondary)" }}>{c.stress ? `${c.stress}/5` : "—"}</td>
                          <td className="py-1.5 text-center" style={{ color: "var(--text-secondary)" }}>{sorenessLabels[c.soreness]}</td>
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
                    <div className="text-sm font-bold text-[#FF9500]">{t("progress.deloadWeek")}</div>
                    <div className="text-[0.68rem]" style={{ color: "var(--text-muted)" }}>{t("progress.deloadAdvice")}</div>
                  </div>
                </div>
              );
            }
            if (phase.deloadWeek && week >= phase.deloadWeek - 1) {
              return (
                <div className="card mb-3.5 flex items-center gap-3" style={{ borderLeft: "3px solid #FFCC00" }}>
                  <AlertTriangle size={18} className="text-[#FFCC00] shrink-0" />
                  <div>
                    <div className="text-[0.75rem] font-bold">{t("progress.deloadNextWeek")}</div>
                    <div className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{t("progress.pushHardThisWeek")}</div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* E1RM Chart (Feature 2.1) */}
          <E1RMChart />

          {/* Progressive Overload Dashboard (Feature F1.5) */}
          <OverloadDashboard />

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
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.trainingDaysFull")}</div>
            </div>
            <div className="card p-3 text-center">
              <Activity size={16} className="mx-auto mb-1" style={{ color: "var(--accent)" }} />
              <div className="text-xl font-black">{sessions.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets.length, 0), 0)}</div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.totalSets")}</div>
            </div>
            <div className="card p-3 text-center">
              <Flame size={16} className="text-[#FF9500] mx-auto mb-1" />
              <div className="text-xl font-black">{streak}</div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("progress.streak")}</div>
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
            <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>{t("progress.setsPerWeek")}</div>
            {weeklyVolume.length < 2 ? (
              <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("progress.needAtLeast2Weeks")}</div>
            ) : (() => {
              const maxSets = Math.max(...weeklyVolume.map((w) => w.sets));
              return (
                <div>
                  <div className="flex gap-1 items-end h-[100px]">
                    {weeklyVolume.map((w, i) => {
                      const pct = maxSets > 0 ? (w.sets / maxSets) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[0.55rem] font-bold" style={{ color: "var(--text-secondary)" }}>{w.sets}</span>
                          <div className="w-full max-w-[24px] rounded-t-md" style={{ height: `${pct}%`, minHeight: 4, background: "var(--accent)" }} />
                          <span className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>{w.week.slice(5)}</span>
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
            <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>{t("progress.totalVolume")}</div>
            {weeklyVolume.length < 2 ? (
              <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("progress.needMoreData")}</div>
            ) : (() => {
              const maxVol = Math.max(...weeklyVolume.map((w) => w.volume));
              return (
                <div className="flex gap-1 items-end h-[100px]">
                  {weeklyVolume.map((w, i) => {
                    const pct = maxVol > 0 ? (w.volume / maxVol) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[0.5rem] font-bold" style={{ color: "var(--text-secondary)" }}>{w.volume > 1000 ? `${(w.volume / 1000).toFixed(0)}k` : w.volume}</span>
                        <div className="w-full max-w-[24px] rounded-t-md" style={{ height: `${pct}%`, minHeight: 4, background: "#34C759" }} />
                        <span className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>{w.week.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Sessions per week */}
          <div className="card mb-3.5">
            <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>{t("progress.sessionsPerWeek")}</div>
            {weeklyVolume.length < 2 ? (
              <div className="text-center py-5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("progress.needMoreData")}</div>
            ) : (
              <div className="flex gap-1 items-end h-[70px]">
                {weeklyVolume.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[0.6rem] font-bold" style={{ color: "var(--text-secondary)" }}>{w.sessions}</span>
                    <div className="w-full max-w-[24px] rounded-t-md" style={{ height: `${(w.sessions / 7) * 100}%`, minHeight: 4, background: "#FF9500" }} />
                    <span className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>{w.week.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly breakdown table */}
          <div className="card">
            <div className="text-[0.65rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--text-secondary)" }}>{t("progress.weeklyDetail")}</div>
            {weeklyVolume.length === 0 ? (
              <div className="text-center py-2.5 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("progress.noData")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[0.7rem]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>
                      <th className="text-left py-1 font-semibold">{t("progress.weekCol")}</th>
                      <th className="text-center py-1 font-semibold">{t("progress.sessions")}</th>
                      <th className="text-center py-1 font-semibold">{t("progress.setsCol")}</th>
                      <th className="text-right py-1 font-semibold">{t("progress.volumeCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...weeklyVolume].reverse().map((w, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td className="py-1.5" style={{ color: "var(--text-muted)" }}>{w.week.slice(5)}</td>
                        <td className="py-1.5 text-center font-bold">{w.sessions}</td>
                        <td className="py-1.5 text-center">{w.sets}</td>
                        <td className="py-1.5 text-right" style={{ color: "var(--text-secondary)" }}>{w.volume > 1000 ? `${(w.volume / 1000).toFixed(1)}k` : w.volume}kg</td>
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
    </PullToRefresh>
  );
}
