"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Activity,
  Zap,
  Info,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  getReadinessReport,
  getZoneColor,
  getZoneLabel,
  getACWRZoneColor,
  type ReadinessReport,
  type ReadinessZone,
  type ReadinessSignal,
  type ACWRData,
} from "@/lib/training-readiness";

// ── Zone visual config ──

const ZONE_CONFIG: Record<ReadinessZone, { emoji: string; gradient: string; bg: string }> = {
  green: {
    emoji: "🟢",
    gradient: "linear-gradient(135deg, #34C759 0%, #248A3D 100%)",
    bg: "rgba(52,199,89,0.1)",
  },
  yellow: {
    emoji: "🟡",
    gradient: "linear-gradient(135deg, #FFD60A 0%, #E6B800 100%)",
    bg: "rgba(255,214,10,0.1)",
  },
  orange: {
    emoji: "🟠",
    gradient: "linear-gradient(135deg, #FF9500 0%, #CC7700 100%)",
    bg: "rgba(255,149,0,0.1)",
  },
  red: {
    emoji: "🔴",
    gradient: "linear-gradient(135deg, #FF3B30 0%, #CC2F26 100%)",
    bg: "rgba(255,59,48,0.1)",
  },
};

// ── Score Ring (donut chart) ──

function ReadinessRing({ score, zone, size = 180 }: { score: number; zone: ReadinessZone; size?: number }) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getZoneColor(zone);

  // Background segments for visual reference
  const segmentColors = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759"];
  const segmentSize = circumference / 4;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring with zone segments */}
        {segmentColors.map((c, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={c}
            strokeWidth={stroke - 8}
            strokeOpacity={0.15}
            strokeDasharray={`${segmentSize * 0.92} ${circumference - segmentSize * 0.92}`}
            strokeDashoffset={-(segmentSize * i)}
          />
        ))}
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
          strokeOpacity={0.3}
        />
        {/* Active arc */}
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
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: "var(--text)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginTop: 2,
          }}
        >
          {getZoneLabel(zone)}
        </span>
      </div>
    </div>
  );
}

// ── Breakdown Bar ──

function BreakdownBar({
  label,
  value,
  max,
  color,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}) {
  const pct = Math.round((value / max) * 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}/{max}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-elevated)" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 3,
              width: `${pct}%`,
              background: color,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── ACWR Gauge ──

