"use client";

import { useEffect, useState } from "react";
import { getProfileData, daysUntil } from "@/data/profile";
import { getTodayWorkout, getNextWorkoutDay } from "@/data/workouts";
import { macroTargets } from "@/data/nutrition";
import { getCurrentPhase } from "@/data/phases";
import {
  today,
  getCheckinForDate,
  getSessionsForDate,
  getNutritionForDate,
  getWeekStatus,
  getTrainingStreak,
  getSessions,
  type DailyCheckin,
  type DayStatus,
} from "@/lib/storage";
import { getAchievementStats } from "@/lib/achievements";
import Link from "next/link";
import {
  Play,
  Check,
  Flame,
  Clock,
  Settings,
  ChevronRight,
  Dumbbell,
  Trophy,
  Moon,
  CalendarDays,
} from "lucide-react";
import { PageTransition, StaggerList, StaggerItem } from "@/components/motion";
import CheckinBottomSheet from "@/components/CheckinBottomSheet";
import QuickActionsChips from "@/components/home/QuickActionsChips";
import GoalCountdown from "@/components/home/GoalCountdown";
import WeekHybridView from "@/components/home/WeekHybridView";
import NextWorkoutPreview from "@/components/home/NextWorkoutPreview";
import SleepLogModal from "@/components/sleep/SleepLogModal";

