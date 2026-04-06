"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { t } from "@/lib/i18n";
import { type Habit, createHabit, saveHabit } from "@/lib/habits";

const ICONS = ["💪", "🧘", "💧", "📖", "🏃", "🧠", "💊", "🦷", "😴", "🍎", "✍️", "🎯", "⭐", "🔥", "❤️", "🌿"];
const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF9500", "#30D158", "#5856D6", "#FF3B30"];

interface Props {
  habit: Habit | null;
  onClose: () => void;
  onSave: () => void;
}

export default function HabitForm({ habit, onClose, onSave }: Props) {
  const [name, setName] = useState(habit?.name || "");
  const [icon, setIcon] = useState(habit?.icon || "⭐");
  const [color, setColor] = useState(habit?.color || COLORS[0]);
  const [type, setType] = useState<Habit["type"]>(habit?.type || "check");
  const [target, setTarget] = useState(habit?.target || 0);
  const [unit, setUnit] = useState(habit?.unit || "");
  const [frequency] = useState<Habit["frequency"]>(habit?.frequency || "daily");
  const [timesPerDay, setTimesPerDay] = useState(habit?.timesPerDay || 1);
  const [category, setCategory] = useState(habit?.category || "");

  function handleSave() {
    if (!name.trim()) return;
    if (habit) {
      saveHabit({
        ...habit,
        name: name.trim(),
        icon,
        color,
        type,
        target: target || undefined,
        unit: unit || undefined,
        frequency,
        timesPerDay,
        category: category || undefined,
      });
    } else {
      createHabit({
        name: name.trim(),
        icon,
        color,
        type,
        target: target || undefined,
        unit: unit || undefined,
        frequency,
        timesPerDay,
        category: category || undefined,
        reminderTimes: [],
      });
    }
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
      <div className="bg-[var(--bg-base)] w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">
            {habit ? t("habits.editHabit") : t("habits.newHabit")}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-elevated)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1 block">
              {t("habits.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t("habits.namePlaceholder")}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              autoFocus
            />
          </div>

          {/* Icon */}
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)] mb-2 block">{t("habits.icon")}</span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                    icon === ic ? "ring-2 ring-[var(--accent)] bg-[var(--bg-elevated)]" : "bg-[var(--bg-elevated)]"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)] mb-2 block">{t("habits.color")}</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-[var(--accent)]" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)] mb-2 block">{t("habits.type")}</span>
            <div className="grid grid-cols-2 gap-2">
              {(["check", "timed", "reps", "count"] as const).map(tp => (
                <button
                  key={tp}
                  onClick={() => setType(tp)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    type === tp
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  }`}
                >
                  {t(`habits.type_${tp}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Target (for timed/reps/count) */}
          {type !== "check" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-[var(--text-muted)] mb-1 block">
                  {t("habits.target")}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={target || ""}
                  onChange={e => setTarget(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>
              <div className="w-24">
                <label className="text-sm font-medium text-[var(--text-muted)] mb-1 block">
                  {t("habits.unit")}
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder={type === "timed" ? "seg" : "reps"}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>
            </div>
          )}

          {/* Times per day */}
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)] mb-2 block">
              {t("habits.timesPerDay")}
            </span>
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setTimesPerDay(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    timesPerDay === n
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  }`}
                >
                  {n === 1 ? t("habits.once") : n === 2 ? t("habits.twice") : t("habits.thrice")}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1 block">
              {t("habits.category")}
            </label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder={t("habits.categoryPlaceholder")}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold disabled:opacity-40"
          >
            {habit ? t("common.save") : t("common.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
