"use client";

import { useState, useEffect, useMemo } from "react";
import MuscleRadar, {
  type MuscleRegion,
  REGION_LABELS,
  REGION_MUSCLES,
  getRegionSets,
  getRegionVolume,
  getRegionHits,
} from "@/components/MuscleMap";
import BodyMap from "@/components/BodyMap";
import {
  exerciseLibrary,
  MUSCLE_LABELS,
  MUSCLE_REGIONS,
  getExercisesForMuscle,
  type MuscleGroup,
  type LibraryExercise,
} from "@/data/exercises";
import { getWeeklyMuscleData, type WeeklyMuscleStats } from "@/lib/storage";
import { getMuscleRecoveryMap, getRecoveryColor, getRecoveryLabel, getRecoveryEmoji, type MuscleRecoveryInfo } from "@/lib/muscle-recovery";
import { getMuscleGoals, getSetZone, getSetZoneColor, WEEKLY_SET_TARGETS, type SetZone } from "@/lib/muscle-goals";
import { getDailyRecommendations, type DailyRecommendation } from "@/lib/muscle-recommendations";
import MuscleBalanceCard from "@/components/MuscleBalanceCard";
import MuscleGoalsEditor from "@/components/MuscleGoalsEditor";
import MuscleHistoryModal from "@/components/MuscleHistoryModal";
import DailyMuscleRecommendation from "@/components/DailyMuscleRecommendation";
import { getAllExercises } from "@/lib/custom-exercises";
import { getExerciseHistory } from "@/lib/progression";
import { getFavorites, toggleFavorite } from "@/lib/exercise-favorites";
import { getExerciseImage, hasWgerMapping } from "@/lib/wger-api";
import { Search, ChevronDown, ChevronUp, Target, BookOpen, Trophy, Star, Settings, BarChart3, Activity } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

type View = "map" | "library" | "ranking";
type SortOption = "name" | "difficulty" | "favorites";

const SORT_LABELS: Record<SortOption, string> = {
  name: "A-Z",
  difficulty: "Dificultad",
  favorites: "Favoritos",
};
const DIFFICULTY_ORDER: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

const CATEGORY_LABELS: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Mancuerna",
  bodyweight: "Corporal",
  cable: "Cable",
  machine: "Máquina",
  band: "Banda",
  cardio: "Cardio",
};

