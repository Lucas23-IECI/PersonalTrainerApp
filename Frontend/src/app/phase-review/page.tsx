"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarRange,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import { PHASES } from "@/data/phases";
import {
  getPhaseRetrospective,
  getPhasesOverview,
  type PhaseRetrospective,
} from "@/lib/phase-retrospective";

function BarStat({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 80, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 16, borderRadius: 6, background: "var(--card-bg)", position: "relative" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 6,
            background: color,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ width: 40, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function WeekRow({ week, maxVol }: { week: PhaseRetrospective["weeks"][0]; maxVol: number }) {
  const pct = maxVol > 0 ? (week.totalVolume / maxVol) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
      <span style={{ width: 50, fontSize: 12, fontWeight: 600 }}>Sem {week.weekNum}</span>
      <div style={{ flex: 1, height: 14, borderRadius: 5, background: "var(--card-bg)" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: "var(--accent)" }} />
      </div>
      <span style={{ width: 30, fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>{week.sessions}x</span>
      <span style={{ width: 50, fontSize: 11, fontWeight: 600, textAlign: "right" }}>
        {week.avgRpe > 0 ? `RPE ${week.avgRpe}` : "—"}
      </span>
    </div>
  );
}

export default function PhaseReviewPage() {
  const [selectedPhase, setSelectedPhase] = useState<number | undefined>(undefined);
  const [retro, setRetro] = useState<PhaseRetrospective | null>(null);
  const [overview, setOverview] = useState<ReturnType<typeof getPhasesOverview>>([]);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    setOverview(getPhasesOverview());
    setRetro(getPhaseRetrospective(selectedPhase));
  }, [selectedPhase]);

  if (!retro) return null;

  const rpeTrendIcon = retro.rpeTrend === "ascending" ? TrendingUp : retro.rpeTrend === "descending" ? TrendingDown : Minus;
  const RpeTrendIcon = rpeTrendIcon;
  const rpeTrendColor = retro.rpeTrend === "ascending" ? "#FF9500" : retro.rpeTrend === "descending" ? "#34C759" : "var(--text-muted)";
  const maxWeekVol = Math.max(...retro.weeks.map((w) => w.totalVolume), 1);
  const maxMuscleSets = retro.muscleBreakdown.length > 0 ? retro.muscleBreakdown[0].totalSets : 1;

  return (
    <PageTransition>
      <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "0 0 100px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 8px" }}>
          <Link href="/" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={24} />
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              <CalendarRange size={20} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {t("phaseReview.title")}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{t("phaseReview.subtitle")}</p>
          </div>
        </div>

        {/* Phase selector */}
        <div style={{ padding: "8px 20px 12px" }}>
          <button
            onClick={() => setShowSelector(!showSelector)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "var(--card-bg)",
              color: "var(--text)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {retro.phase.name}
              {retro.isComplete && " ✅"}
              {!retro.isComplete && ` (Sem ${retro.weekCurrent}/${retro.weekTotal})`}
            </span>
            <ChevronDown size={18} color="var(--text-muted)" style={{ transform: showSelector ? "rotate(180deg)" : "none" }} />
          </button>

          {showSelector && (
            <div style={{ marginTop: 4, background: "var(--card-bg)", borderRadius: 12, overflow: "hidden" }}>
              {overview.map((o) => (
                <button
                  key={o.phase.id}
                  onClick={() => {
                    setSelectedPhase(o.phase.id);
                    setShowSelector(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: o.isActive ? "var(--accent)10" : "transparent",
                    color: o.isFuture ? "var(--text-muted)" : "var(--text)",
                    fontSize: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{o.phase.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {o.sessions > 0 ? `${o.sessions} sesiones` : o.isFuture ? "Próxima" : "Sin datos"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 20px 16px" }}>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{retro.totalSessions}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("phaseReview.sessions")}</div>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{retro.sessionsPerWeek}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("phaseReview.perWeek")}</div>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{retro.avgRpe || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>RPE avg</div>
          </div>
        </div>

        {/* Volume stats */}
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{retro.totalSets}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Sets totales</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {retro.totalVolume >= 1000 ? `${(retro.totalVolume / 1000).toFixed(0)}k` : retro.totalVolume}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Vol. total (kg)</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{retro.avgSetsPerSession}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Sets/sesión</div>
            </div>
          </div>
        </div>

        {/* RPE trend */}
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("phaseReview.rpeTrend")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <RpeTrendIcon size={18} color={rpeTrendColor} />
                <span style={{ fontWeight: 700, color: rpeTrendColor }}>
                  {retro.rpeTrend === "ascending" ? "Subiendo" : retro.rpeTrend === "descending" ? "Bajando" : "Estable"}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("phaseReview.fatigue")}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: retro.currentFatigue > 60 ? "#FF3B30" : retro.currentFatigue > 35 ? "#FF9500" : "#34C759" }}>
                {retro.currentFatigue}%
              </div>
            </div>
          </div>
        </div>

        {/* Weekly breakdown */}
        <div style={{ padding: "0 20px 16px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t("phaseReview.weeklyBreakdown")}</h2>
          <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "12px 14px" }}>
            {retro.weeks.map((w) => (
              <WeekRow key={w.weekNum} week={w} maxVol={maxWeekVol} />
            ))}
          </div>
          {retro.bestWeek && retro.worstWeek && retro.bestWeek.weekNum !== retro.worstWeek.weekNum && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <div style={{ background: "#34C75915", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <Award size={16} color="#34C759" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#34C759" }}>{t("phaseReview.bestWeek")}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Sem {retro.bestWeek.weekNum} — {retro.bestWeek.sessions} sesiones</div>
                </div>
              </div>
              <div style={{ background: "#FF950015", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={16} color="#FF9500" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#FF9500" }}>{t("phaseReview.worstWeek")}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Sem {retro.worstWeek.weekNum} — {retro.worstWeek.sessions} sesiones</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Muscle breakdown */}
        {retro.muscleBreakdown.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t("phaseReview.muscleBreakdown")}</h2>
            <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              {retro.muscleBreakdown.slice(0, 10).map((m) => (
                <BarStat
                  key={m.muscle}
                  label={m.muscle}
                  value={m.totalSets}
                  maxValue={maxMuscleSets}
                  color="var(--accent)"
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div style={{ padding: "0 20px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Lightbulb size={16} color="#FFD60A" />
            {t("phaseReview.recommendations")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {retro.recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  background: "var(--card-bg)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 14,
                  lineHeight: 1.4,
                  borderLeft: "3px solid #FFD60A",
                }}
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
