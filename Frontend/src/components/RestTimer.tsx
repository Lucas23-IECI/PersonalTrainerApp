'use client';

import { useEffect, useRef } from 'react';
import { vibrateLight } from '@/lib/haptics';

interface RestTimerProps {
  seconds: number;
  total: number;
  isActive: boolean;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}

const RADIUS = 38;
const STROKE = 4;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({ seconds, total, isActive, onAdjust, onSkip }: RestTimerProps) {
  const prevActive = useRef(false);

  // Track when timer first becomes active for entry animation
  useEffect(() => {
    prevActive.current = isActive;
  }, [isActive]);

  if (!isActive) return null;

  const progress = total > 0 ? seconds / total : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="max-w-[540px] mx-auto px-3 pb-3">
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-4"
          style={{
            background: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* Circular SVG Timer */}
          <div className="relative flex-shrink-0" style={{ width: 84, height: 84 }}>
            <svg width={84} height={84} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {/* Track */}
              <circle
                cx={RADIUS + STROKE}
                cy={RADIUS + STROKE}
                r={RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={STROKE}
              />
              {/* Progress arc */}
              <circle
                cx={RADIUS + STROKE}
                cy={RADIUS + STROKE}
                r={RADIUS}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            {/* Time inside circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-[1.15rem] font-black tabular-nums tracking-tight">
                {mm}:{ss}
              </span>
            </div>
          </div>

          {/* Label + Controls */}
          <div className="flex-1 flex flex-col gap-2.5">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Descanso
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { vibrateLight(); onAdjust(-15); }}
                className="text-white text-[0.75rem] font-bold h-10 w-11 rounded-xl flex items-center justify-center cursor-pointer border-none"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                −15
              </button>
              <button
                onClick={() => { vibrateLight(); onAdjust(15); }}
                className="text-white text-[0.75rem] font-bold h-10 w-11 rounded-xl flex items-center justify-center cursor-pointer border-none"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                +15
              </button>
              <button
                onClick={() => { vibrateLight(); onSkip(); }}
                className="text-[0.75rem] font-bold px-4 h-10 rounded-xl flex items-center justify-center cursor-pointer border-none ml-auto"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
