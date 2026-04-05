"use client";

import { useState } from "react";
import type { WorkoutDay } from "@/data/workouts";
import { saveWeekSwap, hasWeekOverrides, resetWeekOverrides } from "@/data/workouts";
import DayCard from "./DayCard";
import WorkoutTips from "./WorkoutTips";
import { Clock, Dumbbell, Flame, GripVertical, RotateCcw } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TodayViewProps {
  plan: WorkoutDay[];
  todayWorkout: WorkoutDay | undefined;
  onStart: (dayId: string) => void;
  onPlanChange?: () => void;
}

export default function TodayView({ plan, todayWorkout, onStart, onPlanChange }: TodayViewProps) {
  const [expandedCompact, setExpandedCompact] = useState<string | null>(null);
  const [localPlan, setLocalPlan] = useState(plan);
  const [showReset, setShowReset] = useState(hasWeekOverrides());

  const otherDays = localPlan.filter((w) => w.id !== todayWorkout?.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = otherDays.findIndex((w) => w.id === active.id);
    const newIdx = otherDays.findIndex((w) => w.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const reordered = arrayMove(otherDays, oldIdx, newIdx);
    // Rebuild full plan: today first, then reordered
    const newPlan = todayWorkout ? [todayWorkout, ...reordered] : reordered;
    setLocalPlan(newPlan);
    saveWeekSwap(newPlan.map((w) => w.id));
    setShowReset(true);
    onPlanChange?.();
  }

  function handleReset() {
    resetWeekOverrides();
    setShowReset(false);
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Hero card — today's workout */}
      {todayWorkout ? (
        <HeroCard workout={todayWorkout} onStart={onStart} />
      ) : (
        <div className="card text-center py-8">
          <div className="text-3xl mb-2">🎉</div>
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>Día de descanso</div>
          <div className="text-[0.7rem] text-zinc-500 mt-1">Recuperá y volvé mañana más fuerte</div>
        </div>
      )}

      {/* Rest of the week — draggable compact cards */}
      {otherDays.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-1">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider font-semibold">
              Resto de la semana
            </div>
            {showReset && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[0.6rem] text-[var(--accent)] bg-transparent border-none cursor-pointer p-0 font-semibold"
              >
                <RotateCcw size={10} /> Resetear
              </button>
            )}
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={otherDays.map((w) => w.id)} strategy={verticalListSortingStrategy}>
              {otherDays.map((w) => (
                <SortableDayCard
                  key={w.id}
                  workout={w}
                  isExpanded={expandedCompact === w.id}
                  onToggle={() => setExpandedCompact(expandedCompact === w.id ? null : w.id)}
                  onStart={onStart}
                />
              ))}
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}

function SortableDayCard({ workout, isExpanded, onToggle, onStart }: {
  workout: WorkoutDay;
  isExpanded: boolean;
  onToggle: () => void;
  onStart: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: workout.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      <div
        {...attributes}
        {...listeners}
        className="mt-3 cursor-grab active:cursor-grabbing text-zinc-600 shrink-0"
      >
        <GripVertical size={14} />
      </div>
      <div className="flex-1">
        <DayCard
          workout={workout}
          isToday={false}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onStart={onStart}
          compact
        />
      </div>
    </div>
  );
}

function HeroCard({ workout: w, onStart }: { workout: WorkoutDay; onStart: (id: string) => void }) {
  const isRest = w.type === "rest" || w.type === "optional";
  const previewExercises = w.exercises.slice(0, 4);
  const remaining = w.exercises.length - previewExercises.length;

  if (isRest && w.exercises.length === 0) {
    return (
      <div className="card text-center py-8" style={{ borderColor: w.color + "40" }}>
        <div className="text-3xl mb-2">🧘</div>
        <div className="text-sm font-bold" style={{ color: w.color }}>{w.name}</div>
        <div className="text-[0.7rem] text-zinc-500 mt-1">Recuperación activa</div>
      </div>
    );
  }

  return (
    <div
      className="card overflow-hidden"
      style={{ borderColor: w.color + "50" }}
    >
      {/* Top accent stripe */}
      <div className="h-1 -mx-4 -mt-4 mb-3" style={{ background: w.color }} />

      <div className="flex items-center gap-2 mb-1">
        <span
          className="text-[0.55rem] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: w.color }}
        >
          HOY
        </span>
        <span className="text-[0.65rem] text-zinc-500 font-medium">{w.day}</span>
      </div>

      <div className="text-lg font-extrabold mb-1" style={{ color: w.color }}>
        {w.name}
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <span className="badge badge-blue flex items-center gap-1">
          <Dumbbell size={10} /> {w.focus}
        </span>
        <span className="badge badge-blue flex items-center gap-1">
          <Clock size={10} /> {w.duration}
        </span>
        <span className="badge badge-blue flex items-center gap-1">
          <Flame size={10} /> {w.exercises.length} ejercicios
        </span>
      </div>

      {/* Smart tips */}
      <WorkoutTips workout={w} />

      {/* Exercise preview */}
      <div className="mb-3">
        {previewExercises.map((ex, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-1.5 text-[0.75rem]"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="font-semibold" style={{ color: "var(--text)" }}>{ex.name}</span>
            <span className="text-zinc-500">{ex.sets}×{ex.reps}</span>
          </div>
        ))}
        {remaining > 0 && (
          <div className="text-[0.68rem] text-zinc-500 mt-1.5">
            +{remaining} ejercicio{remaining > 1 ? "s" : ""} más
          </div>
        )}
      </div>

      {w.note && (
        <div
          className="text-[0.68rem] text-zinc-400 mb-3 py-2 px-3 rounded-lg"
          style={{
            background: "var(--bg-elevated)",
            borderLeft: `3px solid ${w.color}`,
          }}
        >
          {w.note}
        </div>
      )}

      {w.type !== "football" && (
        <button
          onClick={() => onStart(w.id)}
          className="btn btn-primary w-full text-[0.88rem] font-bold"
        >
          💪 Empezar Entrenamiento
        </button>
      )}
    </div>
  );
}