function ACWRGauge({ data }: { data: ACWRData }) {
  // Map ratio to position (0.4 to 2.0 range → 0-100%)
  const minR = 0.4;
  const maxR = 2.0;
  const position = Math.max(0, Math.min(100, ((data.ratio - minR) / (maxR - minR)) * 100));

  const zoneLabels: Record<ACWRData["zone"], string> = {
    undertrained: "Infraentrenamiento",
    sweet_spot: "Zona Óptima",
    caution: "Precaución",
    danger: "Peligro de Lesión",
  };

  return (
    <div>
      {/* Gauge track */}
      <div style={{ position: "relative", height: 28, borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
        {/* Zone segments */}
        <div style={{ display: "flex", height: "100%", borderRadius: 14 }}>
          <div style={{ flex: 25, background: "rgba(79,140,255,0.25)" }} />
          <div style={{ flex: 31.25, background: "rgba(52,199,89,0.25)" }} />
          <div style={{ flex: 12.5, background: "rgba(255,149,0,0.25)" }} />
          <div style={{ flex: 31.25, background: "rgba(255,59,48,0.2)" }} />
        </div>
        {/* Pointer */}
        <div
          style={{
            position: "absolute",
            top: 2,
            left: `calc(${position}% - 12px)`,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: getACWRZoneColor(data.zone),
            border: "3px solid var(--bg-card)",
            boxShadow: `0 2px 8px ${getACWRZoneColor(data.zone)}60`,
            transition: "left 0.6s ease",
          }}
        />
      </div>
      {/* Labels under gauge */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>0.4</span>
        <span style={{ fontSize: 10, color: "#4F8CFF" }}>0.8</span>
        <span style={{ fontSize: 10, color: "#34C759", fontWeight: 600 }}>1.0</span>
        <span style={{ fontSize: 10, color: "#FF9500" }}>1.3</span>
        <span style={{ fontSize: 10, color: "#FF3B30" }}>1.5</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>2.0</span>
      </div>
      {/* Zone label and ratio */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: getACWRZoneColor(data.zone),
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: getACWRZoneColor(data.zone) }}>
            {zoneLabels[data.zone]}
          </span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
          {data.ratio.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ── Weekly Load Mini Chart ──

function WeeklyLoadChart({ loads }: { loads: ACWRData["weeklyLoads"] }) {
  if (loads.length === 0) return null;
  const maxLoad = Math.max(...loads.map((w) => w.load), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60, paddingTop: 8 }}>
      {loads.map((week, i) => {
        const height = Math.max(4, (week.load / maxLoad) * 52);
        const isLast = i === loads.length - 1;
        return (
          <div key={week.weekStart} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: "100%",
                height,
                borderRadius: 4,
                background: isLast ? "var(--accent)" : "var(--bg-elevated)",
                transition: "height 0.4s ease",
                opacity: isLast ? 1 : 0.6,
              }}
            />
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
              S{i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Signal Row ──

function SignalRow({ signal }: { signal: ReadinessSignal }) {
  const impactColor = signal.impact === "positive" ? "#34C759" : signal.impact === "negative" ? "#FF3B30" : "var(--text-secondary)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{signal.icon}</span>
        <span style={{ fontSize: 13, color: "var(--text)" }}>{signal.label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: impactColor }}>{signal.value}</span>
    </div>
  );
}

// ── Readiness History Mini Sparkline ──

function ReadinessSparkline({ history }: { history: { date: string; score: number }[] }) {
  if (history.length < 2) return null;
  const w = 280;
  const h = 48;
  const padX = 4;
  const padY = 4;

  const min = Math.min(...history.map((h) => h.score));
  const max = Math.max(...history.map((h) => h.score));
  const range = max - min || 1;

  const points = history.map((p, i) => {
    const x = padX + (i / (history.length - 1)) * (w - padX * 2);
    const y = padY + (1 - (p.score - min) / range) * (h - padY * 2);
    return `${x},${y}`;
  });

  const lastPoint = history[history.length - 1];
  const lastX = padX + ((history.length - 1) / (history.length - 1)) * (w - padX * 2);
  const lastY = padY + (1 - (lastPoint.score - min) / range) * (h - padY * 2);

  const zoneColor = lastPoint.score >= 65 ? "#34C759" : lastPoint.score >= 50 ? "#FFD60A" : lastPoint.score >= 35 ? "#FF9500" : "#FF3B30";

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* Zone threshold lines */}
      {[35, 50, 65].map((threshold) => {
        const y = padY + (1 - (threshold - min) / range) * (h - padY * 2);
        return y > padY && y < h - padY ? (
          <line
            key={threshold}
            x1={0}
            x2={w}
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        ) : null;
      })}
      {/* Line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={zoneColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current point */}
      <circle cx={lastX} cy={lastY} r={4} fill={zoneColor} />
    </svg>
  );
}

// ── Main Page ──

export default function ReadinessPage() {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [showAllSignals, setShowAllSignals] = useState(false);

  useEffect(() => {
    setReport(getReadinessReport());
  }, []);

  if (!report) return null;

  const zoneConfig = ZONE_CONFIG[report.zone];
  const { recommendation, acwr, breakdown, signals, history } = report;

  const breakdownItems = [
    { label: t("readiness.sleep"), value: breakdown.sleep, max: 25, color: "#AF52DE", icon: "🛏️" },
    { label: t("readiness.recovery"), value: breakdown.recovery, max: 25, color: "#34C759", icon: "💪" },
    { label: t("readiness.fatigue"), value: breakdown.fatigue, max: 25, color: "#FF9500", icon: "🔋" },
    { label: t("readiness.wellness"), value: breakdown.wellness, max: 25, color: "#4F8CFF", icon: "⚡" },
  ];

  // Visible signals (first 4 or all)
  const visibleSignals = showAllSignals ? signals : signals.slice(0, 5);

  return (
    <PageTransition>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "16px 16px 120px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Link href="/" style={{ color: "var(--accent)", display: "flex" }}>
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              {t("readiness.title")}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              {t("readiness.subtitle")}
            </p>
          </div>
        </div>

        {/* Checkin reminder */}
        {!report.todayCheckin && (
          <Link href="/health" style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(255,149,0,0.1)",
                border: "1px solid rgba(255,149,0,0.2)",
                marginBottom: 16,
              }}
            >
              <Info size={16} color="#FF9500" />
              <span style={{ fontSize: 13, color: "#FF9500", fontWeight: 500, flex: 1 }}>
                {t("readiness.checkinReminder")}
              </span>
              <ChevronRight size={16} color="#FF9500" />
            </div>
          </Link>
        )}

        {/* Hero Score Card */}
        <div
          style={{
            borderRadius: 20,
            padding: "28px 20px 24px",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <ReadinessRing score={report.score} zone={report.zone} />

          {/* Recommendation headline */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 12,
              background: zoneConfig.bg,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>{zoneConfig.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: getZoneColor(report.zone) }}>
              {recommendation.headline}
            </span>
          </div>

          {/* Recommendation detail */}
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "12px 0 0", lineHeight: 1.5, maxWidth: 320 }}>
            {recommendation.detail}
          </p>
        </div>

        {/* Quick Modifiers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              borderRadius: 14,
              padding: "14px 10px",
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-card)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500, letterSpacing: "0.02em" }}>
              {t("readiness.volume")}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: recommendation.volumeModifier >= 0.95 ? "#34C759" : recommendation.volumeModifier >= 0.8 ? "#FF9500" : "#FF3B30" }}>
              {Math.round(recommendation.volumeModifier * 100)}%
            </div>
          </div>
          <div
            style={{
              borderRadius: 14,
              padding: "14px 10px",
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-card)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500, letterSpacing: "0.02em" }}>
              {t("readiness.intensity")}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: recommendation.intensityModifier >= 0.95 ? "#34C759" : recommendation.intensityModifier >= 0.8 ? "#FF9500" : "#FF3B30" }}>
              {Math.round(recommendation.intensityModifier * 100)}%
            </div>
          </div>
          <div
            style={{
              borderRadius: 14,
              padding: "14px 10px",
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-card)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500, letterSpacing: "0.02em" }}>
              RPE
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
              {recommendation.rpeTarget}
            </div>
          </div>
        </div>

        {/* Focus suggestion */}
        <div
          style={{
            borderRadius: 14,
            padding: "14px 16px",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: zoneConfig.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={18} color={getZoneColor(report.zone)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.02em" }}>
              {t("readiness.focus")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              {recommendation.suggestedFocus}
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div
          style={{
            borderRadius: 16,
            padding: "16px 16px 8px",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            {t("readiness.breakdown")}
          </div>
          {breakdownItems.map((item) => (
            <BreakdownBar key={item.label} {...item} />
          ))}
        </div>

        {/* ACWR Section */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} color="var(--accent)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t("readiness.acwr")}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {acwr.trend === "increasing" && <TrendingUp size={14} color="#34C759" />}
              {acwr.trend === "decreasing" && <TrendingDown size={14} color="#FF3B30" />}
              {acwr.trend === "stable" && <Minus size={14} color="var(--text-muted)" />}
            </div>
          </div>
          <ACWRGauge data={acwr} />

          {/* Weekly volume bars */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500 }}>
              {t("readiness.weeklyLoad")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {t("readiness.acute")}: {(acwr.acuteLoad / 1000).toFixed(0)}k
              </span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {t("readiness.chronic")}: {(acwr.chronicLoad / 1000).toFixed(0)}k
              </span>
            </div>
            <WeeklyLoadChart loads={acwr.weeklyLoads} />
          </div>
        </div>

        {/* Trend History */}
        {history.length >= 2 && (
          <div
            style={{
              borderRadius: 16,
              padding: 16,
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-card)",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              {t("readiness.trend")}
            </div>
            <ReadinessSparkline history={history} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {history[0]?.date.slice(5)}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {history[history.length - 1]?.date.slice(5)}
              </span>
            </div>
          </div>
        )}

        {/* All Signals */}
        <div
          style={{
            borderRadius: 16,
            padding: "16px 16px 8px",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            {t("readiness.signals")}
          </div>
          {visibleSignals.map((signal, i) => (
            <SignalRow key={i} signal={signal} />
          ))}
          {signals.length > 5 && (
            <button
              onClick={() => setShowAllSignals(!showAllSignals)}
              style={{
                width: "100%",
                padding: "10px 0",
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {showAllSignals ? t("readiness.showLess") : t("readiness.showAll")}
            </button>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            {t("readiness.howItWorks")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["green", "yellow", "orange", "red"] as ReadinessZone[]).map((z) => (
              <div key={z} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: getZoneColor(z),
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {z === "green" && "65-100: Entrenamiento completo, podés empujar"}
                  {z === "yellow" && "50-64: Moderá intensidad, priorizá técnica"}
                  {z === "orange" && "35-49: Sesión ligera o accesorios"}
                  {z === "red" && "0-34: Descanso activo, movilidad"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
