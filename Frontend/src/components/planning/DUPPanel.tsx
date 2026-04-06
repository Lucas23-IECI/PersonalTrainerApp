"use client";

import { useState, useEffect } from "react";
import { Repeat, RotateCcw, Zap } from "lucide-react";
import {
  isDUPEnabled,
  toggleDUP,
  getDUPPreview,
  resetDUPCounters,
  DUP_SCHEMES,
  type DUPScheme,
} from "@/lib/dup";
import { getWeeklyPlan, type WorkoutDay } from "@/data/workouts";
import { StaggerList, StaggerItem } from "@/components/motion";

export default function DUPPanel() {
  const [enabled, setEnabled] = useState(false);
  const [plan, setPlan] = useState<WorkoutDay[]>([]);

  useEffect(() => {
    setEnabled(isDUPEnabled());
    setPlan(getWeeklyPlan().filter((d) => d.exercises.length > 0));
  }, []);

  function handleToggle() {
    const next = !enabled;
    toggleDUP(next);
    setEnabled(next);
  }

  function handleReset() {
    resetDUPCounters();
    setPlan([...plan]); // force re-render
  }

  return (
    <StaggerList>
      {/* Info card */}
      <StaggerItem>
        <div className="card mb-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#5E5CE620" }}
            >
              <Repeat size={16} style={{ color: "#5E5CE6" }} />
            </div>
            <div className="flex-1">
              <div className="text-[0.75rem] font-bold" style={{ color: "var(--text)" }}>
                Periodización Ondulante Diaria
              </div>
              <div className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                Rota automáticamente: Pesado → Moderado → Liviano
              </div>
            </div>
          </div>
          <p className="text-[0.6rem] mb-3" style={{ color: "var(--text-secondary)" }}>
            DUP varía la intensidad y volumen cada sesión para maximizar adaptación y prevenir
            estancamientos. Solo afecta ejercicios compuestos (sentadilla, press banca, peso muerto, etc.).
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[0.65rem] font-bold border-none cursor-pointer transition-all"
              style={{
                background: enabled ? "var(--accent)" : "var(--bg-elevated)",
                color: enabled ? "white" : "var(--text-muted)",
              }}
            >
              <Zap size={13} />
              {enabled ? "DUP Activo" : "Activar DUP"}
            </button>
            {enabled && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[0.6rem] bg-transparent border-none cursor-pointer font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                <RotateCcw size={11} /> Reset contadores
              </button>
            )}
          </div>
        </div>
      </StaggerItem>

      {/* Scheme legend */}
      <StaggerItem>
        <div className="card mb-3">
          <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Esquemas de Rotación
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["heavy", "moderate", "light"] as DUPScheme[]).map((scheme) => {
              const cfg = DUP_SCHEMES[scheme];
              return (
                <div
                  key={scheme}
                  className="text-center p-2.5 rounded-xl"
                  style={{ background: cfg.color + "15" }}
                >
                  <div className="text-lg font-black" style={{ color: cfg.color }}>
                    {cfg.reps}
                  </div>
                  <div className="text-[0.6rem] font-bold" style={{ color: cfg.color }}>
                    {cfg.label}
                  </div>
                  <div className="text-[0.5rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    RPE {cfg.rpe}
                  </div>
                  <div className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>
                    {cfg.load}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </StaggerItem>

      {/* Per-day preview */}
      {enabled && plan.length > 0 && (
        <StaggerItem>
          <div className="text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Próximas Sesiones
          </div>
          {plan.map((day) => {
            const preview = getDUPPreview(day.id);
            const compoundCount = day.exercises.filter(
              (e) => e.primaryMuscles.length > 1 || e.name.toLowerCase().includes("press") || e.name.toLowerCase().includes("sentadilla") || e.name.toLowerCase().includes("peso muerto")
            ).length;
            return (
              <div key={day.id} className="card mb-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-5 rounded-full" style={{ background: day.color }} />
                  <div className="flex-1">
                    <span className="text-[0.65rem] font-bold" style={{ color: "var(--text)" }}>
                      {day.day} — {day.name}
                    </span>
                    <span className="text-[0.5rem] ml-1.5" style={{ color: "var(--text-muted)" }}>
                      {compoundCount} compuestos
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {preview.map((p, i) => (
                    <div
                      key={i}
                      className="flex-1 text-center px-2 py-1.5 rounded-lg"
                      style={{
                        background: i === 0 ? p.config.color + "20" : "var(--bg-elevated)",
                        border: i === 0 ? `1px solid ${p.config.color}40` : "none",
                      }}
                    >
                      <div className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>
                        {i === 0 ? "Próxima" : `+${i}`}
                      </div>
                      <div
                        className="text-[0.6rem] font-bold"
                        style={{ color: i === 0 ? p.config.color : "var(--text-secondary)" }}
                      >
                        {p.config.label}
                      </div>
                      <div className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>
                        {p.config.reps} reps
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </StaggerItem>
      )}
    </StaggerList>
  );
}
