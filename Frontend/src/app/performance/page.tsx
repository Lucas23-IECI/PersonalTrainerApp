"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Dumbbell,
  Heart,
  Scale,
  Zap,
  ChevronRight,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  getPerformanceScore,
  getPerformanceComparison,
  getLevelInfo,
  type PerformancePeriod,
  type PerformanceScore,
  type PerformanceComparison,
} from "@/lib/performance-score";

const PERIODS: { value: PerformancePeriod; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "all", label: "Todo" },
];

const BREAKDOWN_META: { key: keyof PerformanceScore["breakdown"]; label: string; icon: typeof Flame; color: string }[] = [
  { key: "consistency", label: "Consistencia", icon: Flame, color: "#FF9500" },
  { key: "strength", label: "Fuerza", icon: Dumbbell, color: "#0A84FF" },
  { key: "volumeEff", label: "Volumen", icon: Zap, color: "#AF52DE" },
  { key: "recovery", label: "Recuperación", icon: Heart, color: "#34C759" },
  { key: "balance", label: "Balance", icon: Scale, color: "#FF375F" },
];

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#34C759" : score >= 60 ? "#FF9500" : score >= 40 ? "#FFD60A" : "#FF3B30";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--card-bg)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function BreakdownBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--card-bg)" }}>
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          borderRadius: 4,
          background: color,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

export default function PerformancePage() {
  const [period, setPeriod] = useState<PerformancePeriod>("month");
  const [score, setScore] = useState<PerformanceScore | null>(null);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);

  useEffect(() => {
    setScore(getPerformanceScore(period));
    setComparison(getPerformanceComparison(period));
  }, [period]);

  if (!score) return null;

  const levelInfo = getLevelInfo(score.level);
  const TrendIcon = score.trend === "improving" ? TrendingUp : score.trend === "declining" ? TrendingDown : Minus;
  const trendColor = score.trend === "improving" ? "#34C759" : score.trend === "declining" ? "#FF3B30" : "var(--text-muted)";

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
              <Gauge size={20} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {t("perf.title")}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{t("perf.subtitle")}</p>
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", gap: 8, padding: "12px 20px" }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 10,
                border: "none",
                background: period === p.value ? "var(--accent)" : "var(--card-bg)",
                color: period === p.value ? "#fff" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Main score ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px" }}>
          <div style={{ position: "relative" }}>
            <ScoreRing score={score.overall} />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{score.overall}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>/ 100</div>
            </div>
          </div>

          {/* Level badge */}
          <div
            style={{
              marginTop: 12,
              padding: "6px 16px",
              borderRadius: 20,
              background: `${levelInfo.color}20`,
              border: `1px solid ${levelInfo.color}40`,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 18 }}>{levelInfo.emoji}</span>
            <span style={{ fontWeight: 700, color: levelInfo.color, fontSize: 15 }}>{levelInfo.label}</span>
          </div>

          {/* Trend */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, color: trendColor, fontSize: 13 }}>
            <TrendIcon size={16} />
            <span>
              {score.trend === "improving" ? t("perf.improving") : score.trend === "declining" ? t("perf.declining") : t("perf.stable")}
            </span>
            {comparison && comparison.delta !== 0 && (
              <span style={{ fontWeight: 700 }}>
                ({comparison.delta > 0 ? "+" : ""}{comparison.delta})
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 20px 16px" }}>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{score.streakDays}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("perf.streak")}</div>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{score.totalSessions}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("perf.sessions")}</div>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{score.periodLabel.split(" ")[1] || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("perf.period")}</div>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ padding: "0 20px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t("perf.breakdown")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {BREAKDOWN_META.map(({ key, label, icon: Icon, color }) => (
              <div key={key} style={{ background: "var(--card-bg)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon size={16} color={color} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 16, color }}>{score.breakdown[key]}</span>
                </div>
                <BreakdownBar value={score.breakdown[key]} color={color} />
              </div>
            ))}
          </div>
        </div>

        {/* Level progress */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t("perf.nextLevel")}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{levelInfo.next}</div>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          </div>
        </div>

        {/* Period comparison */}
        {comparison && comparison.previous.totalSessions > 0 && (
          <div style={{ padding: "16px 20px 0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t("perf.comparison")}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{t("perf.previous")}</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{comparison.previous.overall}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{comparison.previous.totalSessions} sesiones</div>
              </div>
              <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{t("perf.current")}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: comparison.delta >= 0 ? "#34C759" : "#FF3B30" }}>
                  {comparison.current.overall}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{comparison.current.totalSessions} sesiones</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
