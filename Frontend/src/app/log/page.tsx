"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getSessions,
  deleteSession,
  type WorkoutSession,
} from "@/lib/storage";
import { Dumbbell, Clock, ChevronDown, ChevronUp, Trash2, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Monday=0 ... Sunday=6
  let startDow = first.getDay() - 1;
  if (startDow < 0) startDow = 6;
  return { startDow, lastDay };
}

export default function LogPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterExercise, setFilterExercise] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const all = getSessions();
    all.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.endTime || 0) - (a.endTime || 0);
    });
    setSessions(all);
  }, []);

  // Set of dates that have sessions (for calendar dots)
  const trainingDates = useMemo(() => {
    const s = new Set<string>();
    sessions.forEach((ses) => s.add(ses.date));
    return s;
  }, [sessions]);

  // All unique exercise names for autocomplete
  const allExercises = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach((s) => s.exercises.forEach((e) => { if (!e.skipped) names.add(e.name); }));
    return Array.from(names).sort();
  }, [sessions]);

  // Filtered sessions
  const filtered = useMemo(() => {
    let list = sessions;
    if (selectedDate) list = list.filter((s) => s.date === selectedDate);
    if (filterExercise) {
      const q = filterExercise.toLowerCase();
      list = list.filter((s) => s.exercises.some((e) => e.name.toLowerCase().includes(q)));
    }
    return list;
  }, [sessions, selectedDate, filterExercise]);

  // Grouped
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

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
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

  const { startDow, lastDay } = getMonthDays(calYear, calMonth);
  const todayStr = new Date().toISOString().slice(0, 10);

  function dateStr(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const hasActiveFilters = !!selectedDate || !!filterExercise;

  return (
    <main className="max-w-[600px] mx-auto px-4 py-5">
      <h1 className="text-[1.3rem] font-black tracking-tight mb-1">Historial</h1>
      <p className="text-[0.7rem] text-zinc-600 mb-4">
        {sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"} registradas
      </p>

      {/* Calendar */}
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
            const hasTraining = trainingDates.has(ds);
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
                {hasTraining && (
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: isSelected ? "#34C759" : "#34C759" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 items-center">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1 text-[0.7rem] px-2.5 py-1.5 rounded-lg cursor-pointer border-none transition-colors"
          style={{ background: filterExercise ? "#34C75920" : "var(--bg-card)", color: filterExercise ? "#34C759" : "var(--text-muted)" }}
        >
          <Search size={12} /> Ejercicio
        </button>
        {selectedDate && (
          <span className="flex items-center gap-1 text-[0.65rem] px-2 py-1 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
            {formatDate(selectedDate)}
            <button onClick={() => setSelectedDate(null)} className="bg-transparent border-none cursor-pointer text-zinc-400 p-0"><X size={12} /></button>
          </span>
        )}
        {hasActiveFilters && (
          <button onClick={() => { setSelectedDate(null); setFilterExercise(""); setShowFilter(false); }} className="text-[0.65rem] text-zinc-500 bg-transparent border-none cursor-pointer underline ml-auto">
            Limpiar
          </button>
        )}
      </div>

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
