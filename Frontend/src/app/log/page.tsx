"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getSessions,
  deleteSession,
  saveActiveSession,
  getActiveSession,
  type WorkoutSession,
} from "@/lib/storage";
import { MUSCLE_LABELS } from "@/data/exercises";
import {
  Dumbbell, Clock, ChevronDown, ChevronUp, Trash2, ChevronLeft,
  ChevronRight, Search, X, RefreshCw, SlidersHorizontal, Flame,
} from "lucide-react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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

  useEffect(() => {
    const all = getSessions();
    all.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.endTime || 0) - (a.endTime || 0);
    });
    setSessions(all);
  }, []);

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
    if (!confirm("¿Eliminar esta sesión?")) return;
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
  }

  // 4.4 — Repeat a past workout session
  function handleRepeat(session: WorkoutSession) {
    const active = getActiveSession();
    if (active) {
      if (!confirm("Ya hay una sesión activa. ¿Descartarla y repetir esta?")) return;
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

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.round((todayD.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
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
    <main className="max-w-[600px] mx-auto px-4 py-5">
      <h1 className="text-[1.3rem] font-black tracking-tight mb-1">Historial</h1>
      <p className="text-[0.7rem] text-zinc-600 mb-4">
        {sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"} registradas
      </p>

      {/* 4.1 — Enhanced Calendar with intensity dots */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3">
          <button onClick={prevMonth} className="bg-transparent border-none cursor-pointer text-zinc-500 p-1"><ChevronLeft size={18} /></button>
          <span className="text-sm font-bold">{MONTH_NAMES[calMonth]} {calYear}</span>
          <button onClick={nextMonth} className="bg-transparent border-none cursor-pointer text-zinc-500 p-1"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-0 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-[0.55rem] text-zinc-400 font-bold uppercase py-1">{d}</div>
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
                <span className={`text-[0.7rem] leading-none ${isToday ? "font-black text-blue-500" : "text-zinc-600"} ${isSelected ? "font-extrabold" : ""}`}>
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
            <span className="text-zinc-400">{formatDate(selectedDate)}</span>
            <div className="flex gap-3 text-zinc-400">
              <span className="flex items-center gap-1"><Flame size={10} className="text-orange-500" />{selectedDateStats.count} {selectedDateStats.count === 1 ? "sesión" : "sesiones"}</span>
              <span>{selectedDateStats.sets} sets</span>
              {selectedDateStats.volume > 0 && <span>{(selectedDateStats.volume / 1000).toFixed(1)}k kg</span>}
            </div>
          </div>
        )}

        {/* 4.1 — Intensity legend */}
        <div className="flex items-center justify-center gap-3 mt-3 text-[0.55rem] text-zinc-500">
          <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#34C75960" }} /> Ligero</span>
          <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#34C759" }} /> Medio</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: "#30D158" }} /> Intenso</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <button
          onClick={() => { setShowFilter(!showFilter); setShowAdvanced(false); }}
          className="flex items-center gap-1 text-[0.7rem] px-2.5 py-1.5 rounded-lg cursor-pointer border-none transition-colors"
          style={{ background: filterExercise ? "#34C75920" : "var(--bg-card)", color: filterExercise ? "#34C759" : "var(--text-muted)" }}
        >
          <Search size={12} /> Ejercicio
        </button>
        {/* 4.3 — Advanced filter toggle */}
        <button
          onClick={() => { setShowAdvanced(!showAdvanced); setShowFilter(false); }}
          className="flex items-center gap-1 text-[0.7rem] px-2.5 py-1.5 rounded-lg cursor-pointer border-none transition-colors"
          style={{
            background: (filterDateFrom || filterDateTo || filterMuscleGroup) ? "#0A84FF20" : "var(--bg-card)",
            color: (filterDateFrom || filterDateTo || filterMuscleGroup) ? "#0A84FF" : "var(--text-muted)",
          }}
        >
          <SlidersHorizontal size={12} /> Avanzado
        </button>
        {selectedDate && (
          <span className="flex items-center gap-1 text-[0.65rem] px-2 py-1 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
            {formatDate(selectedDate)}
            <button onClick={() => setSelectedDate(null)} className="bg-transparent border-none cursor-pointer text-zinc-400 p-0"><X size={12} /></button>
          </span>
        )}
        {filterMuscleGroup && (
          <span className="flex items-center gap-1 text-[0.65rem] px-2 py-1 rounded-lg" style={{ background: "#AF52DE20", color: "#AF52DE" }}>
            {FILTER_MUSCLE_GROUPS.find((g) => g.id === filterMuscleGroup)?.label}
            <button onClick={() => setFilterMuscleGroup("")} className="bg-transparent border-none cursor-pointer text-inherit p-0"><X size={10} /></button>
          </span>
        )}
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-[0.65rem] text-zinc-500 bg-transparent border-none cursor-pointer underline ml-auto">
            Limpiar
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
            placeholder="Buscar ejercicio..."
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
          <div className="text-[0.75rem] font-bold text-zinc-400 uppercase tracking-wider">Filtros Avanzados</div>

          {/* Date range */}
          <div>
            <div className="text-[0.65rem] text-zinc-500 mb-1.5">Rango de fechas</div>
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
            <div className="text-[0.65rem] text-zinc-500 mb-1.5">Grupo muscular</div>
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
        <p className="text-[0.65rem] text-zinc-500 mb-3">
          {filtered.length} {filtered.length === 1 ? "sesión" : "sesiones"} encontradas
        </p>
      )}

      {/* Session list */}
      {filtered.length === 0 && (
        <div className="text-center py-10 text-zinc-400">
          <Dumbbell size={32} className="mx-auto mb-2.5 opacity-30" />
          <div className="text-[0.85rem]">{hasActiveFilters ? "Sin resultados" : "No hay sesiones registradas"}</div>
          <div className="text-[0.7rem] mt-1">{hasActiveFilters ? "Probá otros filtros" : "Completá un entrenamiento para verlo acá"}</div>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.date} className="mb-4">
          <div className="text-[0.7rem] font-bold text-zinc-600 uppercase tracking-widest mb-2">
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
                <div onClick={() => setExpanded(isOpen ? null : s.id)} className="cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[0.9rem] font-extrabold mb-0.5">{s.workoutName}</div>
                      <div className="flex gap-1.5 text-[0.65rem] text-zinc-600">
                        {s.startTime && s.endTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} /> {formatDuration(s.startTime, s.endTime)}
                          </span>
                        )}
                        <span>{totalSets} sets</span>
                        {totalVolume > 0 && <span>{totalVolume.toLocaleString()}kg vol</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* 4.4 — Repeat button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRepeat(s); }}
                        className="bg-transparent border-none cursor-pointer text-zinc-400 hover:text-blue-500 p-1 transition-colors"
                        title="Repetir sesión"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        className="bg-transparent border-none cursor-pointer text-zinc-400 hover:text-[#FF3B30] p-1 transition-colors"
                        title="Eliminar sesión"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="text-zinc-600">
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
                        <div className="text-[0.55rem] text-zinc-500 uppercase tracking-wider">Duración</div>
                        <div className="text-[0.85rem] font-bold">{s.startTime && s.endTime ? formatDuration(s.startTime, s.endTime) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[0.55rem] text-zinc-500 uppercase tracking-wider">Sets</div>
                        <div className="text-[0.85rem] font-bold">{totalSets}</div>
                      </div>
                      <div>
                        <div className="text-[0.55rem] text-zinc-500 uppercase tracking-wider">Volumen</div>
                        <div className="text-[0.85rem] font-bold">{totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[0.55rem] text-zinc-500 uppercase tracking-wider">RPE</div>
                        <div className="text-[0.85rem] font-bold">{avgRpe || "—"}</div>
                      </div>
                    </div>

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
                    <div className="text-[0.65rem] text-zinc-500 mb-2">
                      {done} ejercicio{done !== 1 ? "s" : ""}{skipped > 0 && ` · ${skipped} saltado${skipped !== 1 ? "s" : ""}`}
                    </div>

                    {s.exercises.map((ex, i) => (
                      <div key={i} className="py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <div className={`text-[0.82rem] font-bold mb-2 ${ex.skipped ? "text-zinc-400 line-through" : ""}`}>
                          {ex.name}
                          {ex.skipped && <span className="text-[#FF9500] text-[0.6rem] ml-1.5 font-normal">saltado</span>}
                        </div>
                        {ex.sets.length > 0 && (
                          <table className="w-full text-[0.72rem]" style={{ borderCollapse: "collapse" }}>
                            <thead>
                              <tr className="text-zinc-400 text-[0.6rem] uppercase tracking-wider">
                                <th className="text-left py-1 w-12">Set</th>
                                <th className="text-left py-1">Peso &amp; Reps</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ex.sets.map((set, j) => {
                                const isEven = j % 2 === 1;
                                return (
                                  <tr key={j} style={{ background: isEven ? "var(--bg-elevated)" : "transparent" }}>
                                    <td className="py-1.5 px-1 rounded-l-lg font-bold" style={{ color: "#FF9500" }}>
                                      {j + 1}
                                    </td>
                                    <td className="py-1.5 rounded-r-lg">
                                      {set.weight ? <span className="font-semibold">{set.weight}kg</span> : "—"} × <span className="font-semibold">{set.reps} reps</span>
                                      {set.rpe ? <span className="text-zinc-400 ml-2">RPE {set.rpe}</span> : null}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                        {ex.notes && (
                          <div className="text-[0.65rem] text-zinc-400 mt-1 italic">{ex.notes}</div>
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
  );
}
