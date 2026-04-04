"use client";

import { useEffect, useState } from "react";
import {
  getSessions,
  getCheckins,
  getWeightHistory,
  getTrainingStreak,
  type WorkoutSession,
} from "@/lib/storage";
import { MUSCLE_LABELS } from "@/data/exercises";
import { ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface YearStats {
  year: number;
  totalSessions: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  totalMinutes: number;
  uniqueExercises: number;
  uniqueDays: number;
  longestStreak: number;
  favoriteExercise: string;
  favoriteExerciseCount: number;
  mostTrainedMuscle: string;
  mostTrainedMuscleCount: number;
  avgSessionDuration: number;
  avgRating: number;
  prsCount: number;
  weightStart: number | null;
  weightEnd: number | null;
  monthlyDistribution: number[];
  topExercises: { name: string; count: number }[];
}

function computeYearStats(year: number): YearStats {
  const allSessions = getSessions().filter((s) => s.completed);
  const yearSessions = allSessions.filter((s) => s.date.startsWith(String(year)));
  const checkins = getCheckins().filter((c) => c.date.startsWith(String(year)));
  const weightHistory = getWeightHistory().filter((w) => w.date.startsWith(String(year)));

  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  let totalMinutes = 0;
  let totalRating = 0;
  let ratedCount = 0;

  const exerciseCounts: Record<string, number> = {};
  const muscleCounts: Record<string, number> = {};
  const uniqueExercises = new Set<string>();
  const trainedDates = new Set<string>();
  const monthlyDistribution = new Array(12).fill(0);

  for (const s of yearSessions) {
    trainedDates.add(s.date);
    totalMinutes += (s.endTime - s.startTime) / 60000;
    if (s.rating) {
      totalRating += s.rating;
      ratedCount++;
    }
    const month = parseInt(s.date.split("-")[1]) - 1;
    monthlyDistribution[month]++;

    for (const ex of s.exercises) {
      if (ex.skipped) continue;
      uniqueExercises.add(ex.name);
      exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + 1;
      if (ex.primaryMuscles) {
        ex.primaryMuscles.forEach((m) => {
          muscleCounts[m] = (muscleCounts[m] || 0) + 1;
        });
      }
      for (const set of ex.sets) {
        totalSets++;
        totalReps += set.reps;
        totalVolume += (set.weight || 0) * set.reps;
      }
    }
  }

  // Longest streak in the year
  const sortedDates = Array.from(trainedDates).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;
  for (const d of sortedDates) {
    const curr = new Date(d + "T00:00:00");
    if (lastDate) {
      const diff = (curr.getTime() - lastDate.getTime()) / 86400000;
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak;
    lastDate = curr;
  }

  // Favorite exercise
  const topExEntries = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1]);
  const favoriteExercise = topExEntries.length > 0 ? topExEntries[0][0] : "—";
  const favoriteExerciseCount = topExEntries.length > 0 ? topExEntries[0][1] : 0;

  // Most trained muscle
  const topMuscleEntries = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]);
  const mostTrainedMuscle = topMuscleEntries.length > 0 ? topMuscleEntries[0][0] : "—";
  const mostTrainedMuscleCount = topMuscleEntries.length > 0 ? topMuscleEntries[0][1] : 0;

  // PR count
  const bestE1rm: Record<string, number> = {};
  let prsCount = 0;
  const chronological = [...yearSessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime - b.startTime
  );
  for (const s of chronological) {
    for (const ex of s.exercises) {
      if (ex.skipped) continue;
      for (const set of ex.sets) {
        if (!set.weight || set.reps === 0) continue;
        const e1rm = set.weight * (1 + set.reps / 30);
        const key = ex.name.toLowerCase();
        if (!bestE1rm[key] || e1rm > bestE1rm[key]) {
          if (bestE1rm[key]) prsCount++;
          bestE1rm[key] = e1rm;
        }
      }
    }
  }

  return {
    year,
    totalSessions: yearSessions.length,
    totalVolume,
    totalSets,
    totalReps,
    totalMinutes: Math.round(totalMinutes),
    uniqueExercises: uniqueExercises.size,
    uniqueDays: trainedDates.size,
    longestStreak,
    favoriteExercise,
    favoriteExerciseCount,
    mostTrainedMuscle,
    mostTrainedMuscleCount,
    avgSessionDuration: yearSessions.length > 0 ? Math.round(totalMinutes / yearSessions.length) : 0,
    avgRating: ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : 0,
    prsCount,
    weightStart: weightHistory.length > 0 ? weightHistory[0].weight : null,
    weightEnd: weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null,
    monthlyDistribution,
    topExercises: topExEntries.slice(0, 5).map(([name, count]) => ({ name, count })),
  };
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Cards for the Wrapped-style experience
const SLIDE_COLORS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  "linear-gradient(135deg, #0f3460 0%, #533483 100%)",
  "linear-gradient(135deg, #e94560 0%, #0f3460 100%)",
  "linear-gradient(135deg, #533483 0%, #e94560 100%)",
  "linear-gradient(135deg, #16213e 0%, #e94560 100%)",
  "linear-gradient(135deg, #0f3460 0%, #16213e 100%)",
  "linear-gradient(135deg, #533483 0%, #0f3460 100%)",
  "linear-gradient(135deg, #1a1a2e 0%, #533483 100%)",
];

