"use client";

import { useState, useMemo } from "react";
import { getExerciseHistory, type ExerciseHistory } from "@/lib/progression";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

interface ExerciseProgressInlineProps {
  exerciseName: string;
}

export default function ExerciseProgressInline({ exerciseName }: ExerciseProgressInlineProps) {
  const [expanded, setExpanded] = useState(false);

  const history = useMemo(() => getExerciseHistory(exerciseName, 5), [exerciseName]);

  if (history.length === 0) return null;

  const last = history[0];
  const prev = history[1];

  // Calculate trend
  let trend: "up" | "down" | "same" = "same";
  let trendValue = "";
  if (prev && last) {
    const diff = last.topSet.weight - prev.topSet.weight;
    if (diff > 0) {
      trend = "up";
      trendValue = `+${diff}kg`;
    } else if (diff < 0) {
      trend = "down";
      trendValue = `${diff}kg`;
    }
  }

  const trendColors = { up: "#34C759", down: "#FF453A", same: "var(--text-muted)" };
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="mt-1">
      {/* Compact summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full bg-transparent border-none cursor-pointer p-0"
      >
        <div className="flex items-center gap-1.5 text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
          <span>Última: {last.topSet.weight}kg × {last.topSet.reps}</span>
          {trend !== "same" && (
            <span className="flex items-center gap-0.5 font-bold" style={{ color: trendColors[trend] }}>
              <TrendIcon size={10} />
              {trendValue}
            </span>
          )}
          <span className="text-[0.55rem]">RPE {last.avgRpe.toFixed(1)}</span>
        </div>
        {history.length > 1 && (
          expanded ? <ChevronUp size={10} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={10} style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {/* Expanded history */}
      {expanded && history.length > 1 && (
        <div className="mt-1.5 pb-1">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[0.58rem] py-0.5"
              style={{ color: "var(--text-muted)", borderBottom: i < history.length - 1 ? "1px solid var(--border-subtle)" : undefined }}
            >
              <span>{new Date(h.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</span>
              <span>{h.topSet.weight}kg × {h.topSet.reps}</span>
              <span>RPE {h.avgRpe.toFixed(1)}</span>
              <span>{h.totalVolume.toLocaleString()}kg vol</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
