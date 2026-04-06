"use client";

import { useState, useMemo } from "react";
import { generateWarmup, estimateWarmupTime, type WarmupDrill } from "@/lib/warmup";
import type { MuscleGroup } from "@/data/exercises";
import { Clock, RotateCcw, ChevronDown, ChevronUp, Zap, Move, Activity } from "lucide-react";

const TYPE_ICON: Record<WarmupDrill["type"], typeof Zap> = {
  mobility: Move,
  activation: Zap,
  dynamic: Activity,
};

const TYPE_COLOR: Record<WarmupDrill["type"], string> = {
  mobility: "var(--accent-blue, #0A84FF)",
  activation: "var(--accent-orange)",
  dynamic: "var(--accent-green)",
};

const TYPE_LABEL: Record<WarmupDrill["type"], string> = {
  mobility: "Movilidad",
  activation: "Activación",
  dynamic: "Dinámico",
};

interface WarmupGeneratorProps {
  targetMuscles: MuscleGroup[];
  onClose: () => void;
}

export default function WarmupGenerator({ targetMuscles, onClose }: WarmupGeneratorProps) {
  const [drills, setDrills] = useState<WarmupDrill[]>(() => generateWarmup(targetMuscles));
  const [checkedDrills, setCheckedDrills] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(true);

  const time = useMemo(() => estimateWarmupTime(drills), [drills]);
  const allDone = checkedDrills.size === drills.length;

  function regenerate() {
    setDrills(generateWarmup(targetMuscles));
    setCheckedDrills(new Set());
  }

  function toggleDrill(idx: number) {
    setCheckedDrills((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  if (drills.length === 0) return null;

  return (
    <div className="card mb-4" style={{ borderLeft: "3px solid var(--accent-orange)" }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: "var(--accent-orange)" }} />
          <span className="text-[0.82rem] font-bold" style={{ color: "var(--text)" }}>
            Calentamiento
          </span>
          <span className="text-[0.6rem] font-medium" style={{ color: "var(--text-muted)" }}>
            {drills.length} ejercicios · ~{time} min
          </span>
        </div>
        <div className="flex items-center gap-2">
          {allDone && (
            <span className="text-[0.6rem] font-bold" style={{ color: "var(--accent-green)" }}>✓ Listo</span>
          )}
          {expanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-0">
          {drills.map((drill, i) => {
            const Icon = TYPE_ICON[drill.type];
            const done = checkedDrills.has(i);
            return (
              <button
                key={`${drill.name}-${i}`}
                onClick={() => toggleDrill(i)}
                className="w-full flex items-center gap-3 py-2.5 bg-transparent border-none cursor-pointer text-left"
                style={{
                  borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined,
                  opacity: done ? 0.5 : 1,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: done ? "var(--accent-green)" : `${TYPE_COLOR[drill.type]}15` }}
                >
                  {done ? (
                    <span className="text-white text-[0.7rem] font-bold">✓</span>
                  ) : (
                    <Icon size={14} style={{ color: TYPE_COLOR[drill.type] }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[0.75rem] font-semibold"
                    style={{ color: "var(--text)", textDecoration: done ? "line-through" : undefined }}
                  >
                    {drill.name}
                  </div>
                  <div className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
                    {TYPE_LABEL[drill.type]} · {drill.duration}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={10} style={{ color: "var(--text-muted)" }} />
                  <span className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>{drill.duration}</span>
                </div>
              </button>
            );
          })}

          <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button
              onClick={regenerate}
              className="flex items-center gap-1.5 text-[0.7rem] font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              <RotateCcw size={12} /> Regenerar
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-[0.7rem] font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer ml-auto"
              style={{ background: allDone ? "var(--accent-green)" : "var(--accent)", color: "#fff" }}
            >
              {allDone ? "✓ Comenzar entreno" : "Saltar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
