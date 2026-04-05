"use client";

import React from "react";
import { MUSCLE_LABELS, type MuscleGroup } from "@/data/exercises";

/* ─── Props ─────────────────────────────────────────── */
interface BodyMapProps {
  muscleData: Record<string, { sets: number; volume: number }>;
  recoveryMap?: Record<string, { status: "fresh" | "recovered" | "recovering" | "fatigued" }>;
  mode: "sets" | "recovery";
  onSelectMuscle: (muscle: string) => void;
  selectedMuscle: string | null;
}

/* ─── Color helpers ─────────────────────────────────── */
function getSetsColor(sets: number): string {
  if (sets === 0) return "var(--bg-elevated, #1a1a2e)";
  const intensity = Math.min(sets / 20, 1);
  return `rgba(44, 107, 237, ${0.15 + intensity * 0.7})`;
}

function getRecoveryFill(status: string): string {
  const colors: Record<string, string> = {
    fresh: "rgba(10, 132, 255, 0.4)",
    recovered: "rgba(52, 199, 89, 0.4)",
    recovering: "rgba(255, 214, 10, 0.4)",
    fatigued: "rgba(255, 69, 58, 0.4)",
  };
  return colors[status] || "var(--bg-elevated, #1a1a2e)";
}

/* ─── Abbreviated labels for SVG ────────────────────── */
const SHORT_LABELS: Record<string, string> = {
  chest: "Pecho",
  front_delts: "D.Ant",
  side_delts: "D.Lat",
  rear_delts: "D.Post",
  triceps: "Tri",
  biceps: "Bi",
  forearms: "Anteb",
  upper_back: "Esp.A",
  lats: "Dors",
  lower_back: "Lumb",
  traps: "Trap",
  abs: "Abs",
  obliques: "Obl",
  quads: "Cuáds",
  hamstrings: "Isquio",
  glutes: "Glút",
  calves: "Pant",
  hip_flexors: "Flex.C",
  adductors: "Aduct",
};

/* ─── Zone definitions (frontal view) ───────────────── */
interface ZoneDef {
  muscle: MuscleGroup;
  label: string;
  labelX: number;
  labelY: number;
  shape: React.ReactElement;
}

