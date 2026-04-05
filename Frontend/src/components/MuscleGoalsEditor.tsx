"use client";

import { useState, useEffect } from "react";
import { MUSCLE_LABELS, type MuscleGroup } from "@/data/exercises";
import { getMuscleGoals, saveMuscleGoals, resetMuscleGoals, WEEKLY_SET_TARGETS } from "@/lib/muscle-goals";
import { X, RotateCcw } from "lucide-react";

interface MuscleGoalsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const MUSCLE_GROUPS_ORDERED = [
  { region: "Pecho & Hombros", muscles: ["chest", "front_delts", "side_delts", "rear_delts"] as MuscleGroup[] },
  { region: "Espalda", muscles: ["upper_back", "lats", "traps", "lower_back"] as MuscleGroup[] },
  { region: "Brazos", muscles: ["biceps", "triceps", "forearms"] as MuscleGroup[] },
  { region: "Core", muscles: ["abs", "obliques"] as MuscleGroup[] },
  { region: "Piernas", muscles: ["quads", "hamstrings", "glutes", "calves", "adductors", "hip_flexors"] as MuscleGroup[] },
];

export default function MuscleGoalsEditor({ isOpen, onClose, onSave }: MuscleGoalsEditorProps) {
  const [goals, setGoals] = useState<Record<MuscleGroup, { min: number; max: number }>>(WEEKLY_SET_TARGETS);

  useEffect(() => {
    if (isOpen) setGoals(getMuscleGoals());
  }, [isOpen]);

  if (!isOpen) return null;

  const updateValue = (muscle: MuscleGroup, field: "min" | "max", delta: number) => {
    setGoals((prev) => {
      const current = prev[muscle][field];
      const newVal = Math.max(0, Math.min(50, current + delta));
      return { ...prev, [muscle]: { ...prev[muscle], [field]: newVal } };
    });
  };

  const handleReset = () => {
    resetMuscleGoals();
    setGoals({ ...WEEKLY_SET_TARGETS });
  };

  const handleSave = () => {
    saveMuscleGoals(goals);
    onSave();
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "90vh", display: "flex", flexDirection: "column", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Objetivos Semanales</h2>
            <button
              onClick={handleReset}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
              title="Restaurar valores RP"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", maxHeight: "60vh", padding: "12px 20px" }}>
          {MUSCLE_GROUPS_ORDERED.map((group) => (
            <div key={group.region} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent)", marginBottom: 8 }}>{group.region}</p>
              {group.muscles.map((muscle) => {
                const rp = WEEKLY_SET_TARGETS[muscle];
                const val = goals[muscle];
                return (
                  <div key={muscle} style={{ marginBottom: 10, padding: "8px 10px", background: "var(--bg-elevated)", borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{MUSCLE_LABELS[muscle]}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>RP: {rp.min}-{rp.max}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                      <StepperButton label="−" onClick={() => updateValue(muscle, "min", -1)} />
                      <NumBox value={val.min} />
                      <StepperButton label="+" onClick={() => updateValue(muscle, "min", 1)} />
                      <span style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 4px" }}>—</span>
                      <StepperButton label="−" onClick={() => updateValue(muscle, "max", -1)} />
                      <NumBox value={val.max} />
                      <StepperButton label="+" onClick={() => updateValue(muscle, "max", 1)} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function StepperButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {label}
    </button>
  );
}

function NumBox({ value }: { value: number }) {
  return (
    <div style={{ width: 36, height: 30, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
      {value}
    </div>
  );
}
