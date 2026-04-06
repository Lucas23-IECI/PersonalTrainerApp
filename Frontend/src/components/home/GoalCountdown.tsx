"use client";

import { useState, useEffect } from "react";
import { daysUntil } from "@/data/profile";
import { getGoals, saveGoal, deleteGoal, generateId, today, type UserGoal } from "@/lib/storage";
import { Target, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  currentWeight: number;
  goalWeight: number;
  startWeight: number;
  brazilDate: string;
}

const GOAL_ICONS = ["🎯", "🏋️", "✈️", "🏃", "💪", "🏆", "📅", "⚡", "🔥", "🎓"];
const GOAL_COLORS = ["#0A84FF", "#FF9500", "#FF375F", "#34C759", "#5E5CE6", "#FFD60A", "#FF453A", "#BF5AF2"];

export default function GoalCountdown({ currentWeight, goalWeight, startWeight, brazilDate }: Props) {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = getGoals();
    // Seed Brazil goal if no goals exist
    if (stored.length === 0) {
      const seed: UserGoal = {
        id: "brazil-2027",
        name: "Brasil 2027",
        targetDate: brazilDate,
        type: "weight",
        icon: "✈️",
        color: "#0A84FF",
        currentValue: currentWeight,
        targetValue: goalWeight,
        unit: "kg",
        createdAt: today(),
      };
      saveGoal(seed);
      setGoals([seed]);
    } else {
      // Update Brazil goal weight progress if it exists
      const updated = stored.map((g) =>
        g.id === "brazil-2027" ? { ...g, currentValue: currentWeight } : g
      );
      setGoals(updated);
    }
  }, [currentWeight, goalWeight, brazilDate]);

  const activeGoals = goals.filter((g) => daysUntil(g.targetDate) > 0);
  const primaryGoal = activeGoals[0];
  const extraGoals = activeGoals.slice(1);

  if (activeGoals.length === 0 && !showAdd) {
    return (
      <div className="card mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[0.65rem] font-semibold bg-transparent border-none cursor-pointer"
          style={{ color: "var(--accent)" }}
        >
          <Plus size={14} /> Agregar meta con countdown
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      {/* Primary goal */}
      {primaryGoal && <GoalCard goal={primaryGoal} startWeight={startWeight} onDelete={handleDelete} />}

      {/* Extra goals (expandable) */}
      {extraGoals.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 py-1 text-[0.55rem] bg-transparent border-none cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {extraGoals.length} meta{extraGoals.length > 1 ? "s" : ""} más
          </button>
          {expanded && extraGoals.map((g) => (
            <GoalCard key={g.id} goal={g} startWeight={startWeight} onDelete={handleDelete} small />
          ))}
        </>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 text-[0.55rem] font-semibold bg-transparent border-none cursor-pointer rounded-lg"
        style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
      >
        <Plus size={12} /> Nueva meta
      </button>

      {/* Add modal */}
      {showAdd && (
        <AddGoalSheet
          onSave={(goal) => {
            saveGoal(goal);
            setGoals(getGoals());
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );

  function handleDelete(id: string) {
    deleteGoal(id);
    setGoals(getGoals());
  }
}

function GoalCard({ goal, startWeight, onDelete, small }: {
  goal: UserGoal;
  startWeight: number;
  onDelete: (id: string) => void;
  small?: boolean;
}) {
  const daysLeft = daysUntil(goal.targetDate);
  const hasProgress = goal.currentValue !== undefined && goal.targetValue !== undefined;

  let progressPct = 0;
  let remaining = "";
  if (hasProgress && goal.type === "weight") {
    const totalToLose = startWeight - goal.targetValue!;
    const lost = startWeight - goal.currentValue!;
    progressPct = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100))) : 0;
    remaining = `${goal.currentValue} → ${goal.targetValue} ${goal.unit || "kg"} · ${Math.max(0, goal.currentValue! - goal.targetValue!).toFixed(1)} por bajar`;
  } else if (hasProgress) {
    const total = Math.abs(goal.targetValue! - (goal.currentValue || 0));
    const done = Math.abs((goal.currentValue || 0));
    progressPct = total > 0 ? Math.min(100, Math.max(0, Math.round((done / goal.targetValue!) * 100))) : 0;
    remaining = `${goal.currentValue || 0} / ${goal.targetValue} ${goal.unit || ""}`;
  }

  return (
    <div className={small ? "mt-2 pt-2 border-t" : ""} style={small ? { borderColor: "var(--border)" } : undefined}>
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className={`${small ? "w-6 h-6" : "w-8 h-8"} rounded-xl flex items-center justify-center`}
          style={{ background: goal.color + "20" }}
        >
          <span className={small ? "text-xs" : "text-sm"}>{goal.icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`${small ? "text-[0.6rem]" : "text-[0.7rem]"} font-semibold`} style={{ color: "var(--text)" }}>
              {goal.name}
            </span>
            <div className="flex items-center gap-2">
              <span className={`${small ? "text-[0.5rem]" : "text-[0.6rem]"} font-bold`} style={{ color: goal.color }}>
                {daysLeft} días
              </span>
              {goal.id !== "brazil-2027" && (
                <button
                  onClick={() => onDelete(goal.id)}
                  className="bg-transparent border-none cursor-pointer p-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
          {remaining && (
            <div className={`${small ? "text-[0.48rem]" : "text-[0.58rem]"}`} style={{ color: "var(--text-muted)" }}>
              {remaining}
            </div>
          )}
        </div>
      </div>
      {hasProgress && (
        <>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPct}%`, background: goal.color }}
            />
          </div>
          <div className="text-right mt-0.5">
            <span className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>
              {progressPct}% completado
            </span>
          </div>
        </>
      )}
      {!hasProgress && (
        <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: "var(--bg-elevated)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(2, 100 - (daysLeft / 365) * 100)}%`,
              background: goal.color,
            }}
          />
        </div>
      )}
    </div>
  );
}

function AddGoalSheet({ onSave, onClose }: { onSave: (g: UserGoal) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#0A84FF");
  const [type, setType] = useState<UserGoal["type"]>("date");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("kg");

  function handleSave() {
    if (!name.trim() || !date) return;
    const goal: UserGoal = {
      id: generateId(),
      name: name.trim(),
      targetDate: date,
      type,
      icon,
      color,
      createdAt: today(),
      ...(type !== "date" && target ? { targetValue: parseFloat(target), currentValue: 0, unit } : {}),
    };
    onSave(goal);
  }

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="text-[0.65rem] font-bold mb-2" style={{ color: "var(--text)" }}>
        Nueva Meta
      </div>

      <input
        type="text"
        placeholder="Nombre de la meta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-[0.65rem] border-none outline-none mb-2"
        style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
        maxLength={50}
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-[0.65rem] border-none outline-none mb-2"
        style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
      />

      {/* Type selector */}
      <div className="flex gap-1 mb-2">
        {(["date", "weight", "strength", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-1.5 rounded-lg text-[0.55rem] font-bold border-none cursor-pointer"
            style={{
              background: type === t ? "var(--accent)" : "var(--bg-elevated)",
              color: type === t ? "white" : "var(--text-muted)",
            }}
          >
            {t === "date" ? "Fecha" : t === "weight" ? "Peso" : t === "strength" ? "Fuerza" : "Custom"}
          </button>
        ))}
      </div>

      {type !== "date" && (
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            placeholder="Objetivo"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-[0.65rem] border-none outline-none"
            style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
          />
          <input
            type="text"
            placeholder="un."
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-16 px-2 py-2 rounded-lg text-[0.65rem] border-none outline-none text-center"
            style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
            maxLength={10}
          />
        </div>
      )}

      {/* Icon picker */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {GOAL_ICONS.map((ic) => (
          <button
            key={ic}
            onClick={() => setIcon(ic)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm border-none cursor-pointer"
            style={{
              background: icon === ic ? "var(--accent-soft)" : "var(--bg-elevated)",
              border: icon === ic ? "1px solid var(--accent)" : "1px solid transparent",
            }}
          >
            {ic}
          </button>
        ))}
      </div>

      {/* Color picker */}
      <div className="flex gap-1 mb-3">
        {GOAL_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-5 h-5 rounded-full border-none cursor-pointer"
            style={{
              background: c,
              outline: color === c ? `2px solid ${c}` : "none",
              outlineOffset: 2,
            }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg text-[0.65rem] font-bold border-none cursor-pointer"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !date}
          className="flex-1 py-2 rounded-lg text-[0.65rem] font-bold border-none cursor-pointer"
          style={{
            background: name.trim() && date ? "var(--accent)" : "var(--bg-elevated)",
            color: name.trim() && date ? "white" : "var(--text-muted)",
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
