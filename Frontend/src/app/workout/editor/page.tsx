"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentPhase } from "@/data/phases";
import {
  getProgramForPhase,
  saveCustomProgram,
  resetCustomProgram,
  type Program,
  type ProgramDay,
  type ProgramExercise,
} from "@/data/programs";
import { SUPERSET_COLORS, SUPERSET_TAGS } from "@/components/workout/session/types";
import {
  ChevronLeft,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";

export default function WorkoutEditorPage() {
  const router = useRouter();
  const phase = getCurrentPhase();
  const [program, setProgram] = useState<Program | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<{ dayId: string; exIdx: number } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProgram(structuredClone(getProgramForPhase(phase.id)));
  }, [phase.id]);

  if (!program) return <div className="py-10 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</div>;

  function updateExercise(dayId: string, exIdx: number, updates: Partial<ProgramExercise>) {
    setProgram((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const day = copy.days.find((d) => d.id === dayId);
      if (day && day.exercises[exIdx]) {
        Object.assign(day.exercises[exIdx], updates);
      }
      return copy;
    });
    setDirty(true);
  }

  function removeExercise(dayId: string, exIdx: number) {
    setProgram((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const day = copy.days.find((d) => d.id === dayId);
      if (day) day.exercises.splice(exIdx, 1);
      return copy;
    });
    setDirty(true);
    setEditingEx(null);
  }

  function addExercise(dayId: string) {
    setProgram((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const day = copy.days.find((d) => d.id === dayId);
      if (day) {
        day.exercises.push({
          name: "Nuevo Ejercicio",
          sets: 3,
          reps: "8-12",
          rest: "60s",
          load: "Moderado",
          rpe: "7-8",
          primaryMuscles: [],
          isCompound: false,
        });
      }
      return copy;
    });
    setDirty(true);
  }

  function moveExercise(dayId: string, from: number, to: number) {
    if (to < 0) return;
    setProgram((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const day = copy.days.find((d) => d.id === dayId);
      if (day && day.exercises[from] && to < day.exercises.length) {
        const [ex] = day.exercises.splice(from, 1);
        day.exercises.splice(to, 0, ex);
      }
      return copy;
    });
    setDirty(true);
  }

  function handleSave() {
    if (!program) return;
    saveCustomProgram(program);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    resetCustomProgram(phase.id);
    setProgram(structuredClone(getProgramForPhase(phase.id)));
    setDirty(false);
    setEditingEx(null);
  }

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm bg-transparent border-none cursor-pointer p-0"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[0.7rem] bg-transparent cursor-pointer py-1 px-2 rounded-lg"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-1 text-[0.7rem] font-bold text-white px-3 py-1 rounded-lg border-none cursor-pointer"
            style={{ background: dirty ? "var(--accent)" : "var(--bg-elevated)", opacity: dirty ? 1 : 0.5 }}
          >
            <Save size={12} /> Guardar
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-3 py-2 px-3 rounded-lg text-center text-[0.75rem] font-bold text-[#34C759]" style={{ background: "rgba(52,199,89,0.1)" }}>
          ✓ Programa guardado
        </div>
      )}

      <h1 className="text-xl font-extrabold tracking-tight mb-0.5">Editor de Rutina</h1>
      <p className="text-[0.68rem] mb-4" style={{ color: "var(--text-muted)" }}>
        {phase.name} · {program.name}
      </p>

      {/* Days */}
      {program.days.map((day) => {
        const isOpen = expandedDay === day.id;
        const isRest = day.type === "rest" || day.type === "football";

        return (
          <div key={day.id} className="card mb-2">
            {/* Day header */}
            <div
              onClick={() => setExpandedDay(isOpen ? null : day.id)}
              className="flex justify-between items-center cursor-pointer"
            >
              <div>
                <div className="text-[0.85rem] font-bold" style={{ color: day.color }}>
                  {day.name}
                </div>
                <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  {day.exercises.length} ejercicios · {day.focus}
                </div>
              </div>
              {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
            </div>

            {/* Expanded exercises */}
            {isOpen && !isRest && (
              <div className="mt-3">
                {day.exercises.map((ex, i) => {
                  const isEditing = editingEx?.dayId === day.id && editingEx?.exIdx === i;

                  return (
                    <div key={i} className="py-2" style={{
                      borderBottom: i < day.exercises.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      borderLeft: ex.superset ? `3px solid ${SUPERSET_COLORS[ex.superset] || '#FF9500'}` : undefined,
                      paddingLeft: ex.superset ? "8px" : undefined,
                    }}>
                      {/* Exercise row */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveExercise(day.id, i, i - 1)} disabled={i === 0} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)", opacity: i === 0 ? 0.2 : 1 }}>
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => moveExercise(day.id, i, i + 1)} disabled={i === day.exercises.length - 1} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)", opacity: i === day.exercises.length - 1 ? 0.2 : 1 }}>
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setEditingEx(isEditing ? null : { dayId: day.id, exIdx: i })}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[0.78rem] font-semibold" style={{ color: "var(--text)" }}>{ex.name}</span>
                            {ex.superset && (
                              <span className="text-[0.5rem] font-bold px-1 py-0.5 rounded" style={{ background: SUPERSET_COLORS[ex.superset] || '#FF9500', color: '#fff' }}>
                                SS-{ex.superset}
                              </span>
                            )}
                          </div>
                          <div className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>{ex.sets}×{ex.reps} · {ex.rest} · RPE {ex.rpe}</div>
                        </div>
                        <button
                          onClick={() => removeExercise(day.id, i)}
                          className="bg-transparent border-none cursor-pointer p-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Inline editor */}
                      {isEditing && (
                        <div className="mt-2 py-2 px-2 rounded-lg grid grid-cols-2 gap-2" style={{ background: "var(--bg-elevated)" }}>
                          <div className="col-span-2">
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Nombre</label>
                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => updateExercise(day.id, i, { name: e.target.value })}
                              className="w-full text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Sets</label>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(day.id, i, { sets: parseInt(e.target.value) || 0 })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Reps</label>
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={(e) => updateExercise(day.id, i, { reps: e.target.value })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>RPE</label>
                            <input
                              type="text"
                              value={ex.rpe}
                              onChange={(e) => updateExercise(day.id, i, { rpe: e.target.value })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Descanso</label>
                            <input
                              type="text"
                              value={ex.rest}
                              onChange={(e) => updateExercise(day.id, i, { rest: e.target.value })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Carga</label>
                            <input
                              type="text"
                              value={ex.load}
                              onChange={(e) => updateExercise(day.id, i, { load: e.target.value })}
                              className="w-full text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <label className="text-[0.6rem]" style={{ color: "var(--text-secondary)" }}>Compuesto</label>
                            <input
                              type="checkbox"
                              checked={ex.isCompound}
                              onChange={(e) => updateExercise(day.id, i, { isCompound: e.target.checked })}
                            />
                          </div>
                          {/* Superset selector */}
                          <div className="col-span-2">
                            <label className="block text-[0.55rem] uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                              <Link2 size={10} className="inline mr-1" />Superset
                            </label>
                            <div className="flex gap-1.5 flex-wrap">
                              {SUPERSET_TAGS.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => updateExercise(day.id, i, { superset: ex.superset === tag ? undefined : tag })}
                                  className="w-7 h-6 rounded text-[0.65rem] font-bold border-none cursor-pointer transition-all"
                                  style={{
                                    background: ex.superset === tag ? SUPERSET_COLORS[tag] : `${SUPERSET_COLORS[tag]}20`,
                                    color: ex.superset === tag ? '#fff' : SUPERSET_COLORS[tag],
                                    outline: ex.superset === tag ? `2px solid ${SUPERSET_COLORS[tag]}` : 'none',
                                  }}
                                >
                                  {tag}
                                </button>
                              ))}
                              {ex.superset && (
                                <button
                                  onClick={() => updateExercise(day.id, i, { superset: undefined })}
                                  className="h-6 px-2 rounded text-[0.6rem] border-none cursor-pointer"
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add exercise button */}
                <button
                  onClick={() => addExercise(day.id)}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-[0.72rem] font-semibold py-2 rounded-lg cursor-pointer bg-transparent"
                  style={{ color: "var(--accent)", border: "1px dashed color-mix(in srgb, var(--accent) 25%, transparent)" }}
                >
                  <Plus size={14} /> Agregar ejercicio
                </button>
              </div>
            )}

            {isOpen && isRest && (
              <div className="mt-2 text-center text-[0.75rem] py-3" style={{ color: "var(--text-muted)" }}>
                {day.type === "football" ? "⚽ Fútbol — no editable" : "🛋️ Día de descanso"}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
