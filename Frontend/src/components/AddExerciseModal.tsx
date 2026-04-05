'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  exerciseLibrary,
  MUSCLE_LABELS,
  type LibraryExercise,
  type MuscleGroup,
  type ExerciseCategory,
} from '@/data/exercises';
import { getAllExercises, createCustomExercise, cloneExerciseFromLibrary, type CustomExercise } from '@/lib/custom-exercises';
import { getAlternativesByName } from '@/lib/exercise-alternatives';
import { getExerciseHistory, type ExerciseHistory } from '@/lib/progression';
import { getFavorites, toggleFavorite, isFavorite as checkFavorite } from '@/lib/exercise-favorites';
import { getExerciseImage, hasWgerMapping } from '@/lib/wger-api';
import { Search, X, ChevronRight, Plus, RotateCcw, Copy, ChevronDown, Star, ArrowUpDown, Image as ImageIcon } from 'lucide-react';

type SortOption = 'name' | 'difficulty' | 'favorites' | 'recent';

const SORT_LABELS: Record<SortOption, string> = {
  name: 'A-Z',
  difficulty: 'Dificultad',
  favorites: 'Favoritos',
  recent: 'Recientes',
};

const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const EQUIPMENT_LABELS: Record<ExerciseCategory, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  bodyweight: 'Peso Corporal',
  cable: 'Cable',
  machine: 'Máquina',
  band: 'Banda',
  cardio: 'Cardio',
};

const EQUIPMENT_ICONS: Record<ExerciseCategory, string> = {
  barbell: '🏋️',
  dumbbell: '💪',
  bodyweight: '🤸',
  cable: '🔗',
  machine: '⚙️',
  band: '🔄',
  cardio: '🏃',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: LibraryExercise) => void;
  recentExerciseNames?: string[];
}

