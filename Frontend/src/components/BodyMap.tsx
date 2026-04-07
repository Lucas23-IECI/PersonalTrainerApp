"use client";

import React, { useState } from "react";
import { MUSCLE_LABELS, type MuscleGroup } from "@/data/exercises";

/* ─── Props (backward compatible) ───────────────────── */
interface BodyMapProps {
  muscleData: Record<string, { sets: number; volume: number }>;
  recoveryMap?: Record<string, { status: "fresh" | "recovered" | "recovering" | "fatigued" }>;
  mode: "sets" | "recovery";
  onSelectMuscle: (muscle: string) => void;
  selectedMuscle: string | null;
}

type BodyView = "front" | "back";

/* ─── Color helpers ─────────────────────────────────── */
function getSetsColor(sets: number): string {
  if (sets === 0) return "rgba(255,255,255,0.03)";
  const t = Math.min(sets / 20, 1);
  const r = Math.round(30 + t * 30);
  const g = Math.round(80 + t * 60);
  const b = Math.round(200 + t * 55);
  return `rgba(${r}, ${g}, ${b}, ${0.2 + t * 0.6})`;
}

function getRecoveryFill(status: string): string {
  const m: Record<string, string> = {
    fresh: "rgba(10, 132, 255, 0.5)",
    recovered: "rgba(52, 199, 89, 0.5)",
    recovering: "rgba(255, 214, 10, 0.5)",
    fatigued: "rgba(255, 69, 58, 0.5)",
  };
  return m[status] || "rgba(255,255,255,0.03)";
}

/* ─── Muscle zone path definitions ──────────────────── */
// ViewBox: 0 0 200 400, body centered at x=100
interface MZ { muscle: MuscleGroup; d: string }

// ─── FRONT VIEW ────────────────────────────────────────
const FRONT: MZ[] = [
  // Traps (upper portion visible from front)
  { muscle: "traps", d: "M90,66 C84,69 74,74 64,80 L70,85 C78,80 85,76 90,72 Z M110,66 C116,69 126,74 136,80 L130,85 C122,80 115,76 110,72 Z" },
  // Front Delts
  { muscle: "front_delts", d: "M64,80 C57,84 53,92 53,100 C53,106 56,110 60,108 L65,100 C65,94 65,88 66,82 Z M136,80 C143,84 147,92 147,100 C147,106 144,110 140,108 L135,100 C135,94 135,88 134,82 Z" },
  // Side Delts (outer shoulder cap)
  { muscle: "side_delts", d: "M58,78 C53,82 50,88 50,96 L55,98 C56,92 57,86 60,80 Z M142,78 C147,82 150,88 150,96 L145,98 C144,92 143,86 140,80 Z" },
  // Chest (pectorals)
  { muscle: "chest", d: "M97,90 C88,90 76,94 70,100 C66,106 65,114 68,122 C72,128 82,130 94,130 L97,128 Z M103,90 C112,90 124,94 130,100 C134,106 135,114 132,122 C128,128 118,130 106,130 L103,128 Z" },
  // Biceps
  { muscle: "biceps", d: "M58,110 C54,118 50,132 48,148 C47,156 49,162 53,162 L58,158 C60,148 60,134 60,122 C60,116 59,112 58,110 Z M142,110 C146,118 150,132 152,148 C153,156 151,162 147,162 L142,158 C140,148 140,134 140,122 C140,116 141,112 142,110 Z" },
  // Forearms
  { muscle: "forearms", d: "M51,166 C48,176 44,194 42,210 C41,218 43,222 47,222 L52,220 C54,212 54,196 53,182 C52,174 52,170 51,166 Z M149,166 C152,176 156,194 158,210 C159,218 157,222 153,222 L148,220 C146,212 146,196 147,182 C148,174 148,170 149,166 Z" },
  // Abs
  { muscle: "abs", d: "M92,132 Q92,128 96,128 L104,128 Q108,128 108,132 L108,180 Q108,184 104,184 L96,184 Q92,184 92,180 Z" },
  // Obliques
  { muscle: "obliques", d: "M73,132 L90,130 L88,184 L71,180 C69,168 69,148 73,132 Z M127,132 L110,130 L112,184 L129,180 C131,168 131,148 127,132 Z" },
  // Hip Flexors
  { muscle: "hip_flexors", d: "M80,188 L92,186 L92,204 L82,206 C80,200 79,194 80,188 Z M120,188 L108,186 L108,204 L118,206 C120,200 121,194 120,188 Z" },
  // Quads
  { muscle: "quads", d: "M76,208 C70,218 66,242 66,268 C66,282 68,294 72,302 L90,302 C92,294 92,280 90,262 C88,242 86,222 82,210 Z M124,208 C130,218 134,242 134,268 C134,282 132,294 128,302 L110,302 C108,294 108,280 110,262 C112,242 114,222 118,210 Z" },
  // Adductors
  { muscle: "adductors", d: "M90,208 L98,206 L98,274 L92,276 C90,258 90,232 90,208 Z M110,208 L102,206 L102,274 L108,276 C110,258 110,232 110,208 Z" },
  // Calves (tibialis anterior)
  { muscle: "calves", d: "M74,308 C72,320 70,342 72,360 C74,368 78,374 82,374 L88,372 C90,364 90,344 88,328 C86,318 84,310 80,308 Z M126,308 C128,320 130,342 128,360 C126,368 122,374 118,374 L112,372 C110,364 110,344 112,328 C114,318 116,310 120,308 Z" },
];

