"use client";

import { useState, useEffect } from "react";
import MuscleRadar, { type MuscleRegion, REGION_LABELS, REGION_MUSCLES, getRegionHits } from "@/components/MuscleMap";
import {
  exerciseLibrary,
  MUSCLE_LABELS,
  MUSCLE_REGIONS,
  getExercisesForMuscle,
  type MuscleGroup,
  type LibraryExercise,
} from "@/data/exercises";
import { getWeeklyMuscleHits } from "@/lib/storage";
import { Search, ChevronDown, ChevronUp, Target, BookOpen, Trophy } from "lucide-react";

const TIER_THRESHOLDS: { tier: string; min: number }[] = [
  { tier: "S", min: 5 },
  { tier: "A", min: 4 },
  { tier: "B", min: 3 },
  { tier: "C", min: 2 },
  { tier: "D", min: 1 },
  { tier: "F", min: 0 },
];

function getTier(hits: number): string {
  for (const t of TIER_THRESHOLDS) {
    if (hits >= t.min) return t.tier;
  }
  return "F";
}

const CATEGORY_LABELS: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Mancuerna",
  bodyweight: "Corporal",
  cable: "Cable",
  machine: "Máquina",
  band: "Banda",
  cardio: "Cardio",
};

type View = "map" | "library" | "ranking";

