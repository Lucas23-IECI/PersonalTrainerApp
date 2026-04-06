"use client";

import { useState } from "react";
import { getWeeklyPlan } from "@/data/workouts";
import { getCurrentPhaseInfo } from "@/data/profile";
import { getActiveSession, clearActiveSession, getSettings } from "@/lib/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, BookOpen, Activity } from "lucide-react";
import TodayView from "@/components/workout/TodayView";
import CarouselView from "@/components/workout/CarouselView";
import CalendarView from "@/components/workout/CalendarView";
import AddActivityModal from "@/components/workout/AddActivityModal";

import { PageTransition } from "@/components/motion";
import { t } from "@/lib/i18n";
export default function WorkoutPage() {
  const router = useRouter();
  const plan = getWeeklyPlan();
  const phaseInfo = getCurrentPhaseInfo();
  const viewMode = getSettings().workoutView;

  // Find today's workout
  const dayIndex = new Date().getDay();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayWorkout = plan.find((w) => w.id.endsWith(dayNames[dayIndex]));
  const todayPlanIndex = todayWorkout ? plan.indexOf(todayWorkout) : -1;

  const [confirmNewDay, setConfirmNewDay] = useState<string | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  function handleStartWorkout(dayId: string) {
    const active = getActiveSession();
    if (active && active.dayId !== dayId) {
      setConfirmNewDay(dayId);
    } else {
      router.push(`/workout/session?day=${dayId}`);
    }
  }

  function confirmDiscardAndStart() {
    clearActiveSession();
    if (confirmNewDay) {
      router.push(`/workout/session?day=${confirmNewDay}`);
    }
    setConfirmNewDay(null);
  }

  return (
    <PageTransition>
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-0.5">
        <h1 className="text-xl font-extrabold tracking-tight">{t("workout.weeklyPlan")}</h1>
        <div className="flex items-center gap-3">
          <Link href="/routines" className="flex items-center gap-1 text-[0.7rem] text-[var(--accent)] no-underline font-semibold">
            <BookOpen size={13} /> {t("workout.routines")}
          </Link>
          <Link href="/workout/editor" className="flex items-center gap-1 text-[0.7rem] no-underline font-semibold" style={{ color: 'var(--accent)' }}>
            <Pencil size={13} /> {t("common.edit")}
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[0.68rem] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {phaseInfo.label}
        </p>
        <span className="text-[0.6rem]" style={{ color: 'var(--text-muted)' }}>
          {t("workout.weekOf").replace("{n}", String(phaseInfo.week)).replace("{total}", String(phaseInfo.totalWeeks))}
        </span>
      </div>
      {/* Phase progress bar */}
      <div className="progress-bar mb-5">
        <div
          className="progress-fill"
          style={{ width: `${phaseInfo.progress}%` }}
        />
      </div>

      {/* View switcher */}
      {viewMode === "today" && (
        <TodayView plan={plan} todayWorkout={todayWorkout} onStart={handleStartWorkout} />
      )}
      {viewMode === "carousel" && (
        <CarouselView plan={plan} todayIndex={todayPlanIndex} onStart={handleStartWorkout} />
      )}
      {viewMode === "calendar" && (
        <CalendarView plan={plan} todayIndex={todayPlanIndex} onStart={handleStartWorkout} />
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleStartWorkout('quickstart')}
          className="flex-1 py-3 rounded-xl text-[0.82rem] font-bold cursor-pointer flex items-center justify-center gap-2"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--accent)' }}
        >
          {t("workout.quickStart")}
        </button>
        <button
          onClick={() => setShowActivityModal(true)}
          className="py-3 px-4 rounded-xl text-[0.82rem] font-bold cursor-pointer flex items-center justify-center gap-2"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--accent-orange)' }}
        >
          <Activity size={16} /> {t("workout.activity")}
        </button>
      </div>

      {/* Activity modal */}
      {showActivityModal && (
        <AddActivityModal
          onClose={() => setShowActivityModal(false)}
          onSaved={() => {}}
        />
      )}

      {/* Confirm discard & start new */}
      {confirmNewDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="card mx-6 p-5 text-center" style={{ maxWidth: 320 }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>{t("workout.discardTitle")}</h3>
            <p className="text-[0.78rem] mb-4" style={{ color: "var(--text-muted)" }}>
              {t("workout.discardMsg")}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmNewDay(null)} className="btn btn-ghost flex-1">{t("common.cancel")}</button>
              <button onClick={confirmDiscardAndStart} className="btn btn-danger flex-1">{t("common.discard")}</button>
            </div>
          </div>
        </div>
      )}
    </main>
    </PageTransition>
  );
}
