"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getSessions,
  deleteSession,
  saveSession,
  saveActiveSession,
  getActiveSession,
  type WorkoutSession,
  type LoggedSet,
} from "@/lib/storage";
import { MUSCLE_LABELS } from "@/data/exercises";
import {
  Dumbbell, Clock, ChevronDown, ChevronUp, Trash2, ChevronLeft,
  ChevronRight, Search, X, RefreshCw, SlidersHorizontal, Flame,
  Pencil, Check, Star,
} from "lucide-react";
import { t } from "@/lib/i18n";
import PullToRefresh from "@/components/PullToRefresh";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] as const;

// 4.3 — Simplified muscle group filters
const FILTER_MUSCLE_GROUPS = [
  { id: "chest", label: "Pecho", muscles: ["chest"] },
  { id: "back", label: "Espalda", muscles: ["upper_back", "lats", "lower_back", "traps"] },
  { id: "shoulders", label: "Hombros", muscles: ["front_delts", "side_delts", "rear_delts"] },
  { id: "arms", label: "Brazos", muscles: ["biceps", "triceps", "forearms"] },
  { id: "legs", label: "Piernas", muscles: ["quads", "hamstrings", "glutes", "calves", "adductors", "hip_flexors"] },
  { id: "core", label: "Core", muscles: ["abs", "obliques"] },
];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = first.getDay() - 1;
  if (startDow < 0) startDow = 6;
  return { startDow, lastDay };
}

