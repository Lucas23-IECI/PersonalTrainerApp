'use client';

import type { SetType } from '@/lib/storage';

interface SetTypeBadgeProps {
  type: SetType;
  index: number; // 1-based working set number
  onCycle: () => void;
}

const CONFIG: Record<SetType, { label: string; color: string }> = {
  normal:    { label: '',   color: 'var(--text-secondary)' },
  warmup:    { label: 'W',  color: '#FF9500' },
  dropset:   { label: 'D',  color: '#AF52DE' },
  failure:   { label: 'F',  color: '#FF3B30' },
  amrap:     { label: 'A',  color: '#30D158' },
  restpause: { label: 'RP', color: '#FF6482' },
  myoreps:   { label: 'M',  color: '#64D2FF' },
  cluster:   { label: 'CL', color: '#BF5AF2' },
};

const CYCLE_ORDER: SetType[] = ['normal', 'warmup', 'dropset', 'failure', 'amrap', 'restpause', 'myoreps', 'cluster'];

export default function SetTypeBadge({ type, index, onCycle }: SetTypeBadgeProps) {
  const cfg = CONFIG[type];
  const display = type === 'normal' ? String(index) : cfg.label;

  return (
    <button
      onClick={onCycle}
      className="w-[28px] h-[22px] rounded-md flex items-center justify-center border-none cursor-pointer text-[0.78rem] font-bold transition-colors"
      style={{
        background: type === 'normal' ? 'transparent' : `${cfg.color}18`,
        color: cfg.color,
      }}
      title={type}
    >
      {display}
    </button>
  );
}

export function nextSetType(current: SetType): SetType {
  const idx = CYCLE_ORDER.indexOf(current);
  return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
}

export function isWarmupType(type: SetType): boolean {
  return type === 'warmup';
}