// ─── BACK VIEW ─────────────────────────────────────────
const BACK: MZ[] = [
  // Traps (full trapezius diamond)
  { muscle: "traps", d: "M100,66 C114,70 128,76 138,82 L130,90 C120,86 110,80 100,76 C90,80 80,86 70,90 L62,82 C72,76 86,70 100,66 Z" },
  // Rear Delts
  { muscle: "rear_delts", d: "M64,84 C57,88 53,96 53,104 C53,108 56,112 60,110 L66,104 C66,98 66,92 66,86 Z M136,84 C143,88 147,96 147,104 C147,108 144,112 140,110 L134,104 C134,98 134,92 134,86 Z" },
  // Side Delts (back view)
  { muscle: "side_delts", d: "M60,82 C55,86 52,92 52,100 L56,102 C58,96 59,90 62,84 Z M140,82 C145,86 148,92 148,100 L144,102 C142,96 141,90 138,84 Z" },
  // Upper Back (rhomboids)
  { muscle: "upper_back", d: "M82,92 L96,90 L96,128 L82,130 C78,118 78,104 82,92 Z M118,92 L104,90 L104,128 L118,130 C122,118 122,104 118,92 Z" },
  // Lats (V-shape)
  { muscle: "lats", d: "M68,96 L80,94 L78,130 C76,148 74,162 72,172 L64,168 C62,150 64,126 68,96 Z M132,96 L120,94 L122,130 C124,148 126,162 128,172 L136,168 C138,150 136,126 132,96 Z" },
  // Lower Back (erector spinae)
  { muscle: "lower_back", d: "M88,156 L96,153 L96,190 L88,192 C86,180 86,166 88,156 Z M112,156 L104,153 L104,190 L112,192 C114,180 114,166 112,156 Z" },
  // Triceps
  { muscle: "triceps", d: "M52,112 C48,120 46,138 45,154 C44,162 47,168 52,166 L56,162 C58,150 58,136 57,124 C56,118 54,114 52,112 Z M148,112 C152,120 154,138 155,154 C156,162 153,168 148,166 L144,162 C142,150 142,136 143,124 C144,118 146,114 148,112 Z" },
  // Forearms
  { muscle: "forearms", d: "M49,170 C46,180 42,196 40,212 C39,220 42,224 46,224 L51,222 C53,212 53,198 52,184 C51,178 50,174 49,170 Z M151,170 C154,180 158,196 160,212 C161,220 158,224 154,224 L149,222 C147,212 147,198 148,184 C149,178 150,174 151,170 Z" },
  // Glutes
  { muscle: "glutes", d: "M72,192 C66,198 64,208 66,218 C68,226 76,230 86,228 L96,224 L96,196 C88,192 80,192 72,192 Z M128,192 C134,198 136,208 134,218 C132,226 124,230 114,228 L104,224 L104,196 C112,192 120,192 128,192 Z" },
  // Hamstrings
  { muscle: "hamstrings", d: "M74,234 C70,246 68,266 70,284 C72,296 76,302 82,304 L92,302 C92,290 90,268 88,252 C86,240 82,236 78,234 Z M126,234 C130,246 132,266 130,284 C128,296 124,302 118,304 L108,302 C108,290 110,268 112,252 C114,240 118,236 122,234 Z" },
  // Calves (gastrocnemius)
  { muscle: "calves", d: "M76,310 C72,318 70,334 72,352 C74,364 78,372 84,374 L90,372 C92,362 92,344 90,328 C88,318 86,312 82,310 Z M124,310 C128,318 130,334 128,352 C126,364 122,372 116,374 L110,372 C108,362 108,344 110,328 C112,318 114,312 118,310 Z" },
];