const BODY_ZONES: ZoneDef[] = [
  /* Traps */
  { muscle: "traps", label: SHORT_LABELS.traps, labelX: 78, labelY: 86, shape: <ellipse cx={82} cy={82} rx={10} ry={5} /> },
  { muscle: "traps", label: "", labelX: 118, labelY: 86, shape: <ellipse cx={118} cy={82} rx={10} ry={5} /> },
  /* Shoulders — front delts */
  { muscle: "front_delts", label: SHORT_LABELS.front_delts, labelX: 62, labelY: 102, shape: <circle cx={66} cy={95} r={10} /> },
  { muscle: "front_delts", label: "", labelX: 138, labelY: 102, shape: <circle cx={134} cy={95} r={10} /> },
  /* Shoulders — side delts */
  { muscle: "side_delts", label: SHORT_LABELS.side_delts, labelX: 52, labelY: 93, shape: <circle cx={56} cy={90} r={7} /> },
  { muscle: "side_delts", label: "", labelX: 148, labelY: 93, shape: <circle cx={144} cy={90} r={7} /> },
  /* Chest */
  { muscle: "chest", label: SHORT_LABELS.chest, labelX: 100, labelY: 118, shape: <rect x={74} y={100} width={52} height={24} rx={8} /> },
  /* Upper back (slightly visible behind chest) */
  { muscle: "upper_back", label: SHORT_LABELS.upper_back, labelX: 100, labelY: 98, shape: <rect x={78} y={97} width={44} height={14} rx={4} opacity={0.5} /> },
  /* Biceps */
  { muscle: "biceps", label: SHORT_LABELS.biceps, labelX: 52, labelY: 130, shape: <rect x={48} y={108} width={14} height={30} rx={5} /> },
  { muscle: "biceps", label: "", labelX: 148, labelY: 130, shape: <rect x={138} y={108} width={14} height={30} rx={5} /> },
  /* Triceps */
  { muscle: "triceps", label: SHORT_LABELS.triceps, labelX: 44, labelY: 120, shape: <rect x={42} y={108} width={8} height={28} rx={3} opacity={0.7} /> },
  { muscle: "triceps", label: "", labelX: 156, labelY: 120, shape: <rect x={150} y={108} width={8} height={28} rx={3} opacity={0.7} /> },
  /* Forearms */
  { muscle: "forearms", label: SHORT_LABELS.forearms, labelX: 46, labelY: 160, shape: <rect x={44} y={140} width={12} height={30} rx={4} /> },
  { muscle: "forearms", label: "", labelX: 154, labelY: 160, shape: <rect x={144} y={140} width={12} height={30} rx={4} /> },
  /* Abs */
  { muscle: "abs", label: SHORT_LABELS.abs, labelX: 100, labelY: 150, shape: <rect x={86} y={126} width={28} height={38} rx={4} /> },
  /* Obliques */
  { muscle: "obliques", label: SHORT_LABELS.obliques, labelX: 74, labelY: 148, shape: <rect x={76} y={130} width={10} height={30} rx={3} /> },
  { muscle: "obliques", label: "", labelX: 126, labelY: 148, shape: <rect x={114} y={130} width={10} height={30} rx={3} /> },
  /* Lats */
  { muscle: "lats", label: SHORT_LABELS.lats, labelX: 70, labelY: 125, shape: <path d="M74,105 L68,130 L76,130 Z" /> },
  { muscle: "lats", label: "", labelX: 130, labelY: 125, shape: <path d="M126,105 L132,130 L124,130 Z" /> },
  /* Lower back */
  { muscle: "lower_back", label: SHORT_LABELS.lower_back, labelX: 100, labelY: 172, shape: <rect x={88} y={164} width={24} height={14} rx={4} opacity={0.45} /> },
  /* Rear delts (slightly behind) */
  { muscle: "rear_delts", label: SHORT_LABELS.rear_delts, labelX: 66, labelY: 90, shape: <circle cx={66} cy={88} r={5} opacity={0.4} /> },
  { muscle: "rear_delts", label: "", labelX: 134, labelY: 90, shape: <circle cx={134} cy={88} r={5} opacity={0.4} /> },
  /* Glutes */
  { muscle: "glutes", label: SHORT_LABELS.glutes, labelX: 100, labelY: 192, shape: <ellipse cx={90} cy={186} rx={12} ry={10} /> },
  { muscle: "glutes", label: "", labelX: 100, labelY: 192, shape: <ellipse cx={110} cy={186} rx={12} ry={10} /> },
  /* Hip flexors */
  { muscle: "hip_flexors", label: SHORT_LABELS.hip_flexors, labelX: 86, labelY: 200, shape: <rect x={82} y={178} width={10} height={12} rx={3} /> },
  { muscle: "hip_flexors", label: "", labelX: 114, labelY: 200, shape: <rect x={108} y={178} width={10} height={12} rx={3} /> },
  /* Quads */
  { muscle: "quads", label: SHORT_LABELS.quads, labelX: 86, labelY: 240, shape: <rect x={76} y={200} width={20} height={58} rx={6} /> },
  { muscle: "quads", label: "", labelX: 114, labelY: 240, shape: <rect x={104} y={200} width={20} height={58} rx={6} /> },
  /* Hamstrings (behind quads) */
  { muscle: "hamstrings", label: SHORT_LABELS.hamstrings, labelX: 86, labelY: 236, shape: <rect x={78} y={210} width={16} height={44} rx={5} opacity={0.35} /> },
  { muscle: "hamstrings", label: "", labelX: 114, labelY: 236, shape: <rect x={106} y={210} width={16} height={44} rx={5} opacity={0.35} /> },
  /* Adductors */
  { muscle: "adductors", label: SHORT_LABELS.adductors, labelX: 96, labelY: 225, shape: <rect x={94} y={204} width={6} height={34} rx={2} /> },
  { muscle: "adductors", label: "", labelX: 104, labelY: 225, shape: <rect x={100} y={204} width={6} height={34} rx={2} /> },
  /* Calves */
  { muscle: "calves", label: SHORT_LABELS.calves, labelX: 84, labelY: 310, shape: <rect x={78} y={268} width={16} height={44} rx={5} /> },
  { muscle: "calves", label: "", labelX: 116, labelY: 310, shape: <rect x={106} y={268} width={16} height={44} rx={5} /> },
];