export default function YearReviewPage() {
  const [stats, setStats] = useState<YearStats | null>(null);
  const [slide, setSlide] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setStats(computeYearStats(year));
    setSlide(0);
  }, [year]);

  if (!stats) return null;

  const slides: { title: string; content: React.ReactNode }[] = [
    // Slide 0: Intro
    {
      title: "",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="text-6xl mb-4">🏋️</div>
          <h2 className="text-3xl font-black text-white mb-2">Tu {year}</h2>
          <h3 className="text-xl font-bold text-white/70 mb-4">en MARK PT</h3>
          <p className="text-sm text-white/50">Deslizá para ver tu resumen</p>
        </div>
      ),
    },
    // Slide 1: Total sessions
    {
      title: "Sesiones",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-sm text-white/60 mb-2 uppercase tracking-widest">Completaste</p>
          <div className="text-7xl font-black text-white mb-2">{stats.totalSessions}</div>
          <p className="text-lg text-white/80 font-semibold">sesiones de entrenamiento</p>
          <p className="text-sm text-white/40 mt-3">en {stats.uniqueDays} días diferentes</p>
        </div>
      ),
    },
    // Slide 2: Volume
    {
      title: "Volumen",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-sm text-white/60 mb-2 uppercase tracking-widest">Levantaste</p>
          <div className="text-5xl font-black text-white mb-1">
            {stats.totalVolume >= 1000
              ? `${(stats.totalVolume / 1000).toFixed(0)}k`
              : stats.totalVolume}
          </div>
          <p className="text-lg text-white/80 font-semibold">kilogramos en total</p>
          <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-[200px]">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalSets}</div>
              <div className="text-[0.6rem] text-white/50 uppercase">series</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalReps}</div>
              <div className="text-[0.6rem] text-white/50 uppercase">reps</div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 3: Time
    {
      title: "Tiempo",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-sm text-white/60 mb-2 uppercase tracking-widest">Invertiste</p>
          <div className="text-5xl font-black text-white mb-1">
            {stats.totalMinutes >= 60
              ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
              : `${stats.totalMinutes}m`}
          </div>
          <p className="text-lg text-white/80 font-semibold">entrenando</p>
          <p className="text-sm text-white/40 mt-3">
            Promedio: {stats.avgSessionDuration} min por sesión
          </p>
        </div>
      ),
    },
    // Slide 4: Favorite exercise
    {
      title: "Favorito",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-sm text-white/60 mb-2 uppercase tracking-widest">Tu ejercicio favorito</p>
          <div className="text-3xl mb-4">💪</div>
          <div className="text-2xl font-black text-white mb-2">{stats.favoriteExercise}</div>
          <p className="text-sm text-white/60">
            Lo hiciste <span className="text-white font-bold">{stats.favoriteExerciseCount}</span> veces
          </p>
          {stats.topExercises.length > 1 && (
            <div className="mt-4 w-full max-w-[240px]">
              {stats.topExercises.slice(1, 4).map((ex, i) => (
                <div key={i} className="flex justify-between py-1 text-sm text-white/50">
                  <span>{i + 2}. {ex.name}</span>
                  <span>{ex.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    // Slide 5: Most trained muscle
    {
      title: "Músculo",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-sm text-white/60 mb-2 uppercase tracking-widest">Músculo más trabajado</p>
          <div className="text-3xl mb-4">🦾</div>
          <div className="text-2xl font-black text-white mb-2">
            {MUSCLE_LABELS[stats.mostTrainedMuscle as keyof typeof MUSCLE_LABELS] || stats.mostTrainedMuscle}
          </div>
          <p className="text-sm text-white/60">
            <span className="text-white font-bold">{stats.mostTrainedMuscleCount}</span> veces entrenado
          </p>
          <p className="text-xs text-white/40 mt-2">
            {stats.uniqueExercises} ejercicios diferentes probados
          </p>
        </div>
      ),
    },
    // Slide 6: Streak & PRs
    {
      title: "Récords",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="grid grid-cols-2 gap-6 w-full max-w-[280px]">
            <div>
              <div className="text-4xl mb-1">🔥</div>
              <div className="text-3xl font-black text-white">{stats.longestStreak}</div>
              <div className="text-xs text-white/50 uppercase">Racha máxima</div>
            </div>
            <div>
              <div className="text-4xl mb-1">🏆</div>
              <div className="text-3xl font-black text-white">{stats.prsCount}</div>
              <div className="text-xs text-white/50 uppercase">PRs rotos</div>
            </div>
            {stats.weightStart && stats.weightEnd && (
              <>
                <div>
                  <div className="text-xs text-white/50 uppercase mb-1">Peso Inicio</div>
                  <div className="text-xl font-bold text-white">{stats.weightStart}kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase mb-1">Peso Actual</div>
                  <div className="text-xl font-bold text-white">{stats.weightEnd}kg</div>
                </div>
              </>
            )}
          </div>
          {stats.avgRating > 0 && (
            <div className="mt-6">
              <div className="text-xs text-white/50 uppercase">Rating promedio</div>
              <div className="text-2xl font-black text-yellow-400">
                {"⭐".repeat(Math.round(stats.avgRating))} {stats.avgRating}
              </div>
            </div>
          )}
        </div>
      ),
    },
    // Slide 7: Monthly distribution
    {
      title: "Meses",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-sm text-white/60 mb-4 uppercase tracking-widest">Sesiones por mes</p>
          <div className="flex items-end gap-1.5 h-32 w-full max-w-[300px]">
            {stats.monthlyDistribution.map((count, i) => {
              const maxM = Math.max(...stats.monthlyDistribution, 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[0.5rem] text-white/60 font-bold">
                    {count > 0 ? count : ""}
                  </span>
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${Math.max((count / maxM) * 100, 4)}%`,
                      background: count > 0
                        ? "linear-gradient(180deg, #e94560, #0f3460)"
                        : "rgba(255,255,255,0.1)",
                      minHeight: 4,
                    }}
                  />
                  <span className="text-[0.45rem] text-white/40">{MONTH_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
  ];

  const totalSlides = slides.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 z-10">
        <Link href="/" style={{ color: "#fff" }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-white">Year in Review</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="text-white/60"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-white">{year}</span>
          <button
            onClick={() => setYear((y) => Math.min(y + 1, new Date().getFullYear()))}
            className="text-white/60"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            disabled={year >= new Date().getFullYear()}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slide */}
      <div
        className="flex-1 flex flex-col justify-center relative overflow-hidden"
        style={{
          background: SLIDE_COLORS[slide % SLIDE_COLORS.length],
          transition: "background 0.5s ease",
          minHeight: "70vh",
        }}
      >
        {slides[slide].content}

        {/* Navigation dots */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className="rounded-full transition-all"
              style={{
                width: i === slide ? 20 : 6,
                height: 6,
                background: i === slide ? "#fff" : "rgba(255,255,255,0.3)",
                border: "none",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom nav buttons */}
      <div className="flex gap-3 px-4 py-4" style={{ background: "#000" }}>
        <button
          onClick={() => setSlide((s) => Math.max(0, s - 1))}
          disabled={slide === 0}
          className="flex-1 py-3 rounded-xl text-sm font-bold"
          style={{
            background: slide === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
            color: slide === 0 ? "rgba(255,255,255,0.2)" : "#fff",
            border: "none",
            cursor: slide === 0 ? "default" : "pointer",
          }}
        >
          ← Anterior
        </button>
        <button
          onClick={() => setSlide((s) => Math.min(totalSlides - 1, s + 1))}
          disabled={slide === totalSlides - 1}
          className="flex-1 py-3 rounded-xl text-sm font-bold"
          style={{
            background:
              slide === totalSlides - 1 ? "rgba(255,255,255,0.05)" : "var(--accent)",
            color: slide === totalSlides - 1 ? "rgba(255,255,255,0.2)" : "#fff",
            border: "none",
            cursor: slide === totalSlides - 1 ? "default" : "pointer",
          }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
