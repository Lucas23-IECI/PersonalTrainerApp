"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  BarChart3,
  CalendarDays,
  Trash2,
  Edit,
  MoreVertical,
  Archive,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import { today } from "@/lib/storage";
import {
  type Habit,
  type TimeOfDay,
  getActiveHabits,
  getHabitCompletionForDate,
  getDayCompletionRate,
  getHabitStreak,
  logHabitCompletion,
  unlogHabitCompletion,
  getLogsForHabitAndDate,
  getTimeSlotsForHabit,
  getTimeOfDayLabel,
  deleteHabit,
  saveHabit,
} from "@/lib/habits";
import HabitForm from "@/components/habits/HabitForm";
import HabitCalendar from "@/components/habits/HabitCalendar";
import HabitStats from "@/components/habits/HabitStats";

type View = "today" | "calendar" | "stats";

const TIME_ICONS: Record<string, typeof Sun> = {
  morning: Sun,
  afternoon: Sunset,
  night: Moon,
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [view, setView] = useState<View>("today");
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [expandedTime, setExpandedTime] = useState<Record<string, boolean>>({
    morning: true,
    afternoon: true,
    night: true,
    anytime: true,
  });

  const d = today();

  const reload = useCallback(() => {
    setHabits(getActiveHabits());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const dayRate = getDayCompletionRate(d);

  // Group habits by time
  const grouped = {
    morning: habits.filter(h => getTimeSlotsForHabit(h).includes("morning")),
    afternoon: habits.filter(h => getTimeSlotsForHabit(h).includes("afternoon")),
    night: habits.filter(h => getTimeSlotsForHabit(h).includes("night")),
    anytime: habits.filter(h => getTimeSlotsForHabit(h).includes(null)),
  };

  const hasTimeGroups = grouped.morning.length > 0 || grouped.afternoon.length > 0 || grouped.night.length > 0;

  function handleToggle(habit: Habit, timeOfDay: TimeOfDay | null) {
    const logs = getLogsForHabitAndDate(habit.id, d);
    const isCompleted = logs.some(l => l.timeOfDay === timeOfDay && l.completed);
    if (isCompleted) {
      unlogHabitCompletion(habit.id, d, timeOfDay);
    } else {
      logHabitCompletion(habit.id, timeOfDay);
    }
    reload();
  }

  function handleDelete(id: string) {
    if (confirm(t("habits.confirmDelete"))) {
      deleteHabit(id);
      reload();
      setMenuOpen(null);
    }
  }

  function handleArchive(habit: Habit) {
    saveHabit({ ...habit, archived: true });
    reload();
    setMenuOpen(null);
  }

  function toggleSection(key: string) {
    setExpandedTime(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function renderHabitRow(habit: Habit, timeOfDay: TimeOfDay | null) {
    const logs = getLogsForHabitAndDate(habit.id, d);
    const isCompleted = logs.some(l => l.timeOfDay === timeOfDay && l.completed);
    const { done, total } = getHabitCompletionForDate(habit.id, d);
    const streak = getHabitStreak(habit.id);

    return (
      <div
        key={`${habit.id}-${timeOfDay}`}
        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] relative"
      >
        <button
          onClick={() => handleToggle(habit, timeOfDay)}
          className="flex-shrink-0 transition-transform active:scale-90"
        >
          {isCompleted ? (
            <CheckCircle2 size={28} className="text-green-500" />
          ) : (
            <Circle size={28} className="text-[var(--text-muted)]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{habit.icon || "⭐"}</span>
            <span className={`font-medium truncate ${isCompleted ? "line-through text-[var(--text-muted)]" : ""}`}>
              {habit.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
            {total > 1 && <span>{done}/{total}</span>}
            {streak.current > 0 && (
              <span className="flex items-center gap-0.5">
                <Flame size={12} className="text-orange-500" /> {streak.current}
              </span>
            )}
          </div>
        </div>

        {/* Dot menu */}
        <button
          onClick={() => setMenuOpen(menuOpen === habit.id ? null : habit.id)}
          className="p-1 rounded-lg"
        >
          <MoreVertical size={18} className="text-[var(--text-muted)]" />
        </button>

        {menuOpen === habit.id && (
          <div className="absolute right-2 top-12 z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => { setEditingHabit(habit); setShowForm(true); setMenuOpen(null); }}
              className="flex items-center gap-2 px-4 py-2.5 w-full text-sm hover:bg-[var(--bg-base)]"
            >
              <Edit size={14} /> {t("common.edit")}
            </button>
            <button
              onClick={() => handleArchive(habit)}
              className="flex items-center gap-2 px-4 py-2.5 w-full text-sm hover:bg-[var(--bg-base)]"
            >
              <Archive size={14} /> {t("habits.archive")}
            </button>
            <button
              onClick={() => handleDelete(habit.id)}
              className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-red-500 hover:bg-[var(--bg-base)]"
            >
              <Trash2 size={14} /> {t("common.delete")}
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderTimeGroup(key: string, label: string, habitList: Habit[], timeOfDay: TimeOfDay | null) {
    if (!habitList.length) return null;
    const Icon = TIME_ICONS[key] || Sun;
    const expanded = expandedTime[key];
    return (
      <div key={key} className="space-y-2">
        <button
          onClick={() => toggleSection(key)}
          className="flex items-center gap-2 w-full text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide"
        >
          <Icon size={16} />
          {label}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {expanded && (
          <div className="space-y-2">
            {habitList.map(h => renderHabitRow(h, timeOfDay))}
          </div>
        )}
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-base)]/80 backdrop-blur-lg border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-[var(--bg-elevated)]">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">{t("habits.title")}</h1>
            </div>
            <button
              onClick={() => { setEditingHabit(null); setShowForm(true); }}
              className="p-2 rounded-xl bg-[var(--accent)] text-white"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* View tabs */}
          <div className="flex gap-1 mt-3 p-1 bg-[var(--bg-elevated)] rounded-xl">
            {([
              { key: "today" as View, label: t("habits.todayTab"), icon: CheckCircle2 },
              { key: "calendar" as View, label: t("habits.calendarTab"), icon: CalendarDays },
              { key: "stats" as View, label: t("habits.statsTab"), icon: BarChart3 },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === tab.key
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 mt-4 space-y-4">
          {view === "today" && (
            <>
              {/* Day ring */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)]">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke="var(--accent)"
                      strokeWidth="3"
                      strokeDasharray={`${dayRate * 0.975} 97.5`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {dayRate}%
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{t("habits.todayProgress")}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {habits.length} {t("habits.habitsCount")}
                  </p>
                </div>
              </div>

              {habits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted)] mb-4">{t("habits.empty")}</p>
                  <button
                    onClick={() => { setEditingHabit(null); setShowForm(true); }}
                    className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
                  >
                    {t("habits.createFirst")}
                  </button>
                </div>
              ) : hasTimeGroups ? (
                <div className="space-y-4">
                  {renderTimeGroup("morning", t("habits.morning"), grouped.morning, "morning")}
                  {renderTimeGroup("afternoon", t("habits.afternoon"), grouped.afternoon, "afternoon")}
                  {renderTimeGroup("night", t("habits.night"), grouped.night, "night")}
                  {renderTimeGroup("anytime", t("habits.anytime"), grouped.anytime, null)}
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.map(h => renderHabitRow(h, null))}
                </div>
              )}
            </>
          )}

          {view === "calendar" && <HabitCalendar habits={habits} />}
          {view === "stats" && <HabitStats habits={habits} />}
        </div>

        {/* Form Modal */}
        {showForm && (
          <HabitForm
            habit={editingHabit}
            onClose={() => { setShowForm(false); setEditingHabit(null); }}
            onSave={() => { setShowForm(false); setEditingHabit(null); reload(); }}
          />
        )}
      </div>
    </PageTransition>
  );
}
