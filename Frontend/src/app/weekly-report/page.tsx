"use client";

import { useEffect, useState } from "react";
import {
  getWeekStatus,
  getWeekDates,
  getSessionsForDate,
  getSessions,
  getWeeklyMuscleHits,
  getTrainingStreak,
  getCheckinForDate,
  getCheckins,
  type DayStatus,
  type WorkoutSession,
} from "@/lib/storage";
import { getSleepAverage, getSleepQualityAvg, calculateSleepDebt, QUALITY_EMOJIS } from "@/lib/sleep-utils";
import { MUSCLE_LABELS } from "@/data/exercises";
import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Flame,
  TrendingUp,
  Star,
  Clock,
  Target,
  Moon,
} from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/motion";
interface WeeklyStats {
  sessionsCount: number;
  totalVolume: number;
  totalSets: number;
  totalExercises: number;
  avgDuration: number; // minutes
  avgRating: number;
  muscleHits: Record<string, number>;
  streak: number;
  daysCheckedIn: number;
  bestExercise: { name: string; volume: number } | null;
  weekSessions: WorkoutSession[];
}

function computeWeeklyStats(): WeeklyStats {
  const dates = getWeekDates();
  const weekStatus = getWeekStatus();
  const muscleHits = getWeeklyMuscleHits();
  const streak = getTrainingStreak();

  const weekSessions: WorkoutSession[] = [];
  dates.forEach((date) => {
    const ds = getSessionsForDate(date).filter((s) => s.completed);
    weekSessions.push(...ds);
  });

  let totalVolume = 0;
  let totalSets = 0;
  let totalExercises = 0;
  let totalDuration = 0;
  let totalRating = 0;
  let ratedCount = 0;
  const exVolume: Record<string, number> = {};

  for (const s of weekSessions) {
    totalDuration += (s.endTime - s.startTime) / 60000;
    if (s.rating) {
      totalRating += s.rating;
      ratedCount++;
    }
    for (const ex of s.exercises) {
      if (ex.skipped) continue;
      totalExercises++;
      for (const set of ex.sets) {
        totalSets++;
        const vol = (set.weight || 0) * set.reps;
        totalVolume += vol;
        exVolume[ex.name] = (exVolume[ex.name] || 0) + vol;
      }
    }
  }

  let bestExercise: { name: string; volume: number } | null = null;
  for (const [name, vol] of Object.entries(exVolume)) {
    if (!bestExercise || vol > bestExercise.volume) {
      bestExercise = { name, volume: vol };
    }
  }

  const daysCheckedIn = dates.filter((d) => !!getCheckinForDate(d)).length;

  return {
    sessionsCount: weekSessions.length,
    totalVolume,
    totalSets,
    totalExercises,
    avgDuration: weekSessions.length > 0 ? Math.round(totalDuration / weekSessions.length) : 0,
    avgRating: ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : 0,
    muscleHits,
    streak,
    daysCheckedIn,
    bestExercise,
    weekSessions,
  };
}

// Last week comparison
function computeLastWeekStats(): { sessions: number; volume: number; sets: number } {
  const allSessions = getSessions().filter((s) => s.completed);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);

  const lmStr = lastMonday.toISOString().split("T")[0];
  const lsStr = lastSunday.toISOString().split("T")[0];

  const lastWeekSessions = allSessions.filter(
    (s) => s.date >= lmStr && s.date <= lsStr
  );

  let volume = 0;
  let sets = 0;
  for (const s of lastWeekSessions) {
    for (const ex of s.exercises) {
      if (ex.skipped) continue;
      for (const set of ex.sets) {
        sets++;
        volume += (set.weight || 0) * set.reps;
      }
    }
  }

  return { sessions: lastWeekSessions.length, volume, sets };
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

function pctChange(curr: number, prev: number): { text: string; color: string } {
  if (prev === 0) return { text: curr > 0 ? "+∞" : "—", color: curr > 0 ? "#34C759" : "var(--text-muted)" };
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct > 0) return { text: `+${pct}%`, color: "#34C759" };
  if (pct < 0) return { text: `${pct}%`, color: "#FF3B30" };
  return { text: "=", color: "var(--text-muted)" };
}