export default function ExercisesPage() {
  const [view, setView] = useState<View>("map");
  const [mapMode, setMapMode] = useState<"body" | "radar">("body");
  const [metric, setMetric] = useState<"sets" | "volume">("sets");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MuscleRegion | null>(null);
  const [muscleData, setMuscleData] = useState<Record<string, WeeklyMuscleStats>>({});
  const [recoveryMap, setRecoveryMap] = useState<Record<string, MuscleRecoveryInfo>>({} as Record<string, MuscleRecoveryInfo>);
  const [goals, setGoals] = useState<Record<string, { min: number; max: number }>>({});
  const [recommendations, setRecommendations] = useState<DailyRecommendation[]>([]);
  const [search, setSearch] = useState("");
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());
  const [showGoals, setShowGoals] = useState(false);
  const [historyMuscle, setHistoryMuscle] = useState<MuscleGroup | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const loadData = () => {
    const data = getWeeklyMuscleData();
    const recovery = getMuscleRecoveryMap();
    const g = getMuscleGoals();
    setMuscleData(data);
    setRecoveryMap(recovery);
    setGoals(g);
    setRecommendations(getDailyRecommendations(recovery, data, g));
    setFavoritesSet(new Set(getFavorites()));
  };

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem("mark-pt-map-mode");
    if (saved === "body" || saved === "radar") setMapMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("mark-pt-map-mode", mapMode);
  }, [mapMode]);

  const allExercises = useMemo(() => getAllExercises(), []);

  const filteredExercises = useMemo(() => {
    let list = selectedMuscle
      ? getExercisesForMuscle(selectedMuscle)
      : search
        ? allExercises.filter((e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.primaryMuscles.some((m) => MUSCLE_LABELS[m].toLowerCase().includes(search.toLowerCase()))
          )
        : allExercises;

    if (categoryFilter) {
      list = list.filter((e) => e.category === categoryFilter);
    }

    switch (sortBy) {
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "difficulty":
        list = [...list].sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] || 2) - (DIFFICULTY_ORDER[b.difficulty] || 2));
        break;
      case "favorites":
        list = [...list].sort((a, b) => {
          const aFav = favoritesSet.has(a.name) ? 0 : 1;
          const bFav = favoritesSet.has(b.name) ? 0 : 1;
          return aFav - bFav || a.name.localeCompare(b.name);
        });
        break;
    }

    return list;
  }, [selectedMuscle, search, allExercises, sortBy, favoritesSet, categoryFilter]);

  function handleToggleFavorite(name: string) {
    toggleFavorite(name);
    setFavoritesSet(new Set(getFavorites()));
  }

  const allMuscles = Object.keys(MUSCLE_LABELS) as MuscleGroup[];
  const totalSets = Object.values(muscleData).reduce((s, v) => s + v.sets, 0);
  const totalVolume = Object.values(muscleData).reduce((s, v) => s + v.volume, 0);

  const rankedMuscles = allMuscles.map((m) => ({
    muscle: m,
    label: MUSCLE_LABELS[m],
    sets: muscleData[m]?.sets || 0,
  })).sort((a, b) => b.sets - a.sets);

  const views: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "map", label: "Mapa", icon: <Target size={14} /> },
    { id: "library", label: "Ejercicios", icon: <BookOpen size={14} /> },
    { id: "ranking", label: "Ranking", icon: <Trophy size={14} /> },
  ];

  const hasRecommendations = recommendations.some((r) => r.priority === "high" || r.priority === "medium");

  return (
    <PullToRefresh onRefresh={loadData}>
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <div className="mb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Músculos
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {totalSets} sets · {totalVolume.toLocaleString()}kg esta semana
            </p>
          </div>
          <button
            onClick={() => setShowGoals(true)}
            className="p-2 rounded-lg"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: "var(--bg-card)" }}
      >
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setView(v.id);
              setSelectedMuscle(null);
              setSelectedRegion(null);
              setSearch("");
              setExpandedEx(null);
              setCategoryFilter(null);
            }}
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
          {/* Top toggles row */}
          <div className="flex gap-2 mb-4">
            <div className="flex gap-1 p-1 rounded-lg flex-1" style={{ background: "var(--bg-elevated)" }}>
              <button
                onClick={() => setMapMode("body")}
                className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: mapMode === "body" ? "var(--accent)" : "transparent",
                  color: mapMode === "body" ? "white" : "var(--text-muted)",
                }}
              >
                Cuerpo
              </button>
              <button
                onClick={() => setMapMode("radar")}
                className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: mapMode === "radar" ? "var(--accent)" : "transparent",
                  color: mapMode === "radar" ? "white" : "var(--text-muted)",
                }}
              >
                Radar
              </button>
            </div>
            <div className="flex gap-1 p-1 rounded-lg flex-1" style={{ background: "var(--bg-elevated)" }}>
              <button
                onClick={() => setMetric("sets")}
                className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: metric === "sets" ? "var(--accent)" : "transparent",
                  color: metric === "sets" ? "white" : "var(--text-muted)",
                }}
              >
                Sets
              </button>
              <button
                onClick={() => setMetric("volume")}
                className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: metric === "volume" ? "var(--accent)" : "transparent",
                  color: metric === "volume" ? "white" : "var(--text-muted)",
                }}
              >
                Volumen
              </button>
            </div>
          </div>

          {/* Daily Recommendation */}
          {hasRecommendations && (
            <DailyMuscleRecommendation recommendations={recommendations} />
          )}

          {/* Visualization */}
          <div className="card mb-4">
            {mapMode === "body" ? (
              <BodyMap
                muscleData={muscleData}
                recoveryMap={recoveryMap}
                mode="sets"
                onSelectMuscle={(m) => setSelectedMuscle(m === selectedMuscle ? null : m as MuscleGroup)}
                selectedMuscle={selectedMuscle}
              />
            ) : (
              <MuscleRadar
                muscleData={muscleData}
                recoveryMap={recoveryMap}
                mode={metric}
                selectedRegion={selectedRegion}
                onSelectRegion={(r) => setSelectedRegion(r === selectedRegion ? null : r)}
              />
            )}
          </div>

          {/* Muscle detail card when body map muscle selected */}
          {selectedMuscle && (
            <div className="card animate-fade-in mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                  {MUSCLE_LABELS[selectedMuscle]}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {getRecoveryEmoji(recoveryMap[selectedMuscle]?.status || "fresh")}{" "}
                    {getRecoveryLabel(recoveryMap[selectedMuscle]?.status || "fresh")}
                  </span>
                  <button
                    onClick={() => setHistoryMuscle(selectedMuscle)}
                    className="text-sm"
                    title="Ver historial"
                  >
                    📊
                  </button>
                </div>
              </div>
              {(() => {
                const stats = muscleData[selectedMuscle];
                const goal = goals[selectedMuscle] || WEEKLY_SET_TARGETS[selectedMuscle];
                const sets = stats?.sets || 0;
                const zone = getSetZone(sets, goal.min, goal.max);
                const zoneColor = getSetZoneColor(zone);
                const pct = Math.min((sets / goal.max) * 100, 120);
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text)" }}>{sets} sets</span>
                      <span style={{ color: "var(--text-muted)" }}>{goal.min}-{goal.max} objetivo</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: zoneColor }} />
                    </div>
                    <div className="flex justify-between text-[0.6rem] mt-1" style={{ color: "var(--text-muted)" }}>
                      <span>Volumen: {(stats?.volume || 0).toLocaleString()}kg</span>
                      <span>{stats?.exercises.length || 0} ejercicios</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Selected region detail (from radar) */}
          {selectedRegion && mapMode === "radar" && (() => {
            const regionMuscles = REGION_MUSCLES[selectedRegion];
            const regionExercises = regionMuscles.flatMap((m) => getExercisesForMuscle(m));
            const unique = regionExercises.filter((ex, i, arr) => arr.findIndex((e) => e.id === ex.id) === i);
            const totalRegionSets = regionMuscles.reduce((s, m) => s + (muscleData[m]?.sets || 0), 0);
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
                    {totalRegionSets} sets
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {regionMuscles.map((m) => {
                    const mSets = muscleData[m]?.sets || 0;
                    return (
                      <span
                        key={m}
                        className="text-[0.65rem] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: mSets > 0 ? "rgba(44,107,237,0.1)" : "var(--bg-card)",
                          color: mSets > 0 ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {MUSCLE_LABELS[m]} ({mSets})
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
                  favoritesSet={favoritesSet}
                  onToggleFav={handleToggleFavorite}
                />
              </div>
            );
          })()}

          {/* Region cards when nothing selected */}
          {!selectedRegion && !selectedMuscle && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(REGION_LABELS) as MuscleRegion[]).map((reg) => {
                const sets = getRegionSets(reg, muscleData);
                const muscleCount = REGION_MUSCLES[reg].length;
                const worstStatus = REGION_MUSCLES[reg].reduce<string>((worst, m) => {
                  const s = recoveryMap[m]?.status || "fresh";
                  const order = { fatigued: 3, recovering: 2, recovered: 1, fresh: 0 };
                  return (order[s as keyof typeof order] || 0) > (order[worst as keyof typeof order] || 0) ? s : worst;
                }, "fresh");
                return (
                  <button
                    key={reg}
                    onClick={() => {
                      if (mapMode === "radar") {
                        setSelectedRegion(reg);
                      } else {
                        setMapMode("radar");
                        setSelectedRegion(reg);
                      }
                    }}
                    className="card text-left transition-all"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                        {REGION_LABELS[reg]}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ background: getRecoveryColor(worstStatus as "fresh" | "recovered" | "recovering" | "fatigued") }}
                        />
                        <span
                          className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: sets > 0 ? "rgba(44,107,237,0.1)" : "var(--bg-elevated)",
                            color: sets > 0 ? "var(--accent)" : "var(--text-muted)",
                          }}
                        >
                          {sets}
                        </span>
                      </div>
                    </div>
                    <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                      {muscleCount} músculos
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Balance card */}
          <MuscleBalanceCard weeklyData={muscleData} />
        </div>
      )}

      {/* ===== LIBRARY VIEW ===== */}
      {view === "library" && (
        <div className="animate-fade-in">
          {/* Search */}
          <div className="relative mb-3">
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

          {/* Category filter chips */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setCategoryFilter(null)}
              className="px-3 py-1.5 rounded-full text-[0.7rem] font-semibold transition-colors whitespace-nowrap shrink-0"
              style={{
                background: !categoryFilter ? "var(--accent)" : "var(--bg-card)",
                color: !categoryFilter ? "white" : "var(--text-secondary)",
              }}
            >
              Todos
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
                className="px-3 py-1.5 rounded-full text-[0.7rem] font-semibold transition-colors whitespace-nowrap shrink-0"
                style={{
                  background: categoryFilter === key ? "var(--accent)" : "var(--bg-card)",
                  color: categoryFilter === key ? "white" : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            ))}
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
            {Object.entries(MUSCLE_REGIONS).map(([, muscles]) =>
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
            )}
          </div>

          <p className="text-xs mb-3 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
            <span>{filteredExercises.length} ejercicios</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs rounded-lg px-2 py-1"
              style={{
                background: sortBy !== "name" ? "var(--accent)" : "var(--bg-card)",
                border: "1px solid var(--border)",
                color: sortBy !== "name" ? "#fff" : "var(--text-secondary)",
              }}
            >
              {Object.entries(SORT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </p>

          <ExerciseList
            exercises={filteredExercises}
            expandedEx={expandedEx}
            onToggle={(id) => setExpandedEx(expandedEx === id ? null : id)}
            favoritesSet={favoritesSet}
            onToggleFav={handleToggleFavorite}
          />
        </div>
      )}

      {/* ===== RANKING VIEW ===== */}
      {view === "ranking" && (
        <div className="animate-fade-in">
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Ranking semanal por sets registrados en tus sesiones.
          </p>

          <div className="flex flex-col gap-1">
            {rankedMuscles.map((m, i) => {
              const goal = goals[m.muscle] || WEEKLY_SET_TARGETS[m.muscle];
              const zone = getSetZone(m.sets, goal.min, goal.max);
              const zoneColor = getSetZoneColor(zone);
              const pct = goal.max > 0 ? Math.min((m.sets / goal.max) * 100, 100) : 0;
              const recovery = recoveryMap[m.muscle];
              return (
                <button
                  key={m.muscle}
                  onClick={() => setHistoryMuscle(m.muscle)}
                  className="w-full text-left card py-2.5 px-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono w-5 text-right" style={{ color: "var(--text-muted)" }}>
                      {i + 1}
                    </span>
                    <span className="text-sm">
                      {recovery ? getRecoveryEmoji(recovery.status) : ""}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {m.label}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: zoneColor }}>
                          {m.sets} / {goal.min}-{goal.max}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: zoneColor }} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <MuscleGoalsEditor
        isOpen={showGoals}
        onClose={() => setShowGoals(false)}
        onSave={() => { loadData(); setShowGoals(false); }}
      />
      <MuscleHistoryModal
        muscle={historyMuscle}
        isOpen={!!historyMuscle}
        onClose={() => setHistoryMuscle(null)}
      />
    </main>
    </PullToRefresh>
  );
}

/* ────────────────────────────────────────────────────── */
/*  ExerciseList                                          */
/* ────────────────────────────────────────────────────── */

function ExerciseList({
  exercises,
  expandedEx,
  onToggle,
  favoritesSet,
  onToggleFav,
}: {
  exercises: LibraryExercise[];
  expandedEx: string | null;
  onToggle: (id: string) => void;
  favoritesSet?: Set<string>;
  onToggleFav?: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex) => {
        const isOpen = expandedEx === ex.id;
        const isFav = favoritesSet?.has(ex.name) ?? false;
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
                  <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                    {ex.name}
                    {isFav && <Star size={12} fill="#FFD60A" stroke="#FFD60A" className="shrink-0" />}
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
              <div className="flex items-center gap-1 ml-2 shrink-0">
                {onToggleFav && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFav(ex.name); }}
                    className="bg-transparent border-none cursor-pointer p-1"
                    style={{ color: isFav ? "#FFD60A" : "var(--text-muted)" }}
                  >
                    <Star size={16} fill={isFav ? "#FFD60A" : "none"} />
                  </button>
                )}
                <div style={{ color: "var(--text-muted)" }}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </div>

            {isOpen && (
              <ExerciseDetail exercise={ex} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/*  ExerciseDetail                                        */
/* ────────────────────────────────────────────────────── */

function ExerciseDetail({ exercise: ex }: { exercise: LibraryExercise }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const history = useMemo(() => {
    const h = getExerciseHistory(ex.name, 1);
    return h.length > 0 ? h[0] : null;
  }, [ex.name]);

  useEffect(() => {
    if (!hasWgerMapping(ex.name)) return;
    let cancelled = false;
    getExerciseImage(ex.name).then((url) => {
      if (!cancelled && url) setImageUrl(url);
    });
    return () => { cancelled = true; };
  }, [ex.name]);

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      {history && (
        <div
          className="mb-3 px-3 py-2 rounded-lg text-[0.65rem]"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <span style={{ color: "var(--text-muted)" }}>Último: </span>
          <span className="font-semibold" style={{ color: "var(--accent)" }}>
            {history.topSet.weight}kg × {history.topSet.reps}
          </span>
          <span style={{ color: "var(--text-muted)" }}> · RPE {history.avgRpe.toFixed(1)} · {new Date(history.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
      )}

      {imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
          <img
            src={imageUrl}
            alt={ex.name}
            className="w-full h-36 object-contain"
            loading="lazy"
          />
        </div>
      )}

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
  );
}