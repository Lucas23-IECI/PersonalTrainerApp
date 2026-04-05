"use client";

import { useEffect, useState } from "react";
import { type MuscleGroup } from "@/data/exercises";

// ── Region definitions ──
export type MuscleRegion = "espalda" | "pecho" | "core" | "piernas" | "brazos" | "hombros";

export const REGION_LABELS: Record<MuscleRegion, string> = {
  espalda: "Espalda",
  pecho: "Pecho",
  core: "Core",
  piernas: "Piernas",
  brazos: "Brazos",
  hombros: "Hombros",
};

export const REGION_MUSCLES: Record<MuscleRegion, MuscleGroup[]> = {
  espalda: ["upper_back", "lats", "traps", "lower_back"],
  pecho: ["chest"],
  core: ["abs", "obliques"],
  piernas: ["quads", "hamstrings", "glutes", "calves", "adductors", "hip_flexors"],
  brazos: ["biceps", "triceps", "forearms"],
  hombros: ["front_delts", "side_delts", "rear_delts"],
};

const REGIONS: MuscleRegion[] = ["espalda", "pecho", "core", "piernas", "brazos", "hombros"];

const RECOVERY_COLORS: Record<string, string> = {
  fresh: "#0A84FF",
  recovered: "#34C759",
  recovering: "#FFD60A",
  fatigued: "#FF453A",
};

const RECOVERY_PRIORITY: Record<string, number> = { fresh: 0, recovered: 1, recovering: 2, fatigued: 3 };

// ── Helpers ──
export function getRegionSets(region: MuscleRegion, data: Record<string, { sets: number }>): number {
  return REGION_MUSCLES[region].reduce((sum, m) => sum + (data[m]?.sets || 0), 0);
}

export function getRegionVolume(region: MuscleRegion, data: Record<string, { volume: number }>): number {
  return REGION_MUSCLES[region].reduce((sum, m) => sum + (data[m]?.volume || 0), 0);
}

export function getRegionHits(region: MuscleRegion, muscleHits: Record<string, number>): number {
  return REGION_MUSCLES[region].reduce((sum, m) => sum + (muscleHits[m] || 0), 0);
}

function getRegionRecovery(
  region: MuscleRegion,
  recoveryMap: Record<string, { status: "fresh" | "recovered" | "recovering" | "fatigued" }>,
): string {
  let worst = "fresh";
  for (const m of REGION_MUSCLES[region]) {
    const s = recoveryMap[m]?.status ?? "fresh";
    if (RECOVERY_PRIORITY[s] > RECOVERY_PRIORITY[worst]) worst = s;
  }
  return worst;
}

// ── Geometry ──
function pointAt(index: number, ratio: number, cx: number, cy: number, r: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return [cx + r * ratio * Math.cos(angle), cy + r * ratio * Math.sin(angle)];
}

function toPath(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
}

// ── Props ──
interface MuscleRadarProps {
  muscleData: Record<string, { sets: number; volume: number }>;
  recoveryMap?: Record<string, { status: "fresh" | "recovered" | "recovering" | "fatigued" }>;
  mode: "sets" | "volume";
  selectedRegion: MuscleRegion | null;
  onSelectRegion: (region: MuscleRegion) => void;
}

export default function MuscleRadar({ muscleData, recoveryMap, mode, selectedRegion, onSelectRegion }: MuscleRadarProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const r = 110;
  const levels = 5;

  const regionValues = REGIONS.map((reg) =>
    mode === "sets" ? getRegionSets(reg, muscleData) : getRegionVolume(reg, muscleData),
  );
  const maxVal = mode === "sets" ? 30 : Math.max(...regionValues, 1);
  const ratios = regionValues.map((v) => Math.min(v / maxVal, 1));
  const dataPoints = ratios.map((v, i) => pointAt(i, Math.max(v, 0.04), cx, cy, r));

  const regionRecovery = REGIONS.map((reg) => (recoveryMap ? getRegionRecovery(reg, recoveryMap) : null));

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] aspect-square">
        {/* Grid levels */}
        {Array.from({ length: levels }, (_, lvl) => {
          const ratio = (lvl + 1) / levels;
          const pts = REGIONS.map((_, i) => pointAt(i, ratio, cx, cy, r));
          return (
            <polygon
              key={`grid-${lvl}`}
              points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}
              fill="none"
              stroke="var(--border)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Axis lines */}
        {REGIONS.map((_, i) => {
          const [x, y] = pointAt(i, 1, cx, cy, r);
          return <line key={`axis-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={0.6} />;
        })}

        {/* Data polygon */}
        <path
          d={toPath(dataPoints)}
          fill="var(--radar-fill, rgba(44,107,237,0.15))"
          stroke="var(--accent)"
          strokeWidth={2}
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-in" }}
        />

        {/* Data dots — colored by recovery */}
        {dataPoints.map(([x, y], i) => {
          const rec = regionRecovery[i];
          const dotColor = rec ? RECOVERY_COLORS[rec] : "var(--accent)";
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={selectedRegion === REGIONS[i] ? 6 : 4}
              fill={ratios[i] > 0 ? dotColor : "var(--text-muted)"}
              stroke="var(--bg)"
              strokeWidth={2}
              style={{ cursor: "pointer", transition: "r 0.2s, fill 0.2s" }}
              onClick={() => onSelectRegion(REGIONS[i])}
            />
          );
        })}

        {/* Labels */}
        {REGIONS.map((reg, i) => {
          const [x, y] = pointAt(i, 1.25, cx, cy, r);
          const val = regionValues[i];
          const isSelected = selectedRegion === reg;
          const fatigued = regionRecovery[i] === "fatigued";
          const labelColor = fatigued
            ? RECOVERY_COLORS.fatigued
            : isSelected
              ? "var(--accent)"
              : val > 0 ? "var(--text)" : "var(--text-muted)";
          return (
            <g key={`label-${reg}`} onClick={() => onSelectRegion(reg)} style={{ cursor: "pointer" }}>
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
                style={{ fontSize: "11px", fontWeight: isSelected ? 700 : 600, fill: labelColor, transition: "fill 0.2s" }}
              >
                {REGION_LABELS[reg]}
              </text>
              <text
                x={x}
                y={y + 7}
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
                style={{
                  fontSize: "9px",
                  fontWeight: 500,
                  fill: isSelected ? "var(--accent)" : "var(--text-muted)",
                  transition: "fill 0.2s",
                }}
              >
                {mode === "sets" ? `${val} sets` : `${val} kg`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