export default function ExercisesPage() {
  const [view, setView] = useState<View>("map");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MuscleRegion | null>(null);
  const [muscleHits, setMuscleHits] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  useEffect(() => {
    setMuscleHits(getWeeklyMuscleHits());
  }, []);

  const filteredExercises = selectedMuscle
    ? getExercisesForMuscle(selectedMuscle)
    : search
      ? exerciseLibrary.filter((e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.primaryMuscles.some((m) => MUSCLE_LABELS[m].toLowerCase().includes(search.toLowerCase()))
        )
      : exerciseLibrary;

  const allMuscles = Object.keys(MUSCLE_LABELS) as MuscleGroup[];
  const rankedMuscles = allMuscles.map((m) => ({
    muscle: m,
    label: MUSCLE_LABELS[m],
    hits: muscleHits[m] || 0,
    tier: getTier(muscleHits[m] || 0),
  })).sort((a, b) => b.hits - a.hits);

  const totalWeeklyHits = Object.values(muscleHits).reduce((s, v) => s + v, 0);

  const views: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "map", label: "Mapa", icon: <Target size={14} /> },
    { id: "library", label: "Ejercicios", icon: <BookOpen size={14} /> },
    { id: "ranking", label: "Ranking", icon: <Trophy size={14} /> },
  ];

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
          Músculos
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {totalWeeklyHits} hits musculares esta semana
        </p>
      </div>

      {/* View Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: "var(--bg-card)" }}
      >
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => { setView(v.id); setSelectedMuscle(null); setSelectedRegion(null); setSearch(""); setExpandedEx(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: view === v.id ? "var(--accent)" : "transparent",
              color: view === v.id ? "white" : "var(--text-muted)",
            }}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      {/* ===== MAP VIEW ===== */}
      {view === "map" && (
        <div className="animate-fade-in">
          <div className="card mb-4">
            <MuscleRadar
              muscleHits={muscleHits}
              selectedRegion={selectedRegion}
              onSelectRegion={(r) => setSelectedRegion(r === selectedRegion ? null : r)}
            />
          </div>

          {/* Region cards - always visible */}
          {!selectedRegion && (
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(REGION_LABELS) as MuscleRegion[]).map((reg) => {
                const hits = getRegionHits(reg, muscleHits);
                const muscleCount = REGION_MUSCLES[reg].length;
                return (
                  <button
                    key={reg}
                    onClick={() => setSelectedRegion(reg)}
                    className="card text-left transition-all"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                        {REGION_LABELS[reg]}
                      </span>
                      <span
                        className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: hits > 0 ? "rgba(44,107,237,0.1)" : "var(--bg-elevated)",
                          color: hits > 0 ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {hits}
                      </span>
                    </div>
                    <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                      {muscleCount} músculos
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected region detail */}
          {selectedRegion && (() => {
            const regionMuscles = REGION_MUSCLES[selectedRegion];
            const regionExercises = regionMuscles.flatMap((m) => getExercisesForMuscle(m));
            const unique = regionExercises.filter((ex, i, arr) => arr.findIndex((e) => e.id === ex.id) === i);
            const totalHits = regionMuscles.reduce((s, m) => s + (muscleHits[m] || 0), 0);
            return (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRegion(null)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                      style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}
                    >
                      Volver
                    </button>
                    <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                      {REGION_LABELS[selectedRegion]}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    {totalHits} hits
                  </span>
                </div>

                {/* Muscle breakdown */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {regionMuscles.map((m) => {
                    const mHits = muscleHits[m] || 0;
                    return (
                      <span
                        key={m}
                        className="text-[0.65rem] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: mHits > 0 ? "rgba(44,107,237,0.1)" : "var(--bg-card)",
                          color: mHits > 0 ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {MUSCLE_LABELS[m]} ({mHits})
                      </span>
                    );
                  })}
                </div>

                <p className="text-[0.7rem] mb-3" style={{ color: "var(--text-muted)" }}>
                  {unique.length} ejercicios disponibles
                </p>

                <ExerciseList
                  exercises={unique}
                  expandedEx={expandedEx}
                  onToggle={(id) => setExpandedEx(expandedEx === id ? null : id)}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== LIBRARY VIEW ===== */}
      {view === "library" && (
        <div className="animate-fade-in">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar ejercicio o músculo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedMuscle(null); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Muscle chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => { setSelectedMuscle(null); setSearch(""); }}
              className="px-3 py-1.5 rounded-full text-[0.7rem] font-semibold transition-colors"
              style={{
                background: !selectedMuscle ? "var(--accent)" : "var(--bg-card)",
                color: !selectedMuscle ? "white" : "var(--text-secondary)",
              }}
            >
              Todos
            </button>
            {Object.entries(MUSCLE_REGIONS).map(([, muscles]) => (
              muscles.map((m) => (
                <button
                  key={m}
                  onClick={() => { setSelectedMuscle(m === selectedMuscle ? null : m as MuscleGroup); setSearch(""); }}
                  className="px-3 py-1.5 rounded-full text-[0.7rem] font-semibold transition-colors"
                  style={{
                    background: selectedMuscle === m ? "var(--accent)" : "var(--bg-card)",
                    color: selectedMuscle === m ? "white" : "var(--text-secondary)",
                  }}
                >
                  {MUSCLE_LABELS[m as MuscleGroup]}
                </button>
              ))
            ))}
          </div>

          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {filteredExercises.length} ejercicios
          </p>

          <ExerciseList
            exercises={filteredExercises}
            expandedEx={expandedEx}
            onToggle={(id) => setExpandedEx(expandedEx === id ? null : id)}
          />
        </div>
      )}

      {/* ===== RANKING VIEW ===== */}
      {view === "ranking" && (
        <div className="animate-fade-in">
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Ranking semanal por hits registrados en tus sesiones.
          </p>

          <div className="flex flex-col gap-1">
            {rankedMuscles.map((m, i) => {
              const maxHits = rankedMuscles[0]?.hits || 1;
              const pct = maxHits > 0 ? (m.hits / maxHits) * 100 : 0;
              return (
                <button
                  key={m.muscle}
                  onClick={() => {
                    const region = (Object.entries(REGION_MUSCLES) as [MuscleRegion, MuscleGroup[]][]).find(([, muscles]) => muscles.includes(m.muscle))?.[0] ?? null;
                    setView("map");
                    setSelectedRegion(region);
                  }}
                  className="w-full text-left card py-2.5 px-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono w-5 text-right" style={{ color: "var(--text-muted)" }}>
                      {i + 1}
                    </span>
                    <span className={`tier-${m.tier} text-sm font-black w-6 text-center`}>
                      {m.tier}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {m.label}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: m.hits > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                          {m.hits}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

function ExerciseList({
  exercises,
  expandedEx,
  onToggle,
}: {
  exercises: LibraryExercise[];
  expandedEx: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex) => {
        const isOpen = expandedEx === ex.id;
        return (
          <div key={ex.id} className="card">
            <div
              onClick={() => onToggle(ex.id)}
              className="flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{
                    background: "rgba(44,107,237,0.1)",
                    color: "var(--accent)",
                  }}
                >
                  {CATEGORY_LABELS[ex.category]?.[0] || "E"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {ex.name}
                  </div>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {ex.primaryMuscles.map((m) => (
                      <span key={m} className="badge badge-blue text-[0.55rem]">
                        {MUSCLE_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ color: "var(--text-muted)" }} className="ml-2 shrink-0">
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {isOpen && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <span className="text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Categoría
                    </span>
                    <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {CATEGORY_LABELS[ex.category] || ex.category}
                    </div>
                  </div>
                  <div>
                    <span className="text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Dificultad
                    </span>
                    <div className="text-xs font-medium mt-0.5 capitalize" style={{ color: "var(--text-secondary)" }}>
                      {ex.difficulty}
                    </div>
                  </div>
                </div>

                {ex.secondaryMuscles.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[0.6rem] uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>
                      Secundarios
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {ex.secondaryMuscles.map((m) => (
                        <span key={m} className="badge text-[0.55rem]">
                          {MUSCLE_LABELS[m]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ex.instructions && (
                  <div className="mb-2">
                    <span className="text-[0.6rem] uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>
                      Instrucciones
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {ex.instructions}
                    </p>
                  </div>
                )}

                {ex.tips && (
                  <div
                    className="text-xs py-2 px-3 rounded-lg mt-2"
                    style={{
                      background: "rgba(44,107,237,0.06)",
                      color: "var(--accent)",
                    }}
                  >
                    {ex.tips}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
