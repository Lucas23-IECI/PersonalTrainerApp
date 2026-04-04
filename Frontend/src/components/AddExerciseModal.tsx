'use client';

import { useState, useMemo } from 'react';
import {
  exerciseLibrary,
  MUSCLE_LABELS,
  type LibraryExercise,
  type MuscleGroup,
  type ExerciseCategory,
} from '@/data/exercises';
import { Search, X, ChevronRight } from 'lucide-react';

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

  const filteredExercises = useMemo(() => {
    return exerciseLibrary.filter((ex) => {
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
  }, [search, equipFilter, muscleFilter]);

  const recentList = useMemo(() => {
    if (search || equipFilter || muscleFilter) return [];
    return recentExerciseNames
      .map((name) => exerciseLibrary.find((e) => e.name === name))
      .filter((e): e is LibraryExercise => !!e)
      .slice(0, 5);
  }, [recentExerciseNames, search, equipFilter, muscleFilter]);

  if (!open) return null;

  function handleSelect(ex: LibraryExercise) {
    setSearch('');
    setEquipFilter(null);
    setMuscleFilter(null);
    onSelect(ex);
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

      {/* Filters */}
      <div className="px-4 pb-2 flex gap-2 shrink-0">
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
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
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
              <ExerciseRow key={ex.id} exercise={ex} onSelect={handleSelect} />
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
          <ExerciseRow key={ex.id} exercise={ex} onSelect={handleSelect} />
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
}: {
  exercise: LibraryExercise;
  onSelect: (e: LibraryExercise) => void;
}) {
  return (
    <button
      onClick={() => onSelect(exercise)}
      className="w-full flex items-center gap-3 py-3 bg-transparent border-none cursor-pointer text-left"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
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
        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
          {exercise.name}
        </div>
        <div className="text-[0.68rem]" style={{ color: 'var(--text-muted)' }}>
          {exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
        </div>
      </div>

      <ChevronRight size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}
