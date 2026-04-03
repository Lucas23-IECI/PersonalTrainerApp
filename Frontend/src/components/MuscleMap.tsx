"use client";

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

interface MuscleRadarProps {
  muscleHits: Record<string, number>;
  selectedRegion: MuscleRegion | null;
  onSelectRegion: (region: MuscleRegion) => void;
}

export function getRegionHits(region: MuscleRegion, muscleHits: Record<string, number>): number {
  return REGION_MUSCLES[region].reduce((sum, m) => sum + (muscleHits[m] || 0), 0);
}

function pointAt(index: number, ratio: number, cx: number, cy: number, r: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return [cx + r * ratio * Math.cos(angle), cy + r * ratio * Math.sin(angle)];
}

function toPath(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
}

export default function MuscleRadar({ muscleHits, selectedRegion, onSelectRegion }: MuscleRadarProps) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const r = 110;
  const levels = 5;
  const maxHits = 8;

  const values = REGIONS.map((reg) => Math.min(getRegionHits(reg, muscleHits) / maxHits, 1));
  const dataPoints = values.map((v, i) => pointAt(i, Math.max(v, 0.04), cx, cy, r));

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

        {/* Data fill */}
        <path d={toPath(dataPoints)} fill="var(--radar-fill, rgba(44,107,237,0.15))" stroke="var(--accent)" strokeWidth={2} />

        {/* Data points */}
        {dataPoints.map(([x, y], i) => (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={selectedRegion === REGIONS[i] ? 6 : 4}
            fill={selectedRegion === REGIONS[i] ? "var(--accent)" : values[i] > 0 ? "var(--accent)" : "var(--text-muted)"}
            stroke="var(--bg)"
            strokeWidth={2}
            style={{ cursor: "pointer", transition: "r 0.2s" }}
            onClick={() => onSelectRegion(REGIONS[i])}
          />
        ))}

        {/* Labels */}
        {REGIONS.map((reg, i) => {
          const [x, y] = pointAt(i, 1.25, cx, cy, r);
          const hits = getRegionHits(reg, muscleHits);
          const isSelected = selectedRegion === reg;
          return (
            <g key={`label-${reg}`} onClick={() => onSelectRegion(reg)} style={{ cursor: "pointer" }}>
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
                style={{
                  fontSize: "11px",
                  fontWeight: isSelected ? 700 : 600,
                  fill: isSelected ? "var(--accent)" : hits > 0 ? "var(--text)" : "var(--text-muted)",
                  transition: "fill 0.2s",
                }}
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
                {hits} hits
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
