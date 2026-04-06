"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Dumbbell,
  BarChart3,
  Play,
  CheckCircle2,
  Circle,
  Sun,
  Sunset,
  Moon,
  Flame,
  Plus,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import { today } from "@/lib/storage";
import {
  getActiveFaceRoutines,
  getFaceSessionsForDate,
  isFaceRoutineCompletedForSlot,
  getFaceRoutineCompletionForDate,
  getFaceSessionCount,
  getFaceTotalMinutes,
  type FaceRoutine,
} from "@/lib/face-exercises";
import type { TimeOfDay } from "@/lib/habits";

type View = "routines" | "photos" | "analysis";

const TIME_ICONS = { morning: Sun, afternoon: Sunset, night: Moon };
const TIME_LABELS: Record<string, string> = { morning: "Mañana", afternoon: "Tarde", night: "Noche" };

function getTimeSlots(routine: FaceRoutine): (TimeOfDay | null)[] {
  if (routine.timesPerDay === 1) return [null];
  if (routine.timesPerDay === 2) return ["morning", "night"];
  return ["morning", "afternoon", "night"];
}

export default function FacePage() {
  const [routines, setRoutines] = useState<FaceRoutine[]>([]);
  const [view, setView] = useState<View>("routines");

  const d = today();

  const reload = useCallback(() => {
    setRoutines(getActiveFaceRoutines());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const sessionCount = getFaceSessionCount();
  const totalMinutes = getFaceTotalMinutes();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-base)]/80 backdrop-blur-lg border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-[var(--bg-elevated)]">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">{t("face.title")}</h1>
            </div>
            <Link
              href="/face/routines"
              className="p-2 rounded-xl hover:bg-[var(--bg-elevated)]"
            >
              <Plus size={20} />
            </Link>
          </div>

          {/* View tabs */}
          <div className="flex gap-1 mt-3 p-1 bg-[var(--bg-elevated)] rounded-xl">
            {([
              { key: "routines" as View, label: t("face.routinesTab"), icon: Dumbbell },
              { key: "photos" as View, label: t("face.photosTab"), icon: Camera },
              { key: "analysis" as View, label: t("face.analysisTab"), icon: BarChart3 },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === tab.key
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{sessionCount}</p>
              <p className="text-xs text-[var(--text-muted)]">{t("face.totalSessions")}</p>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{totalMinutes}</p>
              <p className="text-xs text-[var(--text-muted)]">{t("face.totalMinutes")}</p>
            </div>
          </div>

          {view === "routines" && (
            <>
              {routines.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted)] mb-4">{t("face.noRoutines")}</p>
                  <Link
                    href="/face/routines"
                    className="inline-block px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
                  >
                    {t("face.createRoutine")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {routines.map(routine => {
                    const slots = getTimeSlots(routine);
                    const { done, total } = getFaceRoutineCompletionForDate(routine.id, d);
                    return (
                      <div key={routine.id} className="bg-[var(--bg-elevated)] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{routine.icon}</span>
                            <div>
                              <p className="font-semibold">{routine.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {routine.exercises.length} {t("face.exercisesCount")} · {done}/{total}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/face/routines?edit=${routine.id}`}
                            className="text-xs text-[var(--accent)]"
                          >
                            {t("common.edit")}
                          </Link>
                        </div>

                        {/* Time slots */}
                        <div className="flex gap-2">
                          {slots.map(slot => {
                            const completed = isFaceRoutineCompletedForSlot(routine.id, d, slot);
                            const Icon = slot ? TIME_ICONS[slot] : Play;
                            const label = slot ? TIME_LABELS[slot] : t("face.start");
                            return (
                              <Link
                                key={slot || "any"}
                                href={`/face/session?routine=${routine.id}&time=${slot || ""}`}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                  completed
                                    ? "bg-green-500/15 text-green-500"
                                    : "bg-[var(--bg-base)] text-[var(--text-primary)]"
                                }`}
                              >
                                {completed ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                {slot ? label : (completed ? t("face.done") : label)}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {view === "photos" && (
            <div className="space-y-4">
              <Link
                href="/face/photos"
                className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
                  <Camera size={24} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t("face.takePhoto")}</p>
                  <p className="text-sm text-[var(--text-muted)]">{t("face.takePhotoDesc")}</p>
                </div>
                <ChevronRight size={20} className="text-[var(--text-muted)]" />
              </Link>
              <Link
                href="/face/photos?view=timeline"
                className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)]"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <ImageIcon size={24} className="text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t("face.timeline")}</p>
                  <p className="text-sm text-[var(--text-muted)]">{t("face.timelineDesc")}</p>
                </div>
                <ChevronRight size={20} className="text-[var(--text-muted)]" />
              </Link>
            </div>
          )}

          {view === "analysis" && (
            <div className="space-y-4">
              <Link
                href="/face/analysis"
                className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)]"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <BarChart3 size={24} className="text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t("face.analyzePhoto")}</p>
                  <p className="text-sm text-[var(--text-muted)]">{t("face.analyzePhotoDesc")}</p>
                </div>
                <ChevronRight size={20} className="text-[var(--text-muted)]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
