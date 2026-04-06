'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getActiveSession, clearActiveSession, type ActiveSessionData } from '@/lib/storage';
import { clearWorkoutNotification } from '@/lib/native';
import { ChevronRight, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function ActiveWorkoutBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Don't show bar on the session page itself or onboarding
  const hidden = pathname === '/workout/session' || pathname === '/onboarding';

  // Poll localStorage for active session (picks up changes from session page)
  useEffect(() => {
    const check = () => setSession(getActiveSession());
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  // Live timer
  useEffect(() => {
    if (!session) return;
    const tick = () => setElapsed(Date.now() - session.sessionStart);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);



  if (hidden || !session) return null;

  const sec = Math.floor(elapsed / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const time = m >= 60
    ? `${Math.floor(m / 60)}h ${m % 60}m`
    : `${m}:${s.toString().padStart(2, '0')}`;

  // Current exercise: first with incomplete working sets
  const current = session.exercises.find((e) =>
    e.sets.some((s) => !s.completed && !s.isWarmup)
  );
  const exName = current?.name || session.exercises[session.exercises.length - 1]?.name || '';

  const completedSets = session.exercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed && !s.isWarmup).length, 0
  );

  return (
    <>
      <div
        className="fixed left-0 right-0 z-40 animate-slide-up"
        style={{ bottom: 70, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-[540px] mx-auto flex items-center gap-2 px-3 py-2.5">
          {/* Green pulse dot */}
          <div className="relative w-3 h-3 shrink-0">
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: '#34C759', opacity: 0.4 }} />
            <div className="absolute inset-[3px] rounded-full" style={{ background: '#34C759' }} />
          </div>

          {/* Tap to resume */}
          <button
            onClick={() => router.push(`/workout/session?day=${session.dayId}`)}
            className="flex-1 text-left bg-transparent border-none cursor-pointer p-0 min-w-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-[0.82rem] font-bold truncate" style={{ color: 'var(--text)' }}>
                {session.workoutName}
              </span>
              <span className="text-[0.75rem] font-bold tabular-nums shrink-0" style={{ color: '#34C759' }}>
                {time}
              </span>
            </div>
            <div className="text-[0.68rem] truncate" style={{ color: 'var(--text-muted)' }}>
              {exName} · {completedSets} {t("workout.setsCompleted")}
            </div>
          </button>

          {/* Resume arrow */}
          <button
            onClick={() => router.push(`/workout/session?day=${session.dayId}`)}
            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg shrink-0"
            style={{ color: 'var(--accent)' }}
          >
            <ChevronRight size={22} />
          </button>

          {/* Discard */}
          <button
            onClick={() => setConfirmDiscard(true)}
            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg shrink-0"
            style={{ color: '#FF3B30' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Discard confirmation modal */}
      {confirmDiscard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card mx-6 p-5 text-center" style={{ maxWidth: 320 }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>{t("workout.discardWorkout")}</h3>
            <p className="text-[0.78rem] mb-4" style={{ color: 'var(--text-muted)' }}>
              {t("workout.willLoseProgress")} <strong>{session.workoutName}</strong>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDiscard(false)} className="btn btn-ghost flex-1">{t("common.cancel")}</button>
              <button
                onClick={() => {
                  clearActiveSession();
                  clearWorkoutNotification();
                  setSession(null);
                  setConfirmDiscard(false);
                }}
                className="btn btn-danger flex-1"
              >
                {t("common.discard")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
