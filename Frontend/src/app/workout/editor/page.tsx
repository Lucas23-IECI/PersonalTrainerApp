"use client";

import { useState, useEffect } from "react";
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
import {
  ChevronLeft,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
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

  if (!program) return <div className="py-10 text-center text-zinc-500">Cargando...</div>;

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
          className="flex items-center gap-1 text-sm text-zinc-500 bg-transparent border-none cursor-pointer p-0"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[0.7rem] text-zinc-500 bg-transparent cursor-pointer py-1 px-2 rounded-lg"
            style={{ border: "1px solid var(--border)" }}
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-1 text-[0.7rem] font-bold text-white px-3 py-1 rounded-lg border-none cursor-pointer"
            style={{ background: dirty ? "#2C6BED" : "var(--bg-elevated)", opacity: dirty ? 1 : 0.5 }}
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
      <p className="text-[0.68rem] text-zinc-500 mb-4">
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
                <div className="text-[0.6rem] text-zinc-500">
                  {day.exercises.length} ejercicios · {day.focus}
                </div>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
            </div>

            {/* Expanded exercises */}
            {isOpen && !isRest && (
              <div className="mt-3">
                {day.exercises.map((ex, i) => {
                  const isEditing = editingEx?.dayId === day.id && editingEx?.exIdx === i;

                  return (
                    <div key={i} className="py-2" style={{ borderBottom: i < day.exercises.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                      {/* Exercise row */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveExercise(day.id, i, i - 1)} disabled={i === 0} className="text-zinc-400 bg-transparent border-none cursor-pointer p-0" style={{ opacity: i === 0 ? 0.2 : 1 }}>
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => moveExercise(day.id, i, i + 1)} disabled={i === day.exercises.length - 1} className="text-zinc-400 bg-transparent border-none cursor-pointer p-0" style={{ opacity: i === day.exercises.length - 1 ? 0.2 : 1 }}>
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setEditingEx(isEditing ? null : { dayId: day.id, exIdx: i })}
                        >
                          <div className="text-[0.78rem] font-semibold text-zinc-800">{ex.name}</div>
                          <div className="text-[0.62rem] text-zinc-500">{ex.sets}×{ex.reps} · {ex.rest} · RPE {ex.rpe}</div>
                        </div>
                        <button
                          onClick={() => removeExercise(day.id, i)}
                          className="text-zinc-400 bg-transparent border-none cursor-pointer p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Inline editor */}
                      {isEditing && (
                        <div className="mt-2 py-2 px-2 rounded-lg grid grid-cols-2 gap-2" style={{ background: "var(--bg-elevated)" }}>
                          <div className="col-span-2">
                            <label className="block text-[0.55rem] text-zinc-600 uppercase mb-0.5">Nombre</label>
                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => updateExercise(day.id, i, { name: e.target.value })}
                              className="w-full text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] text-zinc-600 uppercase mb-0.5">Sets</label>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(day.id, i, { sets: parseInt(e.target.value) || 0 })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] text-zinc-600 uppercase mb-0.5">Reps</label>
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={(e) => updateExercise(day.id, i, { reps: e.target.value })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] text-zinc-600 uppercase mb-0.5">RPE</label>
                            <input
                              type="text"
                              value={ex.rpe}
                              onChange={(e) => updateExercise(day.id, i, { rpe: e.target.value })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] text-zinc-600 uppercase mb-0.5">Descanso</label>
                            <input
                              type="text"
                              value={ex.rest}
                              onChange={(e) => updateExercise(day.id, i, { rest: e.target.value })}
                              className="w-full text-center text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[0.55rem] text-zinc-600 uppercase mb-0.5">Carga</label>
                            <input
                              type="text"
                              value={ex.load}
                              onChange={(e) => updateExercise(day.id, i, { load: e.target.value })}
                              className="w-full text-[0.8rem] py-1.5"
                            />
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <label className="text-[0.6rem] text-zinc-600">Compuesto</label>
                            <input
                              type="checkbox"
                              checked={ex.isCompound}
                              onChange={(e) => updateExercise(day.id, i, { isCompound: e.target.checked })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add exercise button */}
                <button
                  onClick={() => addExercise(day.id)}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-[0.72rem] font-semibold text-[#2C6BED] py-2 rounded-lg cursor-pointer bg-transparent"
                  style={{ border: "1px dashed #2C6BED40" }}
                >
                  <Plus size={14} /> Agregar ejercicio
                </button>
              </div>
            )}

            {isOpen && isRest && (
              <div className="mt-2 text-center text-[0.75rem] text-zinc-400 py-3">
                {day.type === "football" ? "⚽ Fútbol — no editable" : "🛋️ Día de descanso"}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
