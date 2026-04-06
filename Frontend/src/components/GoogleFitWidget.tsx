"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Footprints, Moon, Activity, ChevronRight, Zap } from "lucide-react";
import { t } from "@/lib/i18n";
import { isGoogleFitConnected, getHealthSummary, type HealthSummary } from "@/lib/health-data";
import { isGoogleFitReady, syncHealthForDate } from "@/lib/google-fit";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const RECOVERY_COLORS: Record<string, string> = {
  excellent: "#30D158",
  good: "#34C759",
  fair: "#FF9500",
  poor: "#FF3B30",
};

export default function GoogleFitWidget() {
  const [connected, setConnected] = useState(false);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const conn = isGoogleFitConnected();
    setConnected(conn);
    if (conn) {
      loadSummary();
      // Auto-sync if token is valid and last sync > 1h ago
      if (isGoogleFitReady()) {
        const lastSync = localStorage.getItem("mark-pt-gfit-last-sync");
        const oneHourAgo = Date.now() - 3600000;
        if (!lastSync || new Date(lastSync).getTime() < oneHourAgo) {
          autoSync();
        }
      }
    }
  }, []);

  function loadSummary() {
    const s = getHealthSummary(today());
    setSummary(s);
  }

  async function autoSync() {
    setSyncing(true);
    try {
      await syncHealthForDate(today());
      loadSummary();
    } catch {
      // Silently fail
    } finally {
      setSyncing(false);
    }
  }

  if (!connected) return null;

  const data = summary?.today;
  const recovery = summary ? summary.recoveryScore : null;
  const recoveryLabel = summary?.recoveryLabel || "fair";

  return (
    <Link href="/health" className="no-underline text-inherit">
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="section-label">{t("health.title")}</span>
            {syncing && (
              <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                {t("health.syncing")}
              </span>
            )}
          </div>
          <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
        </div>

        {/* Recovery Score */}
        {recovery !== null && (
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-black"
              style={{ background: RECOVERY_COLORS[recoveryLabel] }}
            >
              {recovery}
            </div>
            <div>
              <div className="text-[0.75rem] font-bold">{t("health.recovery")}</div>
              <div className="text-[0.6rem]" style={{ color: RECOVERY_COLORS[recoveryLabel] }}>
                {t(`health.recovery.${recoveryLabel}`)}
              </div>
            </div>
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Steps */}
          <div className="text-center">
            <Footprints size={14} className="mx-auto mb-1" style={{ color: "var(--accent)" }} />
            <div className="text-[0.82rem] font-bold">
              {data?.steps !== undefined ? (data.steps > 999 ? `${(data.steps / 1000).toFixed(1)}k` : data.steps) : "—"}
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.steps")}</div>
          </div>

          {/* Heart Rate */}
          <div className="text-center">
            <Heart size={14} className="mx-auto mb-1" style={{ color: "#FF3B30" }} />
            <div className="text-[0.82rem] font-bold">
              {data?.restingHeartRate || data?.avgHeartRate || "—"}
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.bpm")}</div>
          </div>

          {/* Sleep */}
          <div className="text-center">
            <Moon size={14} className="mx-auto mb-1" style={{ color: "var(--accent-violet)" }} />
            <div className="text-[0.82rem] font-bold">
              {data?.sleepMinutes ? `${(data.sleepMinutes / 60).toFixed(1)}` : "—"}
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.hours")}</div>
          </div>

          {/* Calories */}
          <div className="text-center">
            <Zap size={14} className="mx-auto mb-1" style={{ color: "var(--accent-orange)" }} />
            <div className="text-[0.82rem] font-bold">
              {data?.caloriesBurned ? (data.caloriesBurned > 999 ? `${(data.caloriesBurned / 1000).toFixed(1)}k` : data.caloriesBurned) : "—"}
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>{t("health.kcal")}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
