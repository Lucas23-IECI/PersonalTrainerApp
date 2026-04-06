"use client";

import { useState, useMemo } from "react";
import { getSettings } from "@/lib/storage";

// Available plate weights in kg
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LBS = [45, 35, 25, 10, 5, 2.5];

const PLATE_COLORS: Record<number, string> = {
  25: "#FF3B30",
  20: "#0A84FF",
  15: "#FFD60A",
  10: "#30D158",
  5: "#FFFFFF",
  2.5: "#FF9500",
  1.25: "#8E8E93",
  45: "#0A84FF",
  35: "#FFD60A",
};

function getPlateColor(weight: number): string {
  return PLATE_COLORS[weight] || "#8E8E93";
}

interface PlateBreakdown {
  plates: number[]; // plates per side
  remainder: number; // weight that can't be loaded
}

function calculatePlates(totalWeight: number, barWeight: number, unit: "kg" | "lbs"): PlateBreakdown {
  const availablePlates = unit === "kg" ? PLATES_KG : PLATES_LBS;
  let perSide = (totalWeight - barWeight) / 2;
  if (perSide <= 0) return { plates: [], remainder: 0 };

  const plates: number[] = [];
  for (const plate of availablePlates) {
    while (perSide >= plate - 0.001) {
      plates.push(plate);
      perSide -= plate;
    }
  }

  return { plates, remainder: Math.round(perSide * 100) / 100 };
}

interface PlateCalculatorProps {
  initialWeight?: number;
  compact?: boolean;
}

