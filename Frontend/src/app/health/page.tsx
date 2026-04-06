"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Footprints,
  Moon,
  Zap,
  Activity,
  Wind,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  isGoogleFitConnected,
  getHealthForRange,
  getHealthSummary,
  type HealthSnapshot,
  type HealthSummary,
} from "@/lib/health-data";
import { syncRecentHealth, isGoogleFitReady } from "@/lib/google-fit";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

const RECOVERY_COLORS: Record<string, string> = {
  excellent: "#30D158",
  good: "#34C759",
  fair: "#FF9500",
  poor: "#FF3B30",
};

function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-[3px] h-16">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            background: v > 0 ? color : "var(--bg-elevated)",
            height: `${maxVal > 0 ? Math.max((v / maxVal) * 100, 4) : 4}%`,
            minWidth: 6,
          }}
        />
      ))}
    </div>
  );
}

export default function HealthPage() {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [weekData, setWeekData] = useState<HealthSnapshot[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const connected = isGoogleFitConnected();

  useEffect(() => {
    loadData();
    setLastSync(localStorage.getItem("mark-pt-gfit-last-sync"));
  }, []);

  function loadData() {
    const s = getHealthSummary(today());
    setSummary(s);
    const range = getHealthForRange(dateNDaysAgo(6), today());
    setWeekData(range);
  }

  async function handleSync() {
    if (!isGoogleFitReady()) return;
    setSyncing(true);
    try {
      await syncRecentHealth();
      loadData();
      setLastSync(new Date().toISOString());
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  }

  const todayData = summary?.today;
  const recovery = summary?.recoveryScore ?? null;
  const recoveryLabel = summary?.recoveryLabel ?? "fair";

  // Build arrays for charts (7 days, oldest first)
  const chartSteps = useMemo(() => {
    const arr: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dateNDaysAgo(i);
      const snap = weekData.find((s) => s.date === d);
      arr.push(snap?.steps ?? 0);
    }
    return arr;
  }, [weekData]);

  const chartSleep = useMemo(() => {
    const arr: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dateNDaysAgo(i);
      const snap = weekData.find((s) => s.date === d);
      arr.push(snap?.sleepMinutes ? snap.sleepMinutes / 60 : 0);
    }
    return arr;
  }, [weekData]);

  const chartHR = useMemo(() => {
    const arr: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dateNDaysAgo(i);
      const snap = weekData.find((s) => s.date === d);
      arr.push(snap?.restingHeartRate ?? snap?.avgHeartRate ?? 0);
    }
    return arr;
  }, [weekData]);

  const todayIdx = new Date().getDay();
  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(DAY_LABELS[d.getDay()]);
    }
    return labels;
  }, []);

  if (!connected) {
    return (
      <PageTransition>
        <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </Link>
            <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
              <Activity size={18} style={{ color: "var(--accent)" }} /> {t("health.title")}
            </h1>
          </div>
          <div className="card text-center py-10">
            <Activity size={36} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-[0.8rem] font-bold mb-1">{t("health.notConnected")}</p>
            <p className="text-[0.65rem] mb-4" style={{ color: "var(--text-muted)" }}>
              {t("health.connectHint")}
            </p>
            <Link
              href="/settings"
              className="inline-block px-5 py-2.5 rounded-xl text-[0.75rem] font-bold text-white no-underline"
              style={{ background: "var(--accent)" }}
            >
              {t("health.goToSettings")}
            </Link>
          </div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
                <Activity size={18} style={{ color: "var(--accent)" }} /> {t("health.title")}
              </h1>
              {lastSync && (
                <p className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                  {t("health.lastSync")}: {new Date(lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.72rem] font-bold border-none cursor-pointer"
            style={{ background: "var(--accent)", color: "#fff", opacity: syncing ? 0.6 : 1 }}
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? t("health.syncing") : t("health.sync")}
          </button>
        </div>

        {/* Recovery Score Card */}
        {recovery !== null && (
          <div className="card mb-4" style={{ borderLeft: `3px solid ${RECOVERY_COLORS[recoveryLabel]}` }}>
            <div className="text-[0.6rem] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              {t("health.recovery")}
            </div>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black"
                style={{ background: RECOVERY_COLORS[recoveryLabel] }}
              >
                {recovery}
              </div>
              <div>
                <div className="text-[0.85rem] font-bold" style={{ color: RECOVERY_COLORS[recoveryLabel] }}>
                  {t(`health.recovery.${recoveryLabel}`)}
                </div>
                <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  {t("health.recoveryDesc")}
                </div>
              </div>
            </div>
            {/* Weekly avg */}
            {summary?.weekAvg && (
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="text-center">
                  <div className="text-[0.75rem] font-bold">{summary.weekAvg.steps.toLocaleString()}</div>
                  <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.avgSteps")}</div>
                </div>
                <div className="text-center">
                  <div className="text-[0.75rem] font-bold">{summary.weekAvg.sleep.toFixed(1)}h</div>
                  <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.avgSleep")}</div>
                </div>
                <div className="text-center">
                  <div className="text-[0.75rem] font-bold">{summary.weekAvg.restingHR || "—"}</div>
                  <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.avgHR")}</div>
                </div>
                <div className="text-center">
                  <div className="text-[0.75rem] font-bold">{summary.weekAvg.activeMinutes}</div>
                  <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.avgActive")}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Today's Stats */}
        <div className="card mb-4">
          <div className="text-[0.6rem] uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            {t("common.today")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Steps */}
            <div className="flex items-center gap-2.5 py-1">
              <Footprints size={18} style={{ color: "var(--accent)" }} />
              <div>
                <div className="text-[0.9rem] font-black">{todayData?.steps?.toLocaleString() ?? "—"}</div>
                <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.steps")}</div>
              </div>
            </div>
            {/* Heart Rate */}
            <div className="flex items-center gap-2.5 py-1">
              <Heart size={18} style={{ color: "#FF3B30" }} />
              <div>
                <div className="text-[0.9rem] font-black">
                  {todayData?.restingHeartRate || todayData?.avgHeartRate || "—"}
                </div>
                <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.bpm")}</div>
              </div>
            </div>
            {/* Sleep */}
            <div className="flex items-center gap-2.5 py-1">
              <Moon size={18} style={{ color: "var(--accent-violet)" }} />
              <div>
                <div className="text-[0.9rem] font-black">
                  {todayData?.sleepMinutes ? `${(todayData.sleepMinutes / 60).toFixed(1)}h` : "—"}
                </div>
                <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("common.sleep")}</div>
              </div>
            </div>
            {/* Calories */}
            <div className="flex items-center gap-2.5 py-1">
              <Zap size={18} style={{ color: "var(--accent-orange)" }} />
              <div>
                <div className="text-[0.9rem] font-black">
                  {todayData?.caloriesBurned?.toLocaleString() ?? "—"}
                </div>
                <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.kcal")}</div>
              </div>
            </div>
            {/* Active Minutes */}
            <div className="flex items-center gap-2.5 py-1">
              <Activity size={18} style={{ color: "var(--accent-green)" }} />
              <div>
                <div className="text-[0.9rem] font-black">{todayData?.activeMinutes ?? "—"}</div>
                <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.activeMin")}</div>
              </div>
            </div>
            {/* Distance */}
            <div className="flex items-center gap-2.5 py-1">
              <MapPin size={18} style={{ color: "#5E5CE6" }} />
              <div>
                <div className="text-[0.9rem] font-black">
                  {todayData?.distance ? `${(todayData.distance / 1000).toFixed(1)} km` : "—"}
                </div>
                <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.distance")}</div>
              </div>
            </div>
            {/* SpO2 */}
            {todayData?.spo2 !== undefined && (
              <div className="flex items-center gap-2.5 py-1">
                <Wind size={18} style={{ color: "#30D158" }} />
                <div>
                  <div className="text-[0.9rem] font-black">{todayData.spo2}%</div>
                  <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.spo2")}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sleep Stages */}
        {todayData?.sleepStages && (
          <div className="card mb-4">
            <div className="text-[0.6rem] uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              {t("health.sleepStages")}
            </div>
            <div className="flex items-center gap-1 mb-2 h-6 rounded-lg overflow-hidden">
              {(() => {
                const stages = todayData.sleepStages;
                const total = stages.deep + stages.light + stages.rem + stages.awake;
                if (total === 0) return null;
                return (
                  <>
                    <div style={{ width: `${(stages.deep / total) * 100}%`, background: "#1C3A70", height: "100%" }} />
                    <div style={{ width: `${(stages.light / total) * 100}%`, background: "#5E5CE6", height: "100%" }} />
                    <div style={{ width: `${(stages.rem / total) * 100}%`, background: "#BF5AF2", height: "100%" }} />
                    <div style={{ width: `${(stages.awake / total) * 100}%`, background: "#FF9500", height: "100%" }} />
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: "#1C3A70" }} />
                <div className="text-[0.7rem] font-bold">{todayData.sleepStages.deep}m</div>
                <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>{t("health.deep")}</div>
              </div>
              <div>
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: "#5E5CE6" }} />
                <div className="text-[0.7rem] font-bold">{todayData.sleepStages.light}m</div>
                <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>{t("health.light")}</div>
              </div>
              <div>
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: "#BF5AF2" }} />
                <div className="text-[0.7rem] font-bold">{todayData.sleepStages.rem}m</div>
                <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>REM</div>
              </div>
              <div>
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: "#FF9500" }} />
                <div className="text-[0.7rem] font-bold">{todayData.sleepStages.awake}m</div>
                <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>{t("health.awake")}</div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Charts */}
        <div className="card mb-4">
          <div className="text-[0.6rem] uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            {t("health.weeklySteps")}
          </div>
          <MiniBarChart data={chartSteps} maxVal={Math.max(...chartSteps, 1)} color="var(--accent)" />
          <div className="flex justify-between mt-1">
            {dayLabels.map((l, i) => (
              <span key={i} className="text-[0.5rem] flex-1 text-center" style={{ color: "var(--text-muted)" }}>{l}</span>
            ))}
          </div>
        </div>

        <div className="card mb-4">
          <div className="text-[0.6rem] uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            {t("health.weeklySleep")}
          </div>
          <MiniBarChart data={chartSleep} maxVal={Math.max(...chartSleep, 1)} color="var(--accent-violet, #5E5CE6)" />
          <div className="flex justify-between mt-1">
            {dayLabels.map((l, i) => (
              <span key={i} className="text-[0.5rem] flex-1 text-center" style={{ color: "var(--text-muted)" }}>{l}</span>
            ))}
          </div>
        </div>

        <div className="card mb-4">
          <div className="text-[0.6rem] uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            {t("health.weeklyHR")}
          </div>
          <MiniBarChart data={chartHR} maxVal={Math.max(...chartHR, 1)} color="#FF3B30" />
          <div className="flex justify-between mt-1">
            {dayLabels.map((l, i) => (
              <span key={i} className="text-[0.5rem] flex-1 text-center" style={{ color: "var(--text-muted)" }}>{l}</span>
            ))}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
