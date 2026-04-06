"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  TrendingUp,
} from "lucide-react";
import {
  getRoutine,
  saveRoutine,
  type Routine,
  type RoutineDay,
  type RoutineExercise,
} from "@/lib/routines-storage";
import {
  getBatchSuggestions,
  getActiveRuleConfig,
  PROGRESSION_RULES,
  setActiveRuleId,
  getActiveRuleId,
  type BatchSuggestion,
} from "@/lib/progression";

import { PageTransition } from "@/components/motion";
function RoutineEditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const routineId = params.get("id");

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<{ dayId: string; exIdx: number } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeRuleId, setActiveRule] = useState(() => getActiveRuleId());
  const [suggestions, setSuggestions] = useState<Record<string, BatchSuggestion>>({});

  useEffect(() => {
    if (routineId) {
      const r = getRoutine(routineId);
      if (r) {
        setRoutine(structuredClone(r));
        if (r.days.length > 0) setExpandedDay(r.days[0].id);
        // Get progression suggestions for all exercises
        const allNames = r.days.flatMap((d) => d.exercises.map((e) => e.name));
        const unique = [...new Set(allNames)];
        const batch = getBatchSuggestions(unique);
        const map: Record<string, BatchSuggestion> = {};
        batch.forEach((s) => { map[s.exerciseName] = s; });
        setSuggestions(map);
      }
    }
  }, [routineId]);

  if (!routine) {
    return <div className="py-10 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</div>;
  }

  // ── Routine-level updates ──
  function updateRoutineField<K extends keyof Routine>(key: K, value: Routine[K]) {
    setRoutine((prev) => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  }

  // ── Day-level ──
  function addDay() {
    setRoutine((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const newDay: RoutineDay = {
        id: `day-${copy.days.length}-${Date.now().toString(36)}`,
        name: `Día ${copy.days.length + 1}`,
        focus: "",
        type: "full",
        exercises: [],
      };
      copy.days.push(newDay);
      copy.daysPerWeek = copy.days.length;
      return copy;
    });
    setDirty(true);
  }

  function removeDay(dayId: string) {
    setRoutine((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      copy.days = copy.days.filter((d) => d.id !== dayId);
      copy.daysPerWeek = copy.days.length;
      return copy;
    });
    setDirty(true);
    if (expandedDay === dayId) setExpandedDay(null);
  }

  function updateDay(dayId: string, updates: Partial<RoutineDay>) {
    setRoutine((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const day = copy.days.find((d) => d.id === dayId);
      if (day) Object.assign(day, updates);
      return copy;
    });
    setDirty(true);
  }

  // ── Exercise-level ──
  function addExercise(dayId: string) {
    setRoutine((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const day = copy.days.find((d) => d.id === dayId);
      if (day) {
        day.exercises.push({
          name: "Nuevo Ejercicio",
          sets: 3,
          reps: "8-12",
          rest: "60s",
          rpe: "7-8",
          primaryMuscles: [],
          isCompound: false,
        });
      }
      return copy;
    });
    setDirty(true);
  }

  function removeExercise(dayId: string, exIdx: number) {
    setRoutine((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      const day = copy.days.find((d) => d.id === dayId);
      if (day) day.exercises.splice(exIdx, 1);
      return copy;
    });
    setDirty(true);
    setEditingEx(null);
  }

  function updateExercise(dayId: string, exIdx: number, updates: Partial<RoutineExercise>) {
    setRoutine((prev) => {
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

  function moveExercise(dayId: string, from: number, to: number) {
    if (to < 0) return;
    setRoutine((prev) => {
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

  // ── Save ──
  function handleSave() {
    if (!routine) return;
    saveRoutine(routine);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const DAY_TYPES = [
    { value: "push", label: "Push" },
    { value: "pull", label: "Pull" },
    { value: "upper", label: "Upper" },
    { value: "lower", label: "Lower" },
    { value: "full", label: "Full Body" },
    { value: "legs", label: "Legs" },
    { value: "arms", label: "Arms" },
    { value: "chest", label: "Chest" },
    { value: "back", label: "Back" },
    { value: "shoulders", label: "Shoulders" },
    { value: "rest", label: "Descanso" },
  ];

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/routines")}
          className="flex items-center gap-1 text-sm bg-transparent border-none cursor-pointer p-0"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={16} /> Rutinas
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty}
          className="flex items-center gap-1 text-[0.7rem] font-bold text-white px-3 py-1.5 rounded-lg border-none cursor-pointer"
          style={{ background: dirty ? "var(--accent)" : "var(--bg-elevated)", opacity: dirty ? 1 : 0.5 }}
        >
          <Save size={12} /> Guardar
        </button>
      </div>

      {saved && (
        <div className="mb-3 py-2 px-3 rounded-lg text-center text-[0.75rem] font-bold text-[#34C759]" style={{ background: "rgba(52,199,89,0.1)" }}>
          ✓ Rutina guardada
        </div>
      )}

      {/* Progression rule selector (3.5) */}
      <div className="mb-4 p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingUp size={13} style={{ color: "var(--accent)" }} />
          <span className="text-[0.68rem] font-bold text-[var(--text)]">Regla de Progresión</span>
        </div>
        <select
          value={activeRuleId}
          onChange={(e) => { setActiveRuleId(e.target.value); setActiveRule(e.target.value); }}
          className="w-full text-[0.72rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {PROGRESSION_RULES.map((rule) => (
            <option key={rule.id} value={rule.id}>{rule.label}</option>
          ))}
        </select>
        <p className="text-[0.58rem] mt-1" style={{ color: "var(--text-muted)" }}>
          {PROGRESSION_RULES.find((r) => r.id === activeRuleId)?.description}
        </p>
      </div>

      {/* Routine name & description */}
      <div className="mb-4">
        <input
          type="text"
          value={routine.name}
          onChange={(e) => updateRoutineField("name", e.target.value)}
          placeholder="Nombre de rutina"
          className="w-full text-xl font-extrabold tracking-tight text-[var(--text)] bg-transparent border-none outline-none mb-1 p-0"
        />
        <textarea
          value={routine.description}
          onChange={(e) => updateRoutineField("description", e.target.value)}
          placeholder="Descripción (opcional)"
          rows={2}
          className="w-full text-[0.72rem] bg-transparent border-none outline-none resize-none p-0"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          value={routine.split}
          onChange={(e) => updateRoutineField("split", e.target.value)}
          placeholder="Split (ej: Push/Pull/Legs)"
          className="w-full text-[0.68rem] bg-transparent border-none outline-none mt-1 p-0"
          style={{ color: "var(--text-muted)" }}
        />
      </div>

      {/* Days */}
      {routine.days.map((day, dayIdx) => {
        const isOpen = expandedDay === day.id;
        return (
          <div key={day.id} className="card mb-2">
            {/* Day header */}
            <div className="flex justify-between items-center">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setExpandedDay(isOpen ? null : day.id)}
              >
                <div className="text-[0.85rem] font-bold text-[var(--accent)]">{day.name}</div>
                <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  {day.exercises.length} ejercicios{day.focus ? ` · ${day.focus}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => removeDay(day.id)}
                  className="bg-transparent border-none cursor-pointer p-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Trash2 size={14} />
                </button>
                <div className="cursor-pointer" style={{ color: "var(--text-muted)" }} onClick={() => setExpandedDay(isOpen ? null : day.id)}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                {/* Day meta */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Nombre del Día</label>
                    <input
                      type="text"
                      value={day.name}
                      onChange={(e) => updateDay(day.id, { name: e.target.value })}
                      className="w-full text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Tipo</label>
                    <select
                      value={day.type}
                      onChange={(e) => updateDay(day.id, { type: e.target.value })}
                      className="w-full text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                      {DAY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Foco</label>
                    <input
                      type="text"
                      value={day.focus}
                      onChange={(e) => updateDay(day.id, { focus: e.target.value })}
                      placeholder="Ej: Pecho, hombros, tríceps"
                      className="w-full text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)]"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    />
                  </div>
                </div>

                {/* Exercises */}
                {day.exercises.map((ex, i) => {
                  const isEditingThis = editingEx?.dayId === day.id && editingEx?.exIdx === i;
                  return (
                    <div
                      key={i}
                      className="py-2"
                      style={{ borderBottom: i < day.exercises.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveExercise(day.id, i, i - 1)}
                            disabled={i === 0}
                            className="bg-transparent border-none cursor-pointer p-0"
                            style={{ opacity: i === 0 ? 0.2 : 1, color: "var(--text-muted)" }}
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={() => moveExercise(day.id, i, i + 1)}
                            disabled={i === day.exercises.length - 1}
                            className="bg-transparent border-none cursor-pointer p-0"
                            style={{ opacity: i === day.exercises.length - 1 ? 0.2 : 1, color: "var(--text-muted)" }}
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setEditingEx(isEditingThis ? null : { dayId: day.id, exIdx: i })}
                        >
                          <div className="text-[0.78rem] font-semibold text-[var(--text)]">{ex.name}</div>
                          <div className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                            {ex.sets}×{ex.reps} · {ex.rest} · RPE {ex.rpe}
                          </div>
                          {suggestions[ex.name] && (
                            <div className="text-[0.55rem] mt-0.5 flex items-center gap-1" style={{ color: "#34C759" }}>
                              <TrendingUp size={10} />
                              {suggestions[ex.name].reason}
                            </div>
                          )}
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
                      {isEditingThis && (
                        <div className="mt-2 py-2 px-2 rounded-lg grid grid-cols-2 gap-2" style={{ background: "var(--bg-elevated)" }}>
                          <div className="col-span-2">
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Nombre</label>
                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => updateExercise(day.id, i, { name: e.target.value })}
                              className="w-full text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Sets</label>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(day.id, i, { sets: parseInt(e.target.value) || 0 })}
                              className="w-full text-center text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Reps</label>
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={(e) => updateExercise(day.id, i, { reps: e.target.value })}
                              className="w-full text-center text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Descanso</label>
                            <input
                              type="text"
                              value={ex.rest}
                              onChange={(e) => updateExercise(day.id, i, { rest: e.target.value })}
                              className="w-full text-center text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>RPE</label>
                            <input
                              type="text"
                              value={ex.rpe}
                              onChange={(e) => updateExercise(day.id, i, { rpe: e.target.value })}
                              className="w-full text-center text-[0.75rem] py-1.5 px-2 rounded-lg text-[var(--text)]"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[0.55rem] uppercase mb-0.5" style={{ color: "var(--text-secondary)" }}>Notas</label>
                            <input
                              type="text"
                              value={ex.notes || ""}
                              onChange={(e) => updateExercise(day.id, i, { notes: e.target.value || undefined })}
                              placeholder="Notas opcionales..."
                              className="w-full text-[0.72rem] py-1.5 px-2 rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)]"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
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
                  className="w-full mt-2 py-2 rounded-lg text-[0.72rem] font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: "var(--bg-elevated)", color: "var(--accent)", border: "1px dashed var(--border)" }}
                >
                  <Plus size={14} /> Agregar Ejercicio
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add day button */}
      <button
        onClick={addDay}
        className="w-full mt-2 py-3 rounded-xl font-bold text-[0.78rem] flex items-center justify-center gap-2"
        style={{ background: "var(--bg-elevated)", color: "var(--accent)", border: "1px dashed var(--border)" }}
      >
        <Plus size={16} /> Agregar Día
      </button>

      {/* Summary */}
      <div className="mt-4 text-center text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
        {routine.days.length} días · {routine.days.reduce((s, d) => s + d.exercises.length, 0)} ejercicios totales
      </div>
    </main>
  );
}

export default function RoutineEditorPage() {
  return (
    <PageTransition>
    <Suspense fallback={<div className="py-10 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</div>}>
      <RoutineEditorContent />
    </Suspense>
    </PageTransition>
  );
}
