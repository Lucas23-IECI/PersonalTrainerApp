"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { GripVertical, RotateCcw, Dumbbell, ArrowRight } from "lucide-react";
import type { WorkoutDay, Exercise } from "@/data/workouts";
import {
  getWeeklyPlanWithTransfers,
  transferExercise,
  resetExerciseTransfers,
  hasExerciseTransfers,
} from "@/data/workouts";

interface Props {
  plan: WorkoutDay[];
  onPlanChange?: () => void;
}

export default function WeeklyPlannerDnD({ plan: initialPlan, onPlanChange }: Props) {
  const [plan, setPlan] = useState(() => getWeeklyPlanWithTransfers());
  const [activeExercise, setActiveExercise] = useState<{ dayId: string; index: number; exercise: Exercise } | null>(null);
  const [hasOverrides, setHasOverrides] = useState(hasExerciseTransfers());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    const [dayId, indexStr] = id.split(":::");
    const index = parseInt(indexStr, 10);
    const day = plan.find((d) => d.id === dayId);
    if (day && day.exercises[index]) {
      setActiveExercise({ dayId, index, exercise: day.exercises[index] });
    }
  }, [plan]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveExercise(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const [fromDayId, fromIndexStr] = activeId.split(":::");
    const fromIndex = parseInt(fromIndexStr, 10);

    // Dropped on a day container
    if (overId.startsWith("day-drop-")) {
      const toDayId = overId.replace("day-drop-", "");
      if (toDayId === fromDayId) return;

      // Move exercise
      transferExercise(fromDayId, fromIndex, toDayId);
      setPlan(getWeeklyPlanWithTransfers());
      setHasOverrides(true);
      onPlanChange?.();
      return;
    }

    // Dropped on another exercise
    const [toDayId, toIndexStr] = overId.split(":::");
    if (!toDayId || toIndexStr === undefined) return;

    if (fromDayId !== toDayId) {
      transferExercise(fromDayId, fromIndex, toDayId);
      setPlan(getWeeklyPlanWithTransfers());
      setHasOverrides(true);
      onPlanChange?.();
    } else {
      // Reorder within same day — just visual, update plan state
      const day = plan.find((d) => d.id === fromDayId);
      if (!day) return;
      const toIndex = parseInt(toIndexStr, 10);
      const newExercises = arrayMove(day.exercises, fromIndex, toIndex);
      setPlan((prev) =>
        prev.map((d) => (d.id === fromDayId ? { ...d, exercises: newExercises } : d))
      );
    }
  }, [plan, onPlanChange]);

  function handleReset() {
    resetExerciseTransfers();
    setPlan(getWeeklyPlanWithTransfers());
    setHasOverrides(false);
    onPlanChange?.();
  }

  const workoutDays = plan.filter((d) => d.exercises.length > 0 || d.type !== "rest");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[0.6rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Mover Ejercicios entre Días
          </div>
          <div className="text-[0.5rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Arrastrá un ejercicio a otro día
          </div>
        </div>
        {hasOverrides && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[0.6rem] font-semibold bg-transparent border-none cursor-pointer p-1.5 rounded-lg"
            style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
          >
            <RotateCcw size={11} /> Resetear
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-2">
          {workoutDays.map((day) => (
            <DroppableDayColumn key={day.id} day={day} />
          ))}
        </div>
        <DragOverlay>
          {activeExercise && (
            <ExercisePill exercise={activeExercise.exercise} isDragging />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function DroppableDayColumn({ day }: { day: WorkoutDay }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-drop-${day.id}` });

  return (
    <div
      ref={setNodeRef}
      className="card transition-all"
      style={{
        borderColor: isOver ? day.color : undefined,
        borderWidth: isOver ? 2 : undefined,
        background: isOver ? day.color + "08" : undefined,
      }}
    >
      {/* Day header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-6 rounded-full"
          style={{ background: day.color }}
        />
        <div className="flex-1">
          <div className="text-[0.7rem] font-bold" style={{ color: "var(--text)" }}>
            {day.day} — {day.name}
          </div>
          <div className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
            {day.focus} · {day.exercises.length} ejercicios
          </div>
        </div>
        <Dumbbell size={14} style={{ color: day.color }} />
      </div>

      {/* Exercises — sortable */}
      <SortableContext
        items={day.exercises.map((_, i) => `${day.id}:::${i}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {day.exercises.map((exercise, index) => (
            <SortableExercise
              key={`${day.id}:::${index}`}
              id={`${day.id}:::${index}`}
              exercise={exercise}
              color={day.color}
            />
          ))}
        </div>
      </SortableContext>

      {day.exercises.length === 0 && (
        <div
          className="text-center py-3 text-[0.6rem] rounded-lg border-2 border-dashed"
          style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
        >
          Soltá un ejercicio acá
        </div>
      )}
    </div>
  );
}

function SortableExercise({ id, exercise, color }: { id: string; exercise: Exercise; color: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing shrink-0 p-0.5"
        style={{ color: "var(--text-secondary)" }}
      >
        <GripVertical size={12} />
      </div>
      <ExercisePill exercise={exercise} color={color} />
    </div>
  );
}

function ExercisePill({ exercise, isDragging, color }: { exercise: Exercise; isDragging?: boolean; color?: string }) {
  return (
    <div
      className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[0.6rem] transition-shadow"
      style={{
        background: isDragging ? "var(--bg-card)" : "var(--bg-elevated)",
        boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.2)" : undefined,
        border: isDragging ? "1px solid var(--accent)" : "1px solid transparent",
      }}
    >
      <span className="font-semibold truncate" style={{ color: "var(--text)" }}>
        {exercise.name}
      </span>
      <span className="shrink-0 ml-2" style={{ color: color || "var(--text-muted)" }}>
        {exercise.sets}×{exercise.reps}
      </span>
    </div>
  );
}