export default function AddExerciseModal({ open, onClose, onSelect, recentExerciseNames = [] }: Props) {
  const [search, setSearch] = useState('');
  const [equipFilter, setEquipFilter] = useState<ExerciseCategory | null>(null);
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('barbell');
  const [newPrimary, setNewPrimary] = useState<MuscleGroup | ''>('');
  const [alternativesFor, setAlternativesFor] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());

  // Load favorites on mount
  useEffect(() => {
    if (open) setFavoritesSet(new Set(getFavorites()));
  }, [open, refreshKey]);

  const allExercises = useMemo(() => getAllExercises(), [refreshKey]);

  const filteredExercises = useMemo(() => {
    let list = allExercises.filter((ex) => {
      if (equipFilter && ex.category !== equipFilter) return false;
      if (muscleFilter && !ex.primaryMuscles.includes(muscleFilter) && !ex.secondaryMuscles.includes(muscleFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = ex.name.toLowerCase().includes(q);
        const muscleMatch = ex.primaryMuscles.some((m) => MUSCLE_LABELS[m].toLowerCase().includes(q));
        if (!nameMatch && !muscleMatch) return false;
      }
      return true;
    });

    // Sort (3.13)
    switch (sortBy) {
      case 'name':
        list = list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'difficulty':
        list = list.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] || 2) - (DIFFICULTY_ORDER[b.difficulty] || 2));
        break;
      case 'favorites':
        list = list.sort((a, b) => {
          const aFav = favoritesSet.has(a.name) ? 0 : 1;
          const bFav = favoritesSet.has(b.name) ? 0 : 1;
          return aFav - bFav || a.name.localeCompare(b.name);
        });
        break;
      case 'recent':
        list = list.sort((a, b) => {
          const aIdx = recentExerciseNames.indexOf(a.name);
          const bIdx = recentExerciseNames.indexOf(b.name);
          const aRecent = aIdx >= 0 ? aIdx : 9999;
          const bRecent = bIdx >= 0 ? bIdx : 9999;
          return aRecent - bRecent || a.name.localeCompare(b.name);
        });
        break;
    }

    return list;
  }, [search, equipFilter, muscleFilter, allExercises, sortBy, favoritesSet, recentExerciseNames]);

  const recentList = useMemo(() => {
    if (search || equipFilter || muscleFilter) return [];
    return recentExerciseNames
      .map((name) => allExercises.find((e) => e.name === name))
      .filter((e): e is LibraryExercise => !!e)
      .slice(0, 5);
  }, [recentExerciseNames, search, equipFilter, muscleFilter, allExercises]);

  const alternatives = useMemo(() => {
    if (!alternativesFor) return [];
    return getAlternativesByName(alternativesFor, 5);
  }, [alternativesFor]);

  if (!open) return null;

  function handleSelect(ex: LibraryExercise) {
    setSearch('');
    setEquipFilter(null);
    setMuscleFilter(null);
    setAlternativesFor(null);
    onSelect(ex);
  }

  function handleToggleFavorite(name: string) {
    toggleFavorite(name);
    setFavoritesSet(new Set(getFavorites()));
  }

  function handleCreateCustom() {
    if (!newName.trim() || !newPrimary) return;
    createCustomExercise({
      name: newName.trim(),
      category: newCategory,
      primaryMuscles: [newPrimary as MuscleGroup],
      secondaryMuscles: [],
      difficulty: 'intermediate',
    });
    setNewName('');
    setNewCategory('barbell');
    setNewPrimary('');
    setShowCreateForm(false);
    setRefreshKey((k) => k + 1);
  }

  function handleClone(ex: LibraryExercise) {
    const cloned = cloneExerciseFromLibrary(ex.id);
    if (cloned) {
      setRefreshKey((k) => k + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col animate-slide-up" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={onClose}
          className="text-sm font-semibold bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--accent)' }}
        >
          Cancelar
        </button>
        <span className="text-base font-bold" style={{ color: 'var(--text)' }}>
          Añadir Ejercicio
        </span>
        <div style={{ width: 60 }} />
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="px-4 pb-2 flex gap-2 shrink-0 flex-wrap">
        <select
          value={equipFilter || ''}
          onChange={(e) => setEquipFilter((e.target.value || null) as ExerciseCategory | null)}
          className="text-xs rounded-lg px-3 py-2"
          style={{
            background: equipFilter ? 'var(--accent)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: equipFilter ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <option value="">Todo Equipo</option>
          {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={muscleFilter || ''}
          onChange={(e) => setMuscleFilter((e.target.value || null) as MuscleGroup | null)}
          className="text-xs rounded-lg px-3 py-2"
          style={{
            background: muscleFilter ? 'var(--accent)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: muscleFilter ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <option value="">Todo Músculo</option>
          {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Sort (3.13) */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-xs rounded-lg px-3 py-2 ml-auto"
          style={{
            background: sortBy !== 'name' ? 'var(--accent)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: sortBy !== 'name' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          {Object.entries(SORT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Create custom exercise button & form (3.8) */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full mb-3 py-2 rounded-lg text-[0.72rem] font-semibold flex items-center justify-center gap-1.5"
          style={{ background: 'var(--bg-card)', color: 'var(--accent)', border: '1px dashed var(--border)' }}
        >
          <Plus size={14} /> Crear Ejercicio Personalizado
        </button>
        {showCreateForm && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del ejercicio"
              className="w-full text-[0.75rem] py-2 px-2.5 rounded-lg mb-2 text-[var(--text)] placeholder-[var(--text-secondary)]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ExerciseCategory)}
                className="text-[0.7rem] py-2 px-2 rounded-lg text-[var(--text)]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={newPrimary}
                onChange={(e) => setNewPrimary(e.target.value as MuscleGroup)}
                className="text-[0.7rem] py-2 px-2 rounded-lg text-[var(--text)]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <option value="">Músculo principal</option>
                {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateCustom}
              disabled={!newName.trim() || !newPrimary}
              className="w-full py-2 rounded-lg text-[0.72rem] font-bold text-white"
              style={{ background: newName.trim() && newPrimary ? 'var(--accent)' : 'var(--bg-elevated)', opacity: newName.trim() && newPrimary ? 1 : 0.5 }}
            >
              Crear
            </button>
          </div>
        )}

        {/* Alternatives panel (3.9) */}
        {alternativesFor && alternatives.length > 0 && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[0.68rem] font-bold" style={{ color: 'var(--accent)' }}>
                <RotateCcw size={12} className="inline mr-1" />
                Alternativas para &quot;{alternativesFor}&quot;
              </span>
              <button onClick={() => setAlternativesFor(null)} style={{ color: "var(--text-muted)" }}><X size={14} /></button>
            </div>
            {alternatives.map((alt) => (
              <ExerciseRow key={alt.id} exercise={alt} onSelect={handleSelect} isFav={favoritesSet.has(alt.name)} onToggleFav={handleToggleFavorite} />
            ))}
          </div>
        )}

        {/* Recent exercises */}
        {recentList.length > 0 && (
          <div className="mb-4">
            <div
              className="text-[0.65rem] font-bold uppercase tracking-wider mb-2 px-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Recientes
            </div>
            {recentList.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} onSelect={handleSelect} onShowAlternatives={setAlternativesFor} onClone={handleClone} isFav={favoritesSet.has(ex.name)} onToggleFav={handleToggleFavorite} />
            ))}
          </div>
        )}

        {/* Count */}
        <div
          className="text-[0.65rem] font-bold uppercase tracking-wider mb-2 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {filteredExercises.length} ejercicios
        </div>

        {/* All exercises */}
        {filteredExercises.map((ex) => (
          <ExerciseRow key={ex.id} exercise={ex} onSelect={handleSelect} onShowAlternatives={setAlternativesFor} onClone={handleClone} isFav={favoritesSet.has(ex.name)} onToggleFav={handleToggleFavorite} />
        ))}

        {filteredExercises.length === 0 && (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No se encontraron ejercicios
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseRow({
  exercise,
  onSelect,
  onShowAlternatives,
  onClone,
  isFav,
  onToggleFav,
}: {
  exercise: LibraryExercise;
  onSelect: (e: LibraryExercise) => void;
  onShowAlternatives?: (name: string) => void;
  onClone?: (e: LibraryExercise) => void;
  isFav?: boolean;
  onToggleFav?: (name: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isCustom = 'isCustom' in exercise && (exercise as unknown as CustomExercise).isCustom;

  // Inline history (3.11) - only fetch when expanded
  const history = useMemo(() => {
    if (!showActions) return null;
    const h = getExerciseHistory(exercise.name, 1);
    return h.length > 0 ? h[0] : null;
  }, [showActions, exercise.name]);

  // wger image (3.14) - only fetch when expanded
  useEffect(() => {
    if (!showActions) return;
    if (!hasWgerMapping(exercise.name)) return;
    let cancelled = false;
    getExerciseImage(exercise.name).then((url) => {
      if (!cancelled && url) setImageUrl(url);
    });
    return () => { cancelled = true; };
  }, [showActions, exercise.name]);

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => onSelect(exercise)}
        onContextMenu={(e) => { e.preventDefault(); setShowActions(!showActions); }}
        className="w-full flex items-center gap-3 py-3 bg-transparent border-none cursor-pointer text-left"
      >
        {/* Icon circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base"
          style={{ background: 'var(--bg-card)' }}
        >
          {EQUIPMENT_ICONS[exercise.category] || '🏋️'}
        </div>

        {/* Name & muscle */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            {exercise.name}
            {isCustom && (
              <span className="text-[0.5rem] font-bold px-1 py-0.5 rounded-full shrink-0" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>CUSTOM</span>
            )}
            {/* Favorite star (3.12) */}
            {isFav && <Star size={12} fill="#FFD60A" stroke="#FFD60A" className="shrink-0" />}
          </div>
          <div className="text-[0.68rem]" style={{ color: 'var(--text-muted)' }}>
            {exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
          </div>
        </div>

        {/* Favorite toggle + Expand */}
        <div className="flex items-center gap-1 shrink-0">
          {onToggleFav && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFav(exercise.name); }}
              className="bg-transparent border-none cursor-pointer p-1"
              style={{ color: isFav ? '#FFD60A' : 'var(--text-muted)' }}
            >
              <Star size={16} fill={isFav ? '#FFD60A' : 'none'} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className="shrink-0 bg-transparent border-none cursor-pointer p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {showActions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </button>

      {/* Expanded actions & info */}
      {showActions && (
        <div className="px-3 pb-3">
          {/* Inline history (3.11) */}
          {history && (
            <div
              className="mb-2 px-3 py-2 rounded-lg text-[0.65rem]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Último: </span>
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                {history.topSet.weight}kg × {history.topSet.reps}
              </span>
              <span style={{ color: 'var(--text-muted)' }}> · RPE {history.avgRpe.toFixed(1)} · {new Date(history.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
          )}

          {/* wger image (3.14) */}
          {imageUrl && (
            <div className="mb-2 rounded-lg overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <img
                src={imageUrl}
                alt={exercise.name}
                className="w-full h-32 object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {onShowAlternatives && (
              <button
                onClick={() => { onShowAlternatives(exercise.name); setShowActions(false); }}
                className="text-[0.6rem] flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}
              >
                <RotateCcw size={10} /> Alternativas
              </button>
            )}
            {onClone && !isCustom && (
              <button
                onClick={() => { onClone(exercise); setShowActions(false); }}
                className="text-[0.6rem] flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                <Copy size={10} /> Clonar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
