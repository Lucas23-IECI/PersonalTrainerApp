"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  getActiveFaceRoutines,
  getFaceRoutineById,
  getFaceExercises,
  saveFaceRoutine,
  createFaceRoutine,
  deleteFaceRoutine,
  type FaceRoutine,
  type FaceRoutineExercise,
  type FaceExercise,
} from "@/lib/face-exercises";

const ROUTINE_ICONS = ["🧘", "👍", "👅", "💪", "🎯", "⭐", "🔥", "❤️"];

function RoutinesContent() {
  const params = useSearchParams();
  const editId = params.get("edit");

  const [routines, setRoutines] = useState<FaceRoutine[]>([]);
  const [editing, setEditing] = useState<FaceRoutine | null>(null);
  const [exercises, setExercises] = useState<FaceExercise[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🧘");
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [routineExercises, setRoutineExercises] = useState<FaceRoutineExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  useEffect(() => {
    setRoutines(getActiveFaceRoutines());
    setExercises(getFaceExercises());
  }, []);

  useEffect(() => {
    if (editId) {
      const r = getFaceRoutineById(editId);
      if (r) openEditor(r);
    }
  }, [editId]);

  function openEditor(r: FaceRoutine | null) {
    if (r) {
      setEditing(r);
      setName(r.name);
      setIcon(r.icon);
      setTimesPerDay(r.timesPerDay);
      setRoutineExercises([...r.exercises]);
    } else {
      setEditing(null);
      setName("");
      setIcon("🧘");
      setTimesPerDay(1);
      setRoutineExercises([]);
    }
  }

  function handleSave() {
    if (!name.trim()) return;
    if (editing) {
      saveFaceRoutine({
        ...editing,
        name: name.trim(),
        icon,
        timesPerDay,
        exercises: routineExercises,
      });
    } else {
      createFaceRoutine({
        name: name.trim(),
        icon,
        timesPerDay,
        exercises: routineExercises,
      });
    }
    setEditing(null);
    setRoutines(getActiveFaceRoutines());
  }

  function addExercise(exerciseId: string) {
    setRoutineExercises(prev => [
      ...prev,
      {
        exerciseId,
        order: prev.length,
        duration: exercises.find(e => e.id === exerciseId)?.defaultDuration,
        reps: exercises.find(e => e.id === exerciseId)?.defaultReps,
      },
    ]);
    setShowExercisePicker(false);
  }

  function removeExercise(idx: number) {
    setRoutineExercises(prev => prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, order: i })));
  }

  function handleDelete(id: string) {
    if (confirm(t("face.confirmDeleteRoutine"))) {
      deleteFaceRoutine(id);
      setRoutines(getActiveFaceRoutines());
    }
  }

  // If editing
  if (editing !== null || (editId === null && name !== "") || routineExercises.length > 0 || (editing === null && editId === "new")) {
    // Show form only when explicitly opened
  }

  const showingForm = editing !== null || editId === "new";

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-base)]/80 backdrop-blur-lg border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/face" className="p-2 -ml-2 rounded-xl hover:bg-[var(--bg-elevated)]">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">{t("face.routines")}</h1>
            </div>
            {!showingForm && (
              <button
                onClick={() => openEditor(null)}
                className="p-2 rounded-xl bg-[var(--accent)] text-white"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {showingForm ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {editing ? t("face.editRoutine") : t("face.newRoutine")}
                </h2>
                <button onClick={() => { setEditing(null); }} className="p-2">
                  <X size={20} />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-[var(--text-muted)] mb-1 block">{t("habits.name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t("face.routineNamePlaceholder")}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
                  autoFocus
                />
              </div>

              {/* Icon */}
              <div>
                <span className="text-sm font-medium text-[var(--text-muted)] mb-2 block">{t("habits.icon")}</span>
                <div className="flex gap-2">
                  {ROUTINE_ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                        icon === ic ? "ring-2 ring-[var(--accent)] bg-[var(--bg-elevated)]" : "bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times per day */}
              <div>
                <span className="text-sm font-medium text-[var(--text-muted)] mb-2 block">{t("habits.timesPerDay")}</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      onClick={() => setTimesPerDay(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                        timesPerDay === n ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      }`}
                    >
                      {n}x/{t("face.day")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-muted)]">{t("face.exercises")}</span>
                  <button
                    onClick={() => setShowExercisePicker(true)}
                    className="text-xs text-[var(--accent)] font-medium"
                  >
                    + {t("face.addExercise")}
                  </button>
                </div>
                <div className="space-y-2">
                  {routineExercises.map((re, idx) => {
                    const ex = exercises.find(e => e.id === re.exerciseId);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-elevated)]">
                        <GripVertical size={16} className="text-[var(--text-muted)]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ex?.name || re.exerciseId}</p>
                          <div className="flex gap-2 mt-1">
                            {ex?.type === "timed" && (
                              <input
                                type="number"
                                inputMode="numeric"
                                value={re.duration || ""}
                                onChange={e => {
                                  const updated = [...routineExercises];
                                  updated[idx] = { ...updated[idx], duration: Number(e.target.value) };
                                  setRoutineExercises(updated);
                                }}
                                placeholder="seg"
                                className="w-20 px-2 py-1 text-xs rounded-lg bg-[var(--bg-base)] border border-[var(--border)]"
                              />
                            )}
                            {ex?.type === "reps" && (
                              <input
                                type="number"
                                inputMode="numeric"
                                value={re.reps || ""}
                                onChange={e => {
                                  const updated = [...routineExercises];
                                  updated[idx] = { ...updated[idx], reps: Number(e.target.value) };
                                  setRoutineExercises(updated);
                                }}
                                placeholder="reps"
                                className="w-20 px-2 py-1 text-xs rounded-lg bg-[var(--bg-base)] border border-[var(--border)]"
                              />
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeExercise(idx)} className="p-1 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!name.trim() || routineExercises.length === 0}
                className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {t("common.save")}
              </button>

              {/* Exercise picker modal */}
              {showExercisePicker && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
                  <div className="bg-[var(--bg-base)] w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                      <h3 className="font-bold">{t("face.selectExercise")}</h3>
                      <button onClick={() => setShowExercisePicker(false)} className="p-2">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      {exercises.map(ex => (
                        <button
                          key={ex.id}
                          onClick={() => addExercise(ex.id)}
                          className="w-full text-left p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] transition-colors"
                        >
                          <p className="font-medium text-sm">{ex.name}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{ex.description.slice(0, 60)}...</p>
                          <span className="text-[10px] text-[var(--accent)] mt-1 inline-block">
                            {ex.type === "timed" ? `${ex.defaultDuration}s` : `${ex.defaultReps} reps`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {routines.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted)] mb-4">{t("face.noRoutines")}</p>
                  <button
                    onClick={() => openEditor(null)}
                    className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
                  >
                    {t("face.createRoutine")}
                  </button>
                </div>
              ) : (
                routines.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)]"
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {r.exercises.length} {t("face.exercisesCount")} · {r.timesPerDay}x/{t("face.day")}
                        {r.isTemplate && ` · ${t("face.template")}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditor(r)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-base)] text-[var(--accent)]"
                      >
                        {t("common.edit")}
                      </button>
                      {!r.isTemplate && (
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default function FaceRoutinesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
      <RoutinesContent />
    </Suspense>
  );
}