/* ─── Body silhouette ───────────────────────────────── */
function BodySilhouette() {
  return (
    <g opacity={0.08} fill="var(--text, #e0e0e0)" stroke="none">
      <circle cx={100} cy={38} r={17} />
      <rect x={93} y={54} width={14} height={14} rx={5} />
      <path d="M60,74 Q55,80 54,92 L54,110 Q54,118 62,120 L62,188 Q62,198 76,200 L124,200 Q138,198 138,188 L138,120 Q146,118 146,110 L146,92 Q145,80 140,74 Z" />
      <path d="M54,96 Q47,100 44,112 L40,152 Q38,164 44,166 L50,164 Q54,162 54,152 L55,118 Z" />
      <path d="M146,96 Q153,100 156,112 L160,152 Q162,164 156,166 L150,164 Q146,162 146,152 L145,118 Z" />
      <path d="M42,170 Q40,180 38,196 L36,212 Q35,222 40,224 L46,222 Q50,220 49,212 L48,194 Q46,180 44,172 Z" />
      <path d="M158,170 Q160,180 162,196 L164,212 Q165,222 160,224 L154,222 Q150,220 151,212 L152,194 Q154,180 156,172 Z" />
      <path d="M76,200 L68,220 Q64,250 64,280 L64,300 L92,300 Q94,260 92,230 L86,206 Z" />
      <path d="M124,200 L132,220 Q136,250 136,280 L136,300 L108,300 Q106,260 108,230 L114,206 Z" />
      <path d="M66,304 Q64,330 66,358 L68,380 L62,394 Q72,398 80,394 L82,380 Q86,350 84,320 L88,304 Z" />
      <path d="M134,304 Q136,330 134,358 L132,380 L138,394 Q128,398 120,394 L118,380 Q114,350 116,320 L112,304 Z" />
    </g>
  );
}

/* ─── Legends ───────────────────────────────────────── */
function SetsLegend() {
  return (
    <div className="flex items-center gap-2 justify-center mt-3">
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>0</span>
      <div className="w-28 h-2 rounded-full" style={{ background: "linear-gradient(to right, rgba(59,130,246,0.15), rgba(59,130,246,0.85))" }} />
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>20+ sets</span>
    </div>
  );
}

const RECOVERY_ITEMS = [
  { key: "fresh", color: "rgba(10,132,255,0.7)", label: "Descansado" },
  { key: "recovered", color: "rgba(52,199,89,0.7)", label: "Recuperado" },
  { key: "recovering", color: "rgba(255,214,10,0.7)", label: "Recuperando" },
  { key: "fatigued", color: "rgba(255,69,58,0.7)", label: "Fatigado" },
];