export default function Dashboard() {
  const todayStr = today();

  const [prof, setProf] = useState({ name: "", weight: 0, goalWeight: 0, brazilDate: "", heavyWeightsDate: "", startDate: "" });
  const [phase, setPhase] = useState({ name: "", id: 0 });
  const [todayWorkout, setTodayWorkout] = useState<ReturnType<typeof getTodayWorkout>>(undefined);
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [todayTrained, setTodayTrained] = useState(false);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [weekStatus, setWeekStatus] = useState<DayStatus[]>([]);
  const [streak, setStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState<{ name: string; date: string; count: number }[]>([]);
  const [badgeStats, setBadgeStats] = useState({ unlocked: 0, total: 0, percentage: 0 });
  const [isRestDay, setIsRestDay] = useState(false);
  const [startWeight, setStartWeight] = useState(81.2);

  useEffect(() => { reload(); }, []);

  function relativeDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const t = new Date(todayStr + "T00:00:00");
    const diff = Math.round((t.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    if (diff < 7) return `Hace ${diff} días`;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }

  function reload() {
    const p = getProfileData();
    setProf(p);
    setStartWeight(p.weight); // initial weight from profile defaults
    const ph = getCurrentPhase();
    setPhase(ph);
    const tw = getTodayWorkout();
    setTodayWorkout(tw);
    setIsRestDay(!tw || tw.exercises.length === 0);

    const ci = getCheckinForDate(todayStr);
    setCheckin(ci || null);

    const sessions = getSessionsForDate(todayStr);
    setTodayTrained(sessions.some((s) => s.completed));

    const nutrition = getNutritionForDate(todayStr);
    setTodayProtein(
      nutrition.meals.reduce((s, m) => s + m.protein, 0) +
      nutrition.customMeals.reduce((s, m) => s + m.protein, 0)
    );
    setTodayCalories(
      nutrition.meals.reduce((s, m) => s + m.calories, 0) +
      nutrition.customMeals.reduce((s, m) => s + m.calories, 0)
    );

    setWeekStatus(getWeekStatus());
    setStreak(getTrainingStreak());

    const allSessions = getSessions().filter((s) => s.completed).sort((a, b) => b.date.localeCompare(a.date));
    setRecentSessions(
      allSessions.slice(0, 3).map((s) => ({
        name: s.workoutName,
        date: s.date,
        count: s.exercises.filter((e) => !e.skipped).length,
      }))
    );

    setBadgeStats(getAchievementStats());
  }

  const proteinPct = Math.min(100, Math.round((todayProtein / macroTargets.protein) * 100));
  const calPct = Math.min(100, Math.round((todayCalories / macroTargets.calories) * 100));
  const currentWeight = checkin?.weight || prof.weight;

  // Next workout info for rest day hero card
  const nextWorkout = getNextWorkoutDay();

  return (
    <PageTransition>
      <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
        {/* ───── HEADER ───── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="no-underline">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2C6BED] to-[#1a4fd4] flex items-center justify-center text-white text-lg font-black">
                {prof.name ? prof.name.charAt(0) : "M"}
              </div>
            </Link>
            <Link href="/profile" className="no-underline text-inherit">
              <h1 className="text-[1.05rem] font-extrabold tracking-tight leading-none">
                {prof.name ? `${getGreeting()}, ${prof.name.split(" ")[0]}` : "MARK PT"}
              </h1>
              <p className="text-[0.6rem] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Fase {phase.id} — {phase.name}
              </p>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255, 149, 0, 0.1)" }}>
                <Flame size={16} style={{ color: "var(--accent-orange)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--accent-orange)" }}>{streak}</span>
              </div>
            )}
            <Link href="/settings" className="transition-colors" style={{ color: "var(--text-muted)" }} title="Ajustes">
              <Settings size={20} />
            </Link>
          </div>
        </div>

        {/* ───── QUICK ACTIONS CHIPS ───── */}
        <QuickActionsChips onOpenCheckin={() => setCheckinOpen(true)} onOpenSleep={() => setSleepOpen(true)} />

        {/* ───── TODAY'S WORKOUT (hero card) ───── */}
        <StaggerList>
          <StaggerItem>
            {todayWorkout && todayWorkout.exercises.length > 0 ? (
              <div className="card mb-4" style={{ background: "linear-gradient(135deg, #2C6BED 0%, #1a4fd4 100%)", color: "#fff" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[0.6rem] uppercase tracking-widest opacity-70">Hoy</span>
                  <span className="text-[0.6rem] opacity-70"><Clock size={10} className="inline mr-1" />{todayWorkout.duration}</span>
                </div>
                <div className="text-xl font-black mb-1">{todayWorkout.name}</div>
                <div className="text-[0.72rem] opacity-80 mb-4">
                  {todayWorkout.exercises.slice(0, 4).map((e) => e.name).join(" · ")}
                  {todayWorkout.exercises.length > 4 && ` (+${todayWorkout.exercises.length - 4})`}
                </div>
                {!todayTrained ? (
                  <Link
                    href={`/workout/session?day=${todayWorkout.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-[0.9rem] no-underline"
                    style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff" }}
                  >
                    <Play size={18} /> EMPEZAR ENTRENO
                  </Link>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[0.9rem]" style={{ background: "rgba(52,199,89,0.3)" }}>
                    <Check size={18} /> COMPLETADO
                  </div>
                )}
              </div>
            ) : (
              /* Rest day card with next workout preview integrated */
              <div className="card mb-4 text-center py-5" style={{ background: "var(--bg-elevated)" }}>
                <Dumbbell size={28} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <div className="text-[0.82rem] font-semibold" style={{ color: "var(--text-secondary)" }}>Día de Descanso</div>
                <div className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>Recuperá y volvé más fuerte</div>
                {nextWorkout && (
                  <div className="pt-3 mt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center justify-center gap-2">
                      <CalendarDays size={13} style={{ color: "var(--accent-green)" }} />
                      <span className="text-[0.62rem] font-semibold" style={{ color: "var(--accent-green)" }}>
                        {nextWorkout.daysFromNow === 1 ? "Mañana" : nextWorkout.dayName}
                      </span>
                    </div>
                    <div className="text-[0.72rem] font-bold mt-1" style={{ color: "var(--text)" }}>
                      {nextWorkout.workout.name}
                    </div>
                    <div className="text-[0.58rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {nextWorkout.workout.exercises.slice(0, 3).map((e) => e.name).join(" · ")}
                      {nextWorkout.workout.exercises.length > 3 && ` (+${nextWorkout.workout.exercises.length - 3})`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </StaggerItem>

          {/* ───── QUICK STATS ROW ───── */}
          <StaggerItem>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="card py-3 text-center">
                <div className="text-2xl font-black">{streak}</div>
                <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>racha</div>
              </div>
              <button
                onClick={() => setCheckinOpen(true)}
                className="card py-3 text-center"
                style={{ cursor: "pointer", border: checkin ? "1px solid var(--accent-green)" : "1px solid var(--border-subtle)" }}
              >
                <div className="text-2xl font-black">{currentWeight || "—"}</div>
                <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>
                  {checkin ? "✓ kg" : "kg"}
                </div>
              </button>
              <div className="card py-3 text-center">
                <div className="text-2xl font-black" style={{ color: "var(--accent)" }}>F{phase.id}</div>
                <div className="text-[0.55rem] uppercase" style={{ color: "var(--text-muted)" }}>fase</div>
              </div>
            </div>
          </StaggerItem>

          {/* ───── MACROS (compact) ───── */}
          <StaggerItem>
            <Link href="/nutrition" className="no-underline text-inherit">
              <div className="card mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.65rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Macros Hoy</span>
                  <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[0.68rem] font-medium">Proteína</span>
                      <span className="text-[0.68rem] font-bold">{todayProtein}/{macroTargets.protein}g</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${proteinPct}%`, background: "var(--accent)" }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[0.68rem] font-medium">Calorías</span>
                      <span className="text-[0.68rem] font-bold">{todayCalories}/{macroTargets.calories}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${calPct}%`, background: "var(--accent-orange)" }} /></div>
                  </div>
                </div>
              </div>
            </Link>
          </StaggerItem>

          {/* ───── GOAL COUNTDOWN ───── */}
          <StaggerItem>
            <GoalCountdown
              currentWeight={currentWeight}
              goalWeight={prof.goalWeight}
              startWeight={startWeight}
              brazilDate={prof.brazilDate}
            />
          </StaggerItem>

          {/* ───── WEEK HYBRID VIEW ───── */}
          <StaggerItem>
            <WeekHybridView weekStatus={weekStatus} />
          </StaggerItem>

          {/* ───── ACHIEVEMENTS (compact 1-line) ───── */}
          <StaggerItem>
            <Link href="/achievements" className="no-underline text-inherit">
              <div className="card mb-4 flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <Trophy size={16} style={{ color: "#FFD700" }} />
                  <span className="text-[0.75rem] font-semibold">Logros</span>
                  <span className="text-[0.65rem] font-bold" style={{ color: "var(--text-muted)" }}>
                    {badgeStats.unlocked}/{badgeStats.total}
                  </span>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
            </Link>
          </StaggerItem>

          {/* ───── RECENT ACTIVITY ───── */}
          {recentSessions.length > 0 && (
            <StaggerItem>
              <div className="card mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.65rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Actividad Reciente</span>
                  <Link href="/log" className="text-[0.65rem] no-underline" style={{ color: "var(--accent)" }}>Ver todo →</Link>
                </div>
                <div className="space-y-2">
                  {recentSessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2" style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(44, 107, 237, 0.1)" }}>
                          <Dumbbell size={14} style={{ color: "var(--accent)" }} />
                        </div>
                        <div>
                          <div className="text-[0.78rem] font-semibold">{s.name}</div>
                          <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{relativeDate(s.date)} · {s.count} ejercicios</div>
                        </div>
                      </div>
                      <Check size={14} style={{ color: "var(--accent-green)" }} />
                    </div>
                  ))}
                </div>
              </div>
            </StaggerItem>
          )}

          {/* ───── NEXT WORKOUT PREVIEW (only on training days) ───── */}
          {!isRestDay && (
            <StaggerItem>
              <NextWorkoutPreview />
            </StaggerItem>
          )}

          {/* ───── SLEEP WARNING ───── */}
          {checkin && checkin.sleepHours && checkin.sleepHours < 7 && (
            <StaggerItem>
              <div className="card mb-4 flex gap-3 items-start" style={{ borderLeft: "3px solid var(--accent-orange)" }}>
                <Moon size={16} className="shrink-0 mt-0.5" style={{ color: "var(--accent-orange)" }} />
                <div className="text-[0.72rem] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--accent-orange)" }}>{checkin.sleepHours}h</strong> anoche — necesitás <strong>7h mínimo</strong> para no perder músculo.
                </div>
              </div>
            </StaggerItem>
          )}

          {/* ───── SLEEP CARD ───── */}
          <StaggerItem>
            <Link href="/sleep" className="no-underline text-inherit">
              <div className="card mb-4 flex items-center justify-between" style={{ borderLeft: "3px solid #5E5CE6" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(94,92,230,0.1)" }}>
                    <Moon size={16} style={{ color: "#5E5CE6" }} />
                  </div>
                  <div>
                    <div className="text-[0.75rem] font-semibold">Sueño</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {checkin?.sleepHours ? `${checkin.sleepHours}h anoche` : "Registrá tu sueño"}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
            </Link>
          </StaggerItem>
        </StaggerList>

        {/* ───── CHECK-IN BOTTOM SHEET ───── */}
        <CheckinBottomSheet
          open={checkinOpen}
          onClose={() => setCheckinOpen(false)}
          onSaved={reload}
          defaultWeight={prof.weight}
        />
        <SleepLogModal
          open={sleepOpen}
          onClose={() => setSleepOpen(false)}
          onSaved={reload}
        />
      </main>
    </PageTransition>
  );
}