export default function LogPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterExercise, setFilterExercise] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  // 4.3 — Advanced search state
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMuscleGroup, setFilterMuscleGroup] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  // 4.5 — Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<WorkoutSession | null>(null);

  useEffect(() => { loadSessions(); }, []);

  function loadSessions() {
    const all = getSessions();
    all.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.endTime || 0) - (a.endTime || 0);
    });
    setSessions(all);
  }

  // 4.1 — Per-day training stats for colored calendar
  const dayStats = useMemo(() => {
    const stats: Record<string, { count: number; volume: number; sets: number }> = {};
    sessions.forEach((s) => {
      if (!stats[s.date]) stats[s.date] = { count: 0, volume: 0, sets: 0 };
      stats[s.date].count++;
      stats[s.date].sets += s.exercises.reduce((a, e) => a + e.sets.length, 0);
      stats[s.date].volume += s.exercises.reduce(
        (a, e) => a + e.sets.reduce((v, set) => v + (set.weight || 0) * set.reps, 0), 0
      );
    });
    return stats;
  }, [sessions]);

  // 4.1 — Intensity thresholds (percentile-based from user data)
  const intensityThresholds = useMemo(() => {
    const volumes = Object.values(dayStats).map((s) => s.volume).filter((v) => v > 0);
    if (volumes.length === 0) return { low: 0, mid: 0 };
    volumes.sort((a, b) => a - b);
    return {
      low: volumes[Math.floor(volumes.length * 0.33)] || 0,
      mid: volumes[Math.floor(volumes.length * 0.66)] || 0,
    };
  }, [dayStats]);

  function getDotStyle(date: string): { color: string; size: string } | null {
    const stats = dayStats[date];
    if (!stats) return null;
    if (stats.volume <= intensityThresholds.low) return { color: "#34C75960", size: "w-1.5 h-1.5" };
    if (stats.volume <= intensityThresholds.mid) return { color: "#34C759", size: "w-1.5 h-1.5" };
    return { color: "#30D158", size: "w-2 h-2" };
  }

  // All unique exercise names for autocomplete
  const allExercises = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach((s) => s.exercises.forEach((e) => { if (!e.skipped) names.add(e.name); }));
    return Array.from(names).sort();
  }, [sessions]);

  // 4.3 — Enhanced filtered sessions (date range + muscle group)
  const filtered = useMemo(() => {
    let list = sessions;
    if (selectedDate) list = list.filter((s) => s.date === selectedDate);
    if (filterDateFrom) list = list.filter((s) => s.date >= filterDateFrom);
    if (filterDateTo) list = list.filter((s) => s.date <= filterDateTo);
    if (filterExercise) {
      const q = filterExercise.toLowerCase();
      list = list.filter((s) => s.exercises.some((e) => e.name.toLowerCase().includes(q)));
    }
    if (filterMuscleGroup) {
      const group = FILTER_MUSCLE_GROUPS.find((g) => g.id === filterMuscleGroup);
      if (group) {
        list = list.filter((s) =>
          s.exercises.some((e) => e.primaryMuscles?.some((m) => group.muscles.includes(m)))
        );
      }
    }
    return list;
  }, [sessions, selectedDate, filterExercise, filterDateFrom, filterDateTo, filterMuscleGroup]);

  const grouped = useMemo(() => {
    const g: { date: string; sessions: WorkoutSession[] }[] = [];
    filtered.forEach((s) => {
      const existing = g.find((gr) => gr.date === s.date);
      if (existing) existing.sessions.push(s);
      else g.push({ date: s.date, sessions: [s] });
    });
    return g;
  }, [filtered]);

  function formatDuration(start: number, end: number) {
    const sec = Math.floor((end - start) / 1000);
    const m = Math.floor(sec / 60);
    return `${m} min`;
  }

  function handleDelete(id: string) {
    if (!confirm(t("log.deleteSession"))) return;
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
  }

  // 4.4 — Repeat a past workout session
  function handleRepeat(session: WorkoutSession) {
    const active = getActiveSession();
    if (active) {
      if (!confirm(t("log.activeSessionWarning"))) return;
    }

    const exercises = session.exercises
      .filter((ex) => !ex.skipped)
      .map((ex, i) => ({
        name: ex.name,
        exerciseRef: {
          name: ex.name,
          sets: ex.sets.length || ex.plannedSets,
          reps: ex.plannedReps || String(ex.sets[0]?.reps || 10),
          load: ex.sets[0]?.weight ? `${ex.sets[0].weight}kg` : "",
          rest: "60s",
          primaryMuscles: ex.primaryMuscles,
        },
        exIndex: i,
        notes: "",
        restSeconds: 60,
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          completed: false,
          isWarmup: false,
          setType: s.setType || "normal",
        })),
        supersetTag: undefined,
        previousSets: ex.sets.map((s) => ({ weight: s.weight || 0, reps: s.reps })),
      }));

    saveActiveSession({
      dayId: "quickstart",
      workoutName: `${session.workoutName} (Repetir)`,
      sessionStart: Date.now(),
      exercises,
    });

    router.push("/workout/session?day=quickstart");
  }

  // 4.5 — Start editing a past session
  function startEdit(session: WorkoutSession) {
    setEditingId(session.id);
    setEditData(JSON.parse(JSON.stringify(session)));
    setExpanded(session.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData(null);
  }

  function saveEdit() {
    if (!editData) return;
    const updated = { ...editData, editedAt: Date.now() };
    saveSession(updated);
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingId(null);
    setEditData(null);
  }

  function updateEditSet(exIdx: number, setIdx: number, field: keyof LoggedSet, value: number | undefined) {
    if (!editData) return;
    const copy = JSON.parse(JSON.stringify(editData)) as WorkoutSession;
    const set = copy.exercises[exIdx].sets[setIdx];
    if (field === 'reps') set.reps = value ?? 0;
    else if (field === 'weight') set.weight = value;
    else if (field === 'rpe') set.rpe = value;
    else if (field === 'rir') set.rir = value;
    setEditData(copy);
  }

  function updateEditRating(rating: number) {
    if (!editData) return;
    setEditData({ ...editData, rating });
  }

  function updateEditNotes(notes: string) {
    if (!editData) return;
    setEditData({ ...editData, sessionNotes: notes });
  }

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.round((todayD.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return t("common.today");
    if (diff === 1) return t("common.yesterday");
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    if (diff < 7) return `${days[date.getDay()]} (hace ${diff} días)`;
    return `${days[date.getDay()]} ${day}/${m}`;
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  function clearAllFilters() {
    setSelectedDate(null);
    setFilterExercise("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMuscleGroup("");
    setShowFilter(false);
    setShowAdvanced(false);
  }

  const { startDow, lastDay } = getMonthDays(calYear, calMonth);
  const todayStr = new Date().toISOString().slice(0, 10);

  function dateStr(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const hasActiveFilters = !!selectedDate || !!filterExercise || !!filterDateFrom || !!filterDateTo || !!filterMuscleGroup;

  // 4.1 — Selected date summary
  const selectedDateStats = selectedDate ? dayStats[selectedDate] : null;

  return (
    <PullToRefresh onRefresh={loadSessions}>
    <main className="max-w-[600px] md:max-w-[960px] mx-auto px-4 py-5">
      <h1 className="text-[1.3rem] font-black tracking-tight mb-1">{t("common.history")}</h1>
      <p className="text-[0.7rem] mb-4" style={{ color: "var(--text-secondary)" }}>
        {sessions.length} {sessions.length === 1 ? t("common.session") : t("common.sessions")} {t("log.recorded")}
      </p>

      {/* 4.1 — Enhanced Calendar with intensity dots */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3">
          <button onClick={prevMonth} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}><ChevronLeft size={18} /></button>
          <span className="text-sm font-bold">{t(`months.${calMonth}`)} {calYear}</span>
          <button onClick={nextMonth} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-0 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-[0.55rem] font-bold uppercase py-1" style={{ color: "var(--text-muted)" }}>{d}</div>
          ))}
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: lastDay }).map((_, i) => {
            const day = i + 1;
            const ds = dateStr(day);
            const dotStyle = getDotStyle(ds);
            const isToday = ds === todayStr;
            const isSelected = ds === selectedDate;
            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : ds)}
                className="flex flex-col items-center py-1 cursor-pointer rounded-lg transition-colors"
                style={{ background: isSelected ? "var(--bg-elevated)" : "transparent" }}
              >
                <span className={`text-[0.7rem] leading-none ${isToday ? "font-black text-blue-500" : ""} ${isSelected ? "font-extrabold" : ""}`}
                  style={!isToday ? { color: "var(--text-secondary)" } : undefined}
                >
                  {day}
                </span>
                {dotStyle ? (
                  <div className={`${dotStyle.size} rounded-full mt-0.5`} style={{ background: dotStyle.color }} />
                ) : (
                  <div className="w-1.5 h-1.5 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* 4.1 — Selected date mini-summary */}
        {selectedDate && selectedDateStats && (
          <div className="mt-3 pt-3 flex items-center justify-between text-[0.7rem]" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>{formatDate(selectedDate)}</span>
            <div className="flex gap-3" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1"><Flame size={10} className="text-orange-500" />{selectedDateStats.count} {selectedDateStats.count === 1 ? "sesión" : "sesiones"}</span>
              <span>{selectedDateStats.sets} {t("common.sets").toLowerCase()}</span>
              {selectedDateStats.volume > 0 && <span>{(selectedDateStats.volume / 1000).toFixed(1)}k kg</span>}
            </div>
          </div>
        )}

        {/* 4.1 — Intensity legend */}
        <div className="flex items-center justify-center gap-3 mt-3 text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#34C75960" }} /> {t("intensity.light")}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#34C759" }} /> {t("intensity.medium")}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: "#30D158" }} /> {t("intensity.intense")}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <button
          onClick={() => { setShowFilter(!showFilter); setShowAdvanced(false); }}
          className="flex items-center gap-1 text-[0.7rem] px-2.5 py-1.5 rounded-lg cursor-pointer border-none transition-colors"
          style={{ background: filterExercise ? "#34C75920" : "var(--bg-card)", color: filterExercise ? "#34C759" : "var(--text-muted)" }}
        >
          <Search size={12} /> {t("common.exercise")}
        </button>
        {/* 4.3 — Advanced filter toggle */}
        <button
          onClick={() => { setShowAdvanced(!showAdvanced); setShowFilter(false); }}
          className="flex items-center gap-1 text-[0.7rem] px-2.5 py-1.5 rounded-lg cursor-pointer border-none transition-colors"
          style={{
            background: (filterDateFrom || filterDateTo || filterMuscleGroup) ? "var(--accent-soft)" : "var(--bg-card)",
            color: (filterDateFrom || filterDateTo || filterMuscleGroup) ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          <SlidersHorizontal size={12} /> {t("filter.advanced")}
        </button>
        {selectedDate && (
          <span className="flex items-center gap-1 text-[0.65rem] px-2 py-1 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
            {formatDate(selectedDate)}
            <button onClick={() => setSelectedDate(null)} className="bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)" }}><X size={12} /></button>
          </span>
        )}
        {filterMuscleGroup && (
          <span className="flex items-center gap-1 text-[0.65rem] px-2 py-1 rounded-lg" style={{ background: "#AF52DE20", color: "#AF52DE" }}>
            {FILTER_MUSCLE_GROUPS.find((g) => g.id === filterMuscleGroup)?.label}
            <button onClick={() => setFilterMuscleGroup("")} className="bg-transparent border-none cursor-pointer text-inherit p-0"><X size={10} /></button>
          </span>
        )}
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-[0.65rem] bg-transparent border-none cursor-pointer underline ml-auto" style={{ color: "var(--text-muted)" }}>
            {t("common.clear")}
          </button>
        )}
      </div>

      {/* Exercise filter panel */}
      {showFilter && (
        <div className="card mb-4">
          <input
            type="text"
            value={filterExercise}
            onChange={(e) => setFilterExercise(e.target.value)}
            placeholder={t("log.searchExercise")}
            className="w-full text-sm py-2 px-3 rounded-lg mb-2"
            style={{ background: "var(--bg-elevated)" }}
          />
          {filterExercise && (
            <div className="flex flex-wrap gap-1">
              {allExercises.filter((n) => n.toLowerCase().includes(filterExercise.toLowerCase())).slice(0, 8).map((n) => (
                <button
                  key={n}
                  onClick={() => { setFilterExercise(n); setShowFilter(false); }}
                  className="text-[0.65rem] px-2 py-1 rounded-md cursor-pointer border-none"
                  style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4.3 — Advanced filter panel */}
      {showAdvanced && (
        <div className="card mb-4 space-y-3">
          <div className="text-[0.75rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("log.advancedFilters")}</div>

          {/* Date range */}
          <div>
            <div className="text-[0.65rem] mb-1.5" style={{ color: "var(--text-muted)" }}>{t("log.dateRange")}</div>
            <div className="flex gap-2">
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="flex-1 text-[0.75rem] py-1.5 px-2 rounded-lg border-none"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", colorScheme: "dark" }}
              />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="flex-1 text-[0.75rem] py-1.5 px-2 rounded-lg border-none"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Muscle group chips */}
          <div>
            <div className="text-[0.65rem] mb-1.5" style={{ color: "var(--text-muted)" }}>{t("log.muscleGroup")}</div>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_MUSCLE_GROUPS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setFilterMuscleGroup(filterMuscleGroup === g.id ? "" : g.id)}
                  className="text-[0.65rem] px-2.5 py-1 rounded-full cursor-pointer border-none transition-colors"
                  style={{
                    background: filterMuscleGroup === g.id ? "#AF52DE" : "var(--bg-elevated)",
                    color: filterMuscleGroup === g.id ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count when filtered */}
      {hasActiveFilters && (
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? t("common.session") : t("common.sessions")} {t("common.found")}
        </p>
      )}

      {/* Session list */}
      {filtered.length === 0 && (
        <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
          <Dumbbell size={32} className="mx-auto mb-2.5 opacity-30" />
          <div className="text-[0.85rem]">{hasActiveFilters ? t("log.noResults") : t("log.noSessionsRecorded")}</div>
          <div className="text-[0.7rem] mt-1">{hasActiveFilters ? t("log.tryOtherFilters") : t("log.completeWorkoutToSee")}</div>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.date} className="mb-4">
          <div className="text-[0.7rem] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            {formatDate(group.date)}
          </div>
          {group.sessions.map((s) => {
            const isOpen = expanded === s.id;
            const totalSets = s.exercises.reduce((acc, e) => acc + e.sets.length, 0);
            const totalVolume = s.exercises.reduce((acc, e) => acc + e.sets.reduce((a2, set) => a2 + (set.weight || 0) * set.reps, 0), 0);
            const skipped = s.exercises.filter((e) => e.skipped).length;
            const done = s.exercises.length - skipped;
            // 4.2 — Extra metrics for expanded detail
            const musclesWorked = [...new Set(s.exercises.flatMap((e) => e.primaryMuscles || []))];
            const allRpes = s.exercises.flatMap((e) => e.sets.filter((set) => set.rpe).map((set) => set.rpe!));
            const avgRpe = allRpes.length > 0 ? (allRpes.reduce((a, b) => a + b, 0) / allRpes.length).toFixed(1) : null;

            return (
              <div key={s.id} className="card mb-1.5">
                <div onClick={() => { if (editingId !== s.id) setExpanded(isOpen ? null : s.id); }} className="cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[0.9rem] font-extrabold">{s.workoutName}</span>
                        {/* 4.6 — Rating stars display */}
                        {s.rating && (
                          <span className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <Star key={v} size={10} fill={v <= s.rating! ? '#FFD700' : 'transparent'} strokeWidth={1.5}
                                style={{ color: v <= s.rating! ? '#FFD700' : 'var(--border)' }} />
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 text-[0.65rem]" style={{ color: "var(--text-secondary)" }}>
                        {s.startTime && s.endTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} /> {formatDuration(s.startTime, s.endTime)}
                          </span>
                        )}
                        <span>{totalSets} sets</span>
                        {totalVolume > 0 && <span>{totalVolume.toLocaleString()}kg vol</span>}
                      </div>
                      {/* 4.6 — Session notes preview */}
                      {s.sessionNotes && !isOpen && (
                        <div className="text-[0.62rem] mt-1 italic truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{s.sessionNotes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* 4.5 — Edit button */}
                      {editingId === s.id ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                            className="bg-transparent border-none cursor-pointer text-green-500 p-1 transition-colors"
                            title="Guardar cambios"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                            className="bg-transparent border-none cursor-pointer p-1 transition-colors" style={{ color: "var(--text-muted)" }}
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(s); }}
                            className="bg-transparent border-none cursor-pointer hover:text-yellow-500 p-1 transition-colors" style={{ color: "var(--text-muted)" }}
                            title="Editar sesión"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* 4.4 — Repeat button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRepeat(s); }}
                            className="bg-transparent border-none cursor-pointer hover:text-blue-500 p-1 transition-colors" style={{ color: "var(--text-muted)" }}
                            title="Repetir sesión"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                            className="bg-transparent border-none cursor-pointer hover:text-[#FF3B30] p-1 transition-colors" style={{ color: "var(--text-muted)" }}
                            title="Eliminar sesión"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      <div style={{ color: "var(--text-secondary)" }}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3">
                    {/* 4.2 — Metrics summary bar */}
                    <div className="grid grid-cols-4 gap-2 mb-3 text-center py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                      <div>
                        <div className="text-[0.55rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("common.duration")}</div>
                        <div className="text-[0.85rem] font-bold">{s.startTime && s.endTime ? formatDuration(s.startTime, s.endTime) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[0.55rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("common.sets")}</div>
                        <div className="text-[0.85rem] font-bold">{totalSets}</div>
                      </div>
                      <div>
                        <div className="text-[0.55rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("common.volume")}</div>
                        <div className="text-[0.85rem] font-bold">{totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[0.55rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>RPE</div>
                        <div className="text-[0.85rem] font-bold">{avgRpe || "—"}</div>
                      </div>
                    </div>

                    {/* 4.5/4.6 — Editable rating + notes */}
                    {editingId === s.id && editData ? (
                      <div className="mb-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>Rating:</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <button key={v} onClick={() => updateEditRating(v)} className="bg-transparent border-none cursor-pointer p-0">
                                <Star size={16} fill={v <= (editData.rating || 0) ? '#FFD700' : 'transparent'} strokeWidth={1.5}
                                  style={{ color: v <= (editData.rating || 0) ? '#FFD700' : 'var(--text-muted)' }} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={editData.sessionNotes || ""}
                          onChange={(e) => updateEditNotes(e.target.value)}
                          placeholder={t("session.notes")}
                          className="w-full text-[0.72rem] py-1.5 px-2.5 rounded-lg resize-none border-none outline-none"
                          style={{ background: "var(--bg-elevated)", color: "var(--text)", minHeight: "40px" }}
                          rows={2}
                        />
                      </div>
                    ) : (
                      <>
                        {/* 4.6 — Read-only rating + notes in expanded */}
                        {(s.rating || s.sessionNotes) && (
                          <div className="mb-3 py-2 px-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                            {s.rating && (
                              <div className="flex items-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((v) => (
                                  <Star key={v} size={12} fill={v <= s.rating! ? '#FFD700' : 'transparent'} strokeWidth={1.5}
                                    style={{ color: v <= s.rating! ? '#FFD700' : 'var(--border)' }} />
                                ))}
                              </div>
                            )}
                            {s.sessionNotes && (
                              <div className="text-[0.68rem] italic" style={{ color: "var(--text-muted)" }}>{s.sessionNotes}</div>
                            )}
                          </div>
                        )}
                        {s.editedAt && (
                          <div className="text-[0.55rem] mb-2" style={{ color: "var(--text-secondary)" }}>Editado {new Date(s.editedAt).toLocaleDateString()}</div>
                        )}
                      </>
                    )}

                    {/* 4.2 — Muscles worked pills */}
                    {musclesWorked.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {musclesWorked.map((m) => (
                          <span
                            key={m}
                            className="text-[0.6rem] px-2 py-0.5 rounded-full"
                            style={{ background: "#AF52DE20", color: "#AF52DE" }}
                          >
                            {MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS] || m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 4.2 — Exercise count summary */}
                    <div className="text-[0.65rem] mb-2" style={{ color: "var(--text-muted)" }}>
                      {done} ejercicio{done !== 1 ? "s" : ""}{skipped > 0 && ` · ${skipped} saltado${skipped !== 1 ? "s" : ""}`}
                    </div>

                    {(editingId === s.id && editData ? editData.exercises : s.exercises).map((ex, i) => (
                      <div key={i} className="py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <div className={`text-[0.82rem] font-bold mb-2 ${ex.skipped ? "line-through" : ""}`}
                          style={ex.skipped ? { color: "var(--text-muted)" } : undefined}
                        >
                          {ex.name}
                          {ex.skipped && <span className="text-[#FF9500] text-[0.6rem] ml-1.5 font-normal">saltado</span>}
                        </div>
                        {ex.sets.length > 0 && (
                          <table className="w-full text-[0.72rem]" style={{ borderCollapse: "collapse" }}>
                            <thead>
                              <tr className="text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                <th className="text-left py-1 w-12">Set</th>
                                <th className="text-left py-1">{t("common.weight")}</th>
                                <th className="text-left py-1">Reps</th>
                                <th className="text-right py-1 w-14">RPE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ex.sets.map((set, j) => {
                                const isEven = j % 2 === 1;
                                const isEditing = editingId === s.id && editData;
                                return (
                                  <tr key={j} style={{ background: isEven ? "var(--bg-elevated)" : "transparent" }}>
                                    <td className="py-1.5 px-1 rounded-l-lg font-bold" style={{ color: "#FF9500" }}>
                                      {j + 1}
                                    </td>
                                    {isEditing ? (
                                      <>
                                        <td className="py-1">
                                          <input
                                            type="number"
                                            value={set.weight ?? ""}
                                            onChange={(e) => updateEditSet(i, j, "weight", e.target.value ? Number(e.target.value) : undefined)}
                                            className="w-16 text-[0.72rem] py-0.5 px-1.5 rounded border-none outline-none font-semibold"
                                            style={{ background: "var(--bg-card)", color: "var(--text)" }}
                                            placeholder="kg"
                                            step="0.5"
                                          />
                                        </td>
                                        <td className="py-1">
                                          <input
                                            type="number"
                                            value={set.reps}
                                            onChange={(e) => updateEditSet(i, j, "reps", Number(e.target.value) || 0)}
                                            className="w-14 text-[0.72rem] py-0.5 px-1.5 rounded border-none outline-none font-semibold"
                                            style={{ background: "var(--bg-card)", color: "var(--text)" }}
                                            placeholder="reps"
                                          />
                                        </td>
                                        <td className="py-1 text-right pr-1">
                                          <input
                                            type="number"
                                            value={set.rpe ?? ""}
                                            onChange={(e) => updateEditSet(i, j, "rpe", e.target.value ? Number(e.target.value) : undefined)}
                                            className="w-12 text-[0.72rem] py-0.5 px-1.5 rounded border-none outline-none text-right"
                                            style={{ background: "var(--bg-card)", color: "var(--accent)" }}
                                            placeholder="RPE"
                                            min="1"
                                            max="10"
                                            step="0.5"
                                          />
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="py-1.5">
                                          {set.weight ? <span className="font-semibold">{set.weight}kg</span> : "—"}
                                        </td>
                                        <td className="py-1.5">
                                          <span className="font-semibold">{set.reps}</span>
                                        </td>
                                        <td className="py-1.5 text-right text-[0.68rem]" style={{ color: set.rpe ? "var(--accent)" : "var(--text-muted)" }}>
                                          {set.rpe ? `${set.rpe}` : "—"}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                        {ex.notes && (
                          <div className="text-[0.65rem] mt-1 italic" style={{ color: "var(--text-muted)" }}>{ex.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </main>
    </PullToRefresh>
  );
}