export default function WeeklyReportPage() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [lastWeek, setLastWeek] = useState({ sessions: 0, volume: 0, sets: 0 });
  const [weekStatus, setWeekStatus] = useState<DayStatus[]>([]);

  useEffect(() => {
    setStats(computeWeeklyStats());
    setLastWeek(computeLastWeekStats());
    setWeekStatus(getWeekStatus());
  }, []);

  if (!stats) return null;

  const volChange = pctChange(stats.totalVolume, lastWeek.volume);
  const sesChange = pctChange(stats.sessionsCount, lastWeek.sessions);
  const setChange = pctChange(stats.totalSets, lastWeek.sets);

  const topMuscles = Object.entries(stats.muscleHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxHits = topMuscles.length > 0 ? topMuscles[0][1] : 1;

  return (
    <PageTransition>
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/" style={{ color: "var(--accent)" }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            Reporte Semanal
          </h1>
          <p className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
            {getWeekDates()[0]} — {getWeekDates()[6]}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Week days dots */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex justify-between mb-3">
            {weekStatus.map((d) => {
              const isToday = d.date === new Date().toISOString().split("T")[0];
              return (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <span
                    className="text-[0.55rem] font-semibold"
                    style={{ color: isToday ? "var(--accent)" : "var(--text-muted)" }}
                  >
                    {d.dayLabel}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold"
                    style={{
                      background: d.trained ? "#34C759" : isToday ? "var(--accent)" + "1A" : "var(--bg-elevated)",
                      color: d.trained ? "#fff" : "var(--text-muted)",
                      border: isToday && !d.trained ? "2px solid var(--accent)" : "none",
                    }}
                  >
                    {d.trained ? "✓" : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {stats.sessionsCount}/{7} días entrenados
            </span>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sessions */}
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={14} style={{ color: "var(--accent)" }} />
              <span className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>
                Sesiones
              </span>
            </div>
            <div className="text-2xl font-black" style={{ color: "var(--text)" }}>
              {stats.sessionsCount}
            </div>
            <span className="text-[0.6rem] font-semibold" style={{ color: sesChange.color }}>
              {sesChange.text} vs semana anterior
            </span>
          </div>

          {/* Volume */}
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: "#34C759" }} />
              <span className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>
                Volumen
              </span>
            </div>
            <div className="text-2xl font-black" style={{ color: "var(--text)" }}>
              {formatVolume(stats.totalVolume)}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}> kg</span>
            </div>
            <span className="text-[0.6rem] font-semibold" style={{ color: volChange.color }}>
              {volChange.text} vs semana anterior
            </span>
          </div>

          {/* Total Sets */}
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell size={14} style={{ color: "#FF9500" }} />
              <span className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>
                Series
              </span>
            </div>
            <div className="text-2xl font-black" style={{ color: "var(--text)" }}>
              {stats.totalSets}
            </div>
            <span className="text-[0.6rem] font-semibold" style={{ color: setChange.color }}>
              {setChange.text} vs semana anterior
            </span>
          </div>

          {/* Avg Duration */}
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} style={{ color: "#AF52DE" }} />
              <span className="text-[0.6rem] uppercase" style={{ color: "var(--text-muted)" }}>
                Duración Prom
              </span>
            </div>
            <div className="text-2xl font-black" style={{ color: "var(--text)" }}>
              {stats.avgDuration}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}> min</span>
            </div>
          </div>
        </div>

        {/* Streak & Rating row */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <Flame size={24} style={{ color: "#FF9500" }} />
            <div>
              <div className="text-xl font-black" style={{ color: "var(--text)" }}>
                {stats.streak}
              </div>
              <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>
                Racha días
              </div>
            </div>
          </div>
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <Star size={24} style={{ color: "#FFD700" }} />
            <div>
              <div className="text-xl font-black" style={{ color: "var(--text)" }}>
                {stats.avgRating > 0 ? stats.avgRating : "—"}
              </div>
              <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>
                Rating Prom
              </div>
            </div>
          </div>
        </div>

        {/* Muscle Distribution */}
        {topMuscles.length > 0 && (
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} style={{ color: "var(--accent)" }} />
              <span className="text-[0.65rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                Músculos más trabajados
              </span>
            </div>
            <div className="space-y-2">
              {topMuscles.map(([muscle, hits]) => (
                <div key={muscle}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                      {MUSCLE_LABELS[muscle as keyof typeof MUSCLE_LABELS] || muscle}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {hits}x
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(hits / maxHits) * 100}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sleep Section */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Moon size={14} style={{ color: "#5E5CE6" }} />
            <span className="text-[0.65rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
              Sueño esta semana
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-black" style={{ color: getSleepAverage(7) >= 7 ? "#34C759" : "#FF9500" }}>
                {getSleepAverage(7)}h
              </div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>Promedio</div>
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: calculateSleepDebt(7) > 0 ? "#FF3B30" : "#34C759" }}>
                {calculateSleepDebt(7) > 0 ? `-${calculateSleepDebt(7)}h` : "0h"}
              </div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>Deuda</div>
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: "var(--text)" }}>
                {getSleepQualityAvg(7) > 0 ? `${QUALITY_EMOJIS[Math.round(getSleepQualityAvg(7))]} ${getSleepQualityAvg(7)}` : "—"}
              </div>
              <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>Calidad</div>
            </div>
          </div>
        </div>

        {/* Best Exercise */}
        {stats.bestExercise && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(10,132,255,0.08), rgba(52,199,89,0.08))",
              border: "1px solid var(--border)",
            }}
          >
            <div className="text-[0.6rem] uppercase mb-1" style={{ color: "var(--text-muted)" }}>
              Ejercicio con más volumen
            </div>
            <div className="text-base font-bold" style={{ color: "var(--text)" }}>
              {stats.bestExercise.name}
            </div>
            <div className="text-sm" style={{ color: "var(--accent)" }}>
              {formatVolume(stats.bestExercise.volume)} kg
            </div>
          </div>
        )}

        {/* Session List */}
        {stats.weekSessions.length > 0 && (
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="text-[0.65rem] font-semibold uppercase mb-3" style={{ color: "var(--text-muted)" }}>
              Sesiones de la semana
            </div>
            <div className="space-y-2">
              {stats.weekSessions.map((s) => {
                const dur = Math.round((s.endTime - s.startTime) / 60000);
                const vol = s.exercises.reduce(
                  (sum, ex) =>
                    sum + (ex.skipped ? 0 : ex.sets.reduce((ss, set) => ss + (set.weight || 0) * set.reps, 0)),
                  0
                );
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {s.workoutName}
                      </div>
                      <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                        {s.date} · {dur}min · {formatVolume(vol)}kg
                      </div>
                    </div>
                    {s.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star size={12} style={{ color: "#FFD700", fill: "#FFD700" }} />
                        <span className="text-xs font-bold" style={{ color: "var(--text)" }}>
                          {s.rating}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats.sessionsCount === 0 && (
          <div className="text-center py-12">
            <CalendarDays size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No hay sesiones esta semana. ¡Empezá a entrenar!
            </p>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