export default function PlateCalculator({ initialWeight, compact }: PlateCalculatorProps) {
  const settings = getSettings();
  const isLbs = settings.unit === "lbs";
  const unit = isLbs ? "lbs" : "kg";

  const [weight, setWeight] = useState(initialWeight || (isLbs ? 135 : 60));
  const [barWeight, setBarWeight] = useState(isLbs ? 45 : 20);

  const { plates, remainder } = useMemo(
    () => calculatePlates(weight, barWeight, unit),
    [weight, barWeight, unit]
  );

  const totalLoaded = barWeight + plates.reduce((s, p) => s + p, 0) * 2;

  // Visual bar dimensions
  const BAR_WIDTH = compact ? 200 : 280;
  const BAR_HEIGHT = compact ? 8 : 10;
  const COLLAR = compact ? 4 : 6;

  function getPlateHeight(w: number): number {
    const base = compact ? 24 : 36;
    const maxPlate = unit === "kg" ? 25 : 45;
    return Math.max(base * 0.5, base * (w / maxPlate));
  }

  function getPlateWidth(w: number): number {
    return w >= (unit === "kg" ? 10 : 25) ? (compact ? 10 : 14) : (compact ? 6 : 8);
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <label className="text-[0.6rem] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
            Peso total ({unit})
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            step={unit === "kg" ? 2.5 : 5}
            min={barWeight}
            className="w-full px-3 py-2 rounded-xl text-[0.85rem] font-bold border-none"
            style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
          />
        </div>
        <div>
          <label className="text-[0.6rem] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
            Barra ({unit})
          </label>
          <select
            value={barWeight}
            onChange={(e) => setBarWeight(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-[0.85rem] font-bold border-none"
            style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
          >
            {unit === "kg" ? (
              <>
                <option value={20}>20 kg</option>
                <option value={15}>15 kg</option>
                <option value={10}>10 kg</option>
              </>
            ) : (
              <>
                <option value={45}>45 lbs</option>
                <option value={35}>35 lbs</option>
                <option value={15}>15 lbs</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Visual Barbell */}
      <div className="flex items-center justify-center mb-4 overflow-x-auto py-2">
        <svg
          width={BAR_WIDTH + plates.length * 20 + 40}
          height={(compact ? 60 : 90)}
          viewBox={`0 0 ${BAR_WIDTH + plates.length * 20 + 40} ${compact ? 60 : 90}`}
        >
          {/* Center bar */}
          <rect
            x={20}
            y={(compact ? 30 : 45) - BAR_HEIGHT / 2}
            width={BAR_WIDTH}
            height={BAR_HEIGHT}
            rx={2}
            fill="#666"
          />
          {/* Bar knurl marks */}
          <rect
            x={20 + BAR_WIDTH * 0.3}
            y={(compact ? 30 : 45) - BAR_HEIGHT / 2}
            width={BAR_WIDTH * 0.4}
            height={BAR_HEIGHT}
            rx={2}
            fill="#777"
            opacity={0.5}
          />

          {/* Left collar */}
          <rect
            x={20 + BAR_WIDTH * 0.15}
            y={(compact ? 30 : 45) - BAR_HEIGHT}
            width={COLLAR}
            height={BAR_HEIGHT * 2}
            rx={1}
            fill="#888"
          />

          {/* Right collar */}
          <rect
            x={20 + BAR_WIDTH * 0.85 - COLLAR}
            y={(compact ? 30 : 45) - BAR_HEIGHT}
            width={COLLAR}
            height={BAR_HEIGHT * 2}
            rx={1}
            fill="#888"
          />

          {/* Left plates */}
          {plates.map((p, i) => {
            const h = getPlateHeight(p);
            const w = getPlateWidth(p);
            const x = 20 + BAR_WIDTH * 0.15 - COLLAR - (i + 1) * (w + 2);
            return (
              <g key={`l-${i}`}>
                <rect
                  x={Math.max(0, x)}
                  y={(compact ? 30 : 45) - h / 2}
                  width={w}
                  height={h}
                  rx={2}
                  fill={getPlateColor(p)}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={0.5}
                />
                {!compact && h > 20 && (
                  <text
                    x={Math.max(0, x) + w / 2}
                    y={(compact ? 30 : 45) + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={p === 5 || p === 2.5 ? "#000" : "#fff"}
                    fontSize={w > 8 ? 7 : 5}
                    fontWeight="bold"
                  >
                    {p}
                  </text>
                )}
              </g>
            );
          })}

          {/* Right plates (mirror) */}
          {plates.map((p, i) => {
            const h = getPlateHeight(p);
            const w = getPlateWidth(p);
            const x = 20 + BAR_WIDTH * 0.85 + (i) * (w + 2);
            return (
              <g key={`r-${i}`}>
                <rect
                  x={x}
                  y={(compact ? 30 : 45) - h / 2}
                  width={w}
                  height={h}
                  rx={2}
                  fill={getPlateColor(p)}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={0.5}
                />
                {!compact && h > 20 && (
                  <text
                    x={x + w / 2}
                    y={(compact ? 30 : 45) + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={p === 5 || p === 2.5 ? "#000" : "#fff"}
                    fontSize={w > 8 ? 7 : 5}
                    fontWeight="bold"
                  >
                    {p}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Plate breakdown */}
      <div className="flex flex-wrap gap-2 justify-center mb-2">
        {plates.length === 0 ? (
          <span className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>Solo barra — sin discos</span>
        ) : (
          (() => {
            const counts: Record<number, number> = {};
            plates.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
            return Object.entries(counts).map(([w, count]) => (
              <div
                key={w}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.72rem] font-bold"
                style={{ background: `${getPlateColor(Number(w))}20`, color: getPlateColor(Number(w)) }}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ background: getPlateColor(Number(w)) }}
                />
                {w} {unit} × {count}
              </div>
            ));
          })()
        )}
      </div>

      {/* Total */}
      <div className="text-center text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
        {plates.length > 0 && `Por lado: ${plates.map(String).join(" + ")} ${unit}`}
        {remainder > 0 && (
          <span style={{ color: "var(--accent-orange)" }}> — ⚠ {remainder} {unit} imposible de cargar</span>
        )}
        {totalLoaded !== weight && remainder === 0 && (
          <div className="mt-1 font-semibold" style={{ color: "var(--text)" }}>Total cargado: {totalLoaded} {unit}</div>
        )}
      </div>
    </div>
  );
}
