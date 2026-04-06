"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Clock,
  Dumbbell,
  Flame,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import { getSessions } from "@/lib/storage";
import {
  analyzeSession,
  getDayPatterns,
  type SessionAnalysis,
  type DayPattern,
} from "@/lib/session-intelligence";

function StatCard({ label, value, delta, unit }: { label: string; value: string; delta?: number; unit?: string }) {
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}> {unit}</span>}
      </div>
      {delta !== undefined && delta !== 0 && (
        <div style={{ fontSize: 11, fontWeight: 600, color: delta > 0 ? "#34C759" : "#FF9500", marginTop: 2 }}>
          {delta > 0 ? "+" : ""}{delta} vs avg
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: SessionAnalysis["insights"][0] }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        borderLeft: `3px solid ${insight.color}`,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{insight.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{insight.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{insight.detail}</div>
      </div>
    </div>
  );
}

function DayBar({ pattern, maxSets }: { pattern: DayPattern; maxSets: number }) {
  const pct = maxSets > 0 ? (pattern.avgSets / maxSets) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 28, fontSize: 12, fontWeight: 600, textAlign: "right" }}>
        {pattern.dayName.slice(0, 3)}
      </span>
      <div style={{ flex: 1, height: 20, borderRadius: 6, background: "var(--card-bg)", position: "relative" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 6,
            background: pattern.isBestDay ? "#34C759" : "var(--accent)",
            transition: "width 0.4s ease",
          }}
        />
        {pattern.sessionCount > 0 && (
          <span
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
            }}
          >
            {pattern.avgSets}
          </span>
        )}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [patterns, setPatterns] = useState<DayPattern[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);

  const sessions = typeof window !== "undefined"
    ? getSessions().filter((s) => s.completed).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  useEffect(() => {
    if (sessions.length > 0) {
      setAnalysis(analyzeSession(sessions[sessionIndex].id));
    }
    setPatterns(getDayPatterns());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIndex]);

  const canPrev = sessionIndex < sessions.length - 1;
  const canNext = sessionIndex > 0;

  return (
    <PageTransition>
      <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "0 0 100px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 8px" }}>
          <Link href="/" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              <Sparkles size={20} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {t("insights.title")}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{t("insights.subtitle")}</p>
          </div>
        </div>

        {!analysis ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            {t("insights.noSessions")}
          </div>
        ) : (
          <>
            {/* Session navigator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
              <button
                disabled={!canPrev}
                onClick={() => setSessionIndex(sessionIndex + 1)}
                style={{
                  background: "none",
                  border: "none",
                  color: canPrev ? "var(--accent)" : "var(--text-muted)",
                  cursor: canPrev ? "pointer" : "default",
                  padding: 4,
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{analysis.workoutName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{analysis.date}</div>
              </div>
              <button
                disabled={!canNext}
                onClick={() => setSessionIndex(sessionIndex - 1)}
                style={{
                  background: "none",
                  border: "none",
                  color: canNext ? "var(--accent)" : "var(--text-muted)",
                  cursor: canNext ? "pointer" : "default",
                  padding: 4,
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Quick stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "0 20px 16px" }}>
              <StatCard label={t("insights.sets")} value={String(analysis.totalSets)} delta={analysis.vsAvg.sets} />
              <StatCard
                label={t("insights.volume")}
                value={analysis.totalVolume >= 1000
                  ? `${(analysis.totalVolume / 1000).toFixed(1)}`
                  : String(analysis.totalVolume)}
                unit={analysis.totalVolume >= 1000 ? "ton" : "kg"}
                delta={analysis.vsAvg.volume}
              />
              <StatCard label="RPE" value={analysis.avgRpe > 0 ? analysis.avgRpe.toFixed(1) : "—"} />
              <StatCard
                label={t("insights.duration")}
                value={analysis.duration > 0 ? String(analysis.duration) : "—"}
                unit="min"
                delta={analysis.vsAvg.duration}
              />
            </div>

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <div style={{ padding: "0 20px 20px" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} color="var(--accent)" />
                  {t("insights.insightsTitle")}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {analysis.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            {analysis.insights.length === 0 && (
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>✅</div>
                  <div style={{ fontWeight: 600, marginTop: 6 }}>{t("insights.noInsights")}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{t("insights.noInsightsDetail")}</div>
                </div>
              </div>
            )}

            {/* Day patterns */}
            <div style={{ padding: "0 20px" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={16} color="var(--accent)" />
                {t("insights.patterns")}
              </h2>
              <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {patterns.map((p) => (
                  <DayBar key={p.dayName} pattern={p} maxSets={Math.max(...patterns.map((pp) => pp.avgSets), 1)} />
                ))}
              </div>
              {patterns.find((p) => p.isBestDay && p.sessionCount > 0) && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
                  🏆 {t("insights.bestDay")}: <strong>{patterns.find((p) => p.isBestDay)?.dayName}</strong>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