function RecoveryLegend() {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-3">
      {RECOVERY_ITEMS.map((r) => (
        <div key={r.key} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: r.color }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main interactive BodyMap ──────────────────────── */
export default function BodyMap({ muscleData, recoveryMap, mode, onSelectMuscle, selectedMuscle }: BodyMapProps) {
  const [bodyView, setBodyView] = useState<BodyView>("front");
  const zones = bodyView === "front" ? FRONT : BACK;

  const getFill = (muscle: MuscleGroup): string => {
    if (mode === "recovery" && recoveryMap?.[muscle]) {
      return getRecoveryFill(recoveryMap[muscle].status);
    }
    return getSetsColor(muscleData[muscle]?.sets ?? 0);
  };

  return (
    <div className="max-w-[320px] mx-auto text-center">
      {/* Front / Back toggle */}
      <div className="inline-flex gap-1 p-1 rounded-lg mb-3" style={{ background: "var(--bg-elevated)" }}>
        {(["front", "back"] as BodyView[]).map((v) => (
          <button
            key={v}
            onClick={() => setBodyView(v)}
            className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={{
              background: bodyView === v ? "var(--accent)" : "transparent",
              color: bodyView === v ? "#fff" : "var(--text-muted)",
            }}
          >
            {v === "front" ? "Frontal" : "Posterior"}
          </button>
        ))}
      </div>

      <svg
        viewBox="0 0 200 400"
        width="100%"
        style={{ maxHeight: 500 }}
        aria-label={`Mapa corporal - vista ${bodyView === "front" ? "frontal" : "posterior"}`}
      >
        <defs>
          <filter id="muscle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <BodySilhouette />

        {zones.map((z, i) => {
          const selected = selectedMuscle === z.muscle;
          const fill = getFill(z.muscle);
          const hasSets = (muscleData[z.muscle]?.sets ?? 0) > 0;
          return (
            <path
              key={`${z.muscle}-${i}`}
              d={z.d}
              fill={fill}
              stroke={
                selected
                  ? "var(--accent, #3b82f6)"
                  : hasSets
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.04)"
              }
              strokeWidth={selected ? 1.5 : 0.3}
              strokeLinejoin="round"
              style={{ cursor: "pointer", transition: "fill 0.2s, stroke 0.2s, stroke-width 0.2s" }}
              filter={selected ? "url(#muscle-glow)" : undefined}
              onClick={() => onSelectMuscle(z.muscle)}
              role="button"
              tabIndex={0}
              aria-label={MUSCLE_LABELS[z.muscle]}
              onKeyDown={(e) => { if (e.key === "Enter") onSelectMuscle(z.muscle); }}
            />
          );
        })}

        {selectedMuscle && (
          <text x={100} y={396} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--accent, #3b82f6)">
            {MUSCLE_LABELS[selectedMuscle as MuscleGroup]}
          </text>
        )}
      </svg>

      {mode === "sets" ? <SetsLegend /> : <RecoveryLegend />}
    </div>
  );
}

/* ─── Mini BodyMap (front+back side-by-side, for exercise detail) ─── */
export function BodyMapMini({
  primaryMuscles,
  secondaryMuscles,
}: {
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}) {
  const renderView = (zones: MZ[], label: string) => (
    <div className="text-center">
      <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
      <svg viewBox="0 0 200 400" width={100} height={200}>
        <BodySilhouette />
        {zones.map((z, i) => {
          const isPrimary = primaryMuscles.includes(z.muscle);
          const isSecondary = secondaryMuscles.includes(z.muscle);
          return (
            <path
              key={i}
              d={z.d}
              fill={
                isPrimary
                  ? "rgba(239, 68, 68, 0.55)"
                  : isSecondary
                  ? "rgba(59, 130, 246, 0.35)"
                  : "transparent"
              }
              stroke={
                isPrimary
                  ? "rgba(239, 68, 68, 0.7)"
                  : isSecondary
                  ? "rgba(59, 130, 246, 0.5)"
                  : "none"
              }
              strokeWidth={isPrimary || isSecondary ? 0.5 : 0}
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </div>
  );

  return (
    <div className="flex gap-6 justify-center mb-4">
      {renderView(FRONT, "Frontal")}
      {renderView(BACK, "Posterior")}
      <div className="flex flex-col justify-center gap-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(239, 68, 68, 0.55)" }} />
          <span style={{ color: "var(--text-muted)" }}>Primario</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(59, 130, 246, 0.35)" }} />
          <span style={{ color: "var(--text-muted)" }}>Secundario</span>
        </div>
      </div>
    </div>
  );
}