/* ─── Legend components ──────────────────────────────── */
function SetsLegend() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 8 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>0</span>
      <div
        style={{
          width: 120,
          height: 10,
          borderRadius: 5,
          background: "linear-gradient(to right, rgba(44,107,237,0.15), rgba(44,107,237,0.85))",
        }}
      />
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>20+ sets</span>
    </div>
  );
}

const RECOVERY_LEGEND: { key: string; color: string; label: string }[] = [
  { key: "fresh", color: "rgba(10, 132, 255, 0.7)", label: "Descansado" },
  { key: "recovered", color: "rgba(52, 199, 89, 0.7)", label: "Recuperado" },
  { key: "recovering", color: "rgba(255, 214, 10, 0.7)", label: "Recuperando" },
  { key: "fatigued", color: "rgba(255, 69, 58, 0.7)", label: "Fatigado" },
];

function RecoveryLegend() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 8 }}>
      {RECOVERY_LEGEND.map((r) => (
        <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ────────────────────────────────── */
export default function BodyMap({ muscleData, recoveryMap, mode, onSelectMuscle, selectedMuscle }: BodyMapProps) {
  const getFill = (muscle: MuscleGroup): string => {
    if (mode === "recovery" && recoveryMap?.[muscle]) {
      return getRecoveryFill(recoveryMap[muscle].status);
    }
    const sets = muscleData[muscle]?.sets ?? 0;
    return getSetsColor(sets);
  };

  const isSelected = (muscle: MuscleGroup) => selectedMuscle === muscle;

  return (
    <div style={{ maxWidth: 320, margin: "0 auto", textAlign: "center" }}>
      <svg
        viewBox="0 0 200 380"
        width="100%"
        style={{ maxHeight: 480 }}
        aria-label="Mapa corporal de músculos"
      >
        {/* Body silhouette outline */}
        <g opacity={0.12} fill="var(--text, #ccc)" stroke="none">
          {/* Head */}
          <circle cx={100} cy={36} r={22} />
          {/* Neck */}
          <rect x={93} y={56} width={14} height={14} rx={4} />
          {/* Torso */}
          <rect x={68} y={70} width={64} height={108} rx={14} />
          {/* Arms */}
          <rect x={42} y={86} width={18} height={88} rx={7} />
          <rect x={140} y={86} width={18} height={88} rx={7} />
          {/* Legs */}
          <rect x={74} y={178} width={24} height={140} rx={8} />
          <rect x={102} y={178} width={24} height={140} rx={8} />
          {/* Feet */}
          <ellipse cx={86} cy={326} rx={14} ry={6} />
          <ellipse cx={114} cy={326} rx={14} ry={6} />
        </g>

        {/* Muscle zones */}
        {BODY_ZONES.map((zone, i) => {
          const fill = getFill(zone.muscle);
          const selected = isSelected(zone.muscle);
          return (
            <g
              key={`${zone.muscle}-${i}`}
              onClick={() => onSelectMuscle(zone.muscle)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={MUSCLE_LABELS[zone.muscle]}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onSelectMuscle(zone.muscle); }}
            >
              {React.cloneElement(zone.shape as React.ReactElement<React.SVGProps<SVGElement>>, {
                fill,
                stroke: selected ? "var(--accent, #2c6bed)" : "rgba(255,255,255,0.08)",
                strokeWidth: selected ? 2 : 0.5,
              })}
              {zone.label && (
                <text
                  x={zone.labelX}
                  y={zone.labelY}
                  textAnchor="middle"
                  fontSize={6}
                  fill="var(--text-muted, #888)"
                  pointerEvents="none"
                >
                  {zone.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {mode === "sets" ? <SetsLegend /> : <RecoveryLegend />}
    </div>
  );
}
