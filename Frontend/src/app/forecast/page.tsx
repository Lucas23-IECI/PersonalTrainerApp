"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  Trophy,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  getPredictiveReport,
  type PredictiveReport,
  type ExerciseForecast,
} from "@/lib/predictive-analytics";

function StatusBadge({ status }: { status: ExerciseForecast["status"] }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    on_track: { bg: "#34C75920", color: "#34C759", label: t("forecast.onTrack") },
    ahead: { bg: "#0A84FF20", color: "#0A84FF", label: t("forecast.ahead") },
    behind: { bg: "#FF3B3020", color: "#FF3B30", label: t("forecast.behind") },
    stagnant: { bg: "#FF950020", color: "#FF9500", label: t("forecast.stagnant") },
    insufficient_data: { bg: "var(--card-bg)", color: "var(--text-muted)", label: "—" },
  };
  const c = config[status] || config.insufficient_data;

  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 8,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {c.label}
    </span>
  );
}

function MiniTrend({ points, forecast }: { points: { value: number }[]; forecast: { value: number }[] }) {
  const all = [...points.map((p) => p.value), ...forecast.map((p) => p.value)];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const w = 120;
  const h = 40;

  function toY(v: number) {
    return h - ((v - min) / range) * (h - 4) - 2;
  }

  const totalLen = points.length + forecast.length;
  const step = w / Math.max(1, totalLen - 1);

  const realPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${toY(p.value)}`).join(" ");
  const forecastPath = forecast
    .map((p, i) => {
      const x = (points.length + i) * step;
      return `${i === 0 && points.length > 0 ? `M${(points.length - 1) * step},${toY(points[points.length - 1].value)} L` : i === 0 ? "M" : "L"}${x},${toY(p.value)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <path d={realPath} fill="none" stroke="var(--accent)" strokeWidth={2} />
      <path d={forecastPath} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.5} />
    </svg>
  );
}

export default function ForecastPage() {
  const [report, setReport] = useState<PredictiveReport | null>(null);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  useEffect(() => {
    setReport(getPredictiveReport());
  }, []);

  if (!report) return null;

  const trendIcon = report.overallTrend === "improving" ? TrendingUp : report.overallTrend === "declining" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = report.overallTrend === "improving" ? "#34C759" : report.overallTrend === "declining" ? "#FF3B30" : "var(--text-muted)";

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
              <BarChart3 size={20} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {t("forecast.title")}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{t("forecast.subtitle")}</p>
          </div>
        </div>

        {/* Overall trend card */}
        <div style={{ margin: "12px 20px", background: "var(--card-bg)", borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("forecast.overallTrend")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <TrendIcon size={20} color={trendColor} />
                <span style={{ fontSize: 17, fontWeight: 700, color: trendColor }}>
                  {report.overallTrend === "improving" ? t("forecast.improving") : report.overallTrend === "declining" ? t("forecast.declining") : t("forecast.stableOverall")}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("forecast.weeklyVol")}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                {report.volumeTrend.avgSetsPerWeek} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>sets/sem</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {report.milestones.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Trophy size={16} color="#FFD60A" />
              {t("forecast.milestones")}
            </h2>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {report.milestones.slice(0, 5).map((m, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: 160,
                    background: "var(--card-bg)",
                    borderRadius: 12,
                    padding: "12px",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.exercise}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", marginTop: 2 }}>
                    {m.target}kg
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {m.weeksAway ? `~${m.weeksAway} semanas` : "Sin ETA"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercise forecasts */}
        <div style={{ padding: "0 20px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={16} color="var(--accent)" />
            {t("forecast.exercises")}
          </h2>

          {report.exercises.length === 0 && (
            <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
              {t("forecast.noData")}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {report.exercises.map((ex) => {
              const expanded = expandedEx === ex.exercise;
              return (
                <div
                  key={ex.exercise}
                  style={{ background: "var(--card-bg)", borderRadius: 12, overflow: "hidden" }}
                >
                  <button
                    onClick={() => setExpandedEx(expanded ? null : ex.exercise)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: "transparent",
                      border: "none",
                      color: "var(--text)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ex.exercise}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                            e1RM: <strong style={{ color: "var(--text)" }}>{Math.round(ex.currentE1rm)}kg</strong>
                          </span>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: ex.weeklyGain > 0 ? "#34C759" : ex.weeklyGain < 0 ? "#FF3B30" : "var(--text-muted)",
                          }}>
                            {ex.weeklyGain > 0 ? "+" : ""}{ex.weeklyGain}kg/sem
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusBadge status={ex.status} />
                        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{ex.statusLabel}</div>
                        <MiniTrend points={ex.trendLine.points} forecast={ex.trendLine.forecast} />
                      </div>
                      {ex.trendLine.r2 > 0 && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                          R² = {(ex.trendLine.r2 * 100).toFixed(0)}% — {ex.trendLine.r2 > 0.7 ? "tendencia confiable" : "mucha variación"}
                        </div>
                      )}
                      {ex.weeksToGoal && (
                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Target size={14} />
                          Meta {ex.goalWeight}kg en ~{ex.weeksToGoal} semanas
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
