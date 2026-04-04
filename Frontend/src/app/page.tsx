"use client";

import { useEffect, useState } from "react";
import { getProfileData, daysUntil } from "@/data/profile";
import { getTodayWorkout } from "@/data/workouts";
import { macroTargets } from "@/data/nutrition";
import { getCurrentPhase } from "@/data/phases";
import {
  today,
  getCheckinForDate,
  saveCheckin,
  getSessionsForDate,
  getNutritionForDate,
  getWeekStatus,
  getTrainingStreak,
  getSessions,
  type DailyCheckin,
  type DayStatus,
} from "@/lib/storage";
import { evaluateAchievements, getAchievementStats, type BadgeDefinition } from "@/lib/achievements";
import Link from "next/link";
import {
  Play,
  Check,
  Flame,
  Moon,
  Clock,
  Settings,
  ChevronRight,
  User,
  X,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { PageTransition, StaggerList, StaggerItem } from "@/components/motion";

export default function Dashboard() {
  const todayStr = today();

  const [prof, setProf] = useState({ name: "", weight: 0, goalWeight: 0, brazilDate: "", heavyWeightsDate: "" });
  const [phase, setPhase] = useState({ name: "", id: 0 });
  const [todayWorkout, setTodayWorkout] = useState<ReturnType<typeof getTodayWorkout>>(undefined);
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [todayTrained, setTodayTrained] = useState(false);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [weekStatus, setWeekStatus] = useState<DayStatus[]>([]);
  const [streak, setStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState<{ name: string; date: string; count: number }[]>([]);
  const [badgeStats, setBadgeStats] = useState({ unlocked: 0, total: 0, percentage: 0 });
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [motivationalMsg, setMotivationalMsg] = useState<{ emoji: string; text: string } | null>(null);

  const [ciSleep, setCiSleep] = useState(7);
  const [ciEnergy, setCiEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [ciSoreness, setCiSoreness] = useState<0 | 1 | 2 | 3>(1);
  const [ciWeight, setCiWeight] = useState("");
  const [ciNotes, setCiNotes] = useState("");

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
    const ph = getCurrentPhase();
    setPhase(ph);
    setTodayWorkout(getTodayWorkout());

    const ci = getCheckinForDate(todayStr);
    setCheckin(ci || null);
    if (ci) {
      setCiSleep(ci.sleepHours || 7);
      setCiEnergy(ci.energy);
      setCiSoreness(ci.soreness);
      setCiWeight(ci.weight ? String(ci.weight) : "");
      setCiNotes(ci.notes || "");
    }
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

    // Last 3 completed sessions
    const allSessions = getSessions().filter((s) => s.completed).sort((a, b) => b.date.localeCompare(a.date));
    setRecentSessions(
      allSessions.slice(0, 3).map((s) => ({
        name: s.workoutName,
        date: s.date,
        count: s.exercises.filter((e) => !e.skipped).length,
      }))
    );

    // Evaluate achievements
    const badgeResult = evaluateAchievements();
    setNewBadges(badgeResult.newlyUnlocked);
    setBadgeStats(getAchievementStats());

    // Motivational notification
    const curStreak = getTrainingStreak();
    const totalCompleted = allSessions.length;
    const daysSinceLastSession = allSessions.length > 0
      ? Math.round((Date.now() - new Date(allSessions[0].date + "T12:00:00").getTime()) / 86400000)
      : 999;

    if (badgeResult.newlyUnlocked.length > 0) {
      setMotivationalMsg({ emoji: "🏆", text: `¡Desbloqueaste "${badgeResult.newlyUnlocked[0].name}"! Seguí así.` });
    } else if (curStreak >= 7) {
      setMotivationalMsg({ emoji: "🔥", text: `${curStreak} días seguidos entrenando. ¡Imparable!` });
    } else if (curStreak >= 3) {
      setMotivationalMsg({ emoji: "💪", text: `Racha de ${curStreak} días. ¡No pares ahora!` });
    } else if (daysSinceLastSession >= 3 && daysSinceLastSession < 999) {
      setMotivationalMsg({ emoji: "⏰", text: `Hace ${daysSinceLastSession} días que no entrenás. ¡Dale que podés!` });
    } else if (totalCompleted >= 50) {
      setMotivationalMsg({ emoji: "🎯", text: `${totalCompleted} sesiones completadas. ¡Sos una máquina!` });
    } else if (totalCompleted >= 10) {
      setMotivationalMsg({ emoji: "📈", text: `Ya van ${totalCompleted} sesiones. Cada una cuenta.` });
    } else {
      setMotivationalMsg(null);
    }
  }

  function submitCheckin() {
    const ci: DailyCheckin = {
      date: todayStr,
      sleepHours: ciSleep,
      energy: ciEnergy,
      soreness: ciSoreness,
      weight: ciWeight ? parseFloat(ciWeight) : undefined,
      notes: ciNotes || undefined,
    };
    saveCheckin(ci);
    setCheckin(ci);
    setShowCheckin(false);
    reload();
  }

  const energyLabels = ["", "Muerto", "Bajo", "Normal", "Bien", "Top"];
  const energyColors = ["", "#FF3B30", "#FF9500", "#FF9500", "#34C759", "#34C759"];
  const sorenessLabels = ["Nada", "Leve", "Moderado", "Fuerte"];
  const proteinPct = Math.min(100, Math.round((todayProtein / macroTargets.protein) * 100));
  const calPct = Math.min(100, Math.round((todayCalories / macroTargets.calories) * 100));
  const currentWeight = checkin?.weight || prof.weight;

  return (
    <PageTransition>
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      {/* ───── HEADER ───── */}
      <div className="flex items-center justify-between mb-5">
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
            <p className="text-[0.6rem] text-zinc-500 uppercase tracking-widest">
              Fase {phase.id} — {phase.name}
            </p>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10">
              <Flame size={16} className="text-[#FF9500]" />
              <span className="text-sm font-bold text-[#FF9500]">{streak}</span>
            </div>
          )}
          <Link href="/settings" className="text-zinc-400 hover:text-zinc-600 transition-colors" title="Ajustes">
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* ───── MOTIVATIONAL NOTIFICATION ───── */}
      {motivationalMsg && (
        <div className="card mb-4 flex items-center gap-3 py-3" style={{ borderLeft: "3px solid var(--accent)" }}>
          <span className="text-xl">{motivationalMsg.emoji}</span>
          <p className="text-[0.75rem] font-medium leading-snug" style={{ color: "var(--text)" }}>{motivationalMsg.text}</p>
        </div>
      )}

      {/* ───── TODAY'S WORKOUT (hero card) ───── */}
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
        <div className="card mb-4 text-center py-5" style={{ background: "var(--bg-elevated)" }}>
          <Dumbbell size={28} className="mx-auto text-zinc-300 mb-2" />
          <div className="text-[0.82rem] font-semibold text-zinc-600">Día de Descanso</div>
          <div className="text-[0.65rem] text-zinc-400">Recuperá y volvé más fuerte</div>
        </div>
      )}

      {/* ───── QUICK STATS ROW ───── */}
      <StaggerList className="grid grid-cols-3 gap-2 mb-4">
        <StaggerItem className="card py-3 text-center">
          <div className="text-2xl font-black">{streak}</div>
          <div className="text-[0.55rem] text-zinc-500 uppercase">racha</div>
        </StaggerItem>
        <StaggerItem>
        <Link href="/profile" className="no-underline text-inherit">
          <div className="card py-3 text-center">
            <div className="text-2xl font-black">{currentWeight || "—"}</div>
            <div className="text-[0.55rem] text-zinc-500 uppercase">kg</div>
          </div>
        </Link>
        </StaggerItem>
        <StaggerItem className="card py-3 text-center">
          <div className="text-2xl font-black text-[#2C6BED]">F{phase.id}</div>
          <div className="text-[0.55rem] text-zinc-500 uppercase">fase</div>
        </StaggerItem>
      </StaggerList>

      {/* ───── ACHIEVEMENTS QUICK CARD ───── */}
      <Link href="/achievements" className="no-underline text-inherit">
        <div className="card mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.12)" }}>
              <Trophy size={18} style={{ color: "#FFD700" }} />
            </div>
            <div>
              <div className="text-[0.78rem] font-semibold">Logros</div>
              <div className="text-[0.6rem] text-zinc-500">{badgeStats.unlocked}/{badgeStats.total} desbloqueados</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {newBadges.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[0.55rem] font-bold" style={{ background: "rgba(255,215,0,0.2)", color: "#FFD700" }}>
                +{newBadges.length} nuevo{newBadges.length > 1 ? "s" : ""}
              </span>
            )}
            <ChevronRight size={14} className="text-zinc-400" />
          </div>
        </div>
      </Link>

      {/* ───── MACROS (compact) ───── */}
      <Link href="/nutrition" className="no-underline text-inherit">
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Macros Hoy</span>
            <ChevronRight size={14} className="text-zinc-400" />
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[0.68rem] font-medium">Proteína</span>
                <span className="text-[0.68rem] font-bold">{todayProtein}/{macroTargets.protein}g</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${proteinPct}%`, background: "#2C6BED" }} /></div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[0.68rem] font-medium">Calorías</span>
                <span className="text-[0.68rem] font-bold">{todayCalories}/{macroTargets.calories}</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${calPct}%`, background: "#FF9500" }} /></div>
            </div>
          </div>
        </div>
      </Link>

      {/* ───── CHECK-IN (collapsible, not always visible) ───── */}
      {!checkin && !showCheckin && (
        <button onClick={() => setShowCheckin(true)} className="w-full card mb-4 flex items-center justify-between text-left" style={{ cursor: "pointer" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#2C6BED]/12">
              <Moon size={18} className="text-[#2C6BED]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#2C6BED]">Check-in diario</div>
              <div className="text-[0.65rem] text-zinc-500">Sueño, energía, peso</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-zinc-400" />
        </button>
      )}

      {checkin && !showCheckin && (
        <div className="card mb-4 cursor-pointer" onClick={() => setShowCheckin(true)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-[#34C759]" />
              <span className="text-[0.65rem] text-zinc-500 uppercase">Check-in</span>
            </div>
            <span className="text-[0.6rem] text-zinc-500">editar</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {checkin.sleepHours && (
              <div>
                <div className="text-lg font-extrabold" style={{ color: checkin.sleepHours < 7 ? "#FF3B30" : "#34C759" }}>{checkin.sleepHours}h</div>
                <div className="text-[0.5rem] text-zinc-500 uppercase">sueño</div>
              </div>
            )}
            <div>
              <div className="text-lg font-extrabold" style={{ color: energyColors[checkin.energy] }}>{energyLabels[checkin.energy]}</div>
              <div className="text-[0.5rem] text-zinc-500 uppercase">energía</div>
            </div>
            {checkin.weight && (
              <div>
                <div className="text-lg font-extrabold">{checkin.weight}kg</div>
                <div className="text-[0.5rem] text-zinc-500 uppercase">peso</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECK-IN FORM (modal-style overlay) */}
      {showCheckin && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-[#2C6BED]">Check-in — {todayStr}</div>
            <button onClick={() => setShowCheckin(false)} className="text-zinc-400" style={{ cursor: "pointer", background: "none", border: "none" }}>
              <X size={18} />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-[0.62rem] text-zinc-500 uppercase mb-2">
              Sueño: <strong className="text-base" style={{ color: ciSleep < 7 ? "#FF3B30" : "#34C759" }}>{ciSleep}h</strong>
            </label>
            <input type="range" min={2} max={12} step={0.5} value={ciSleep} onChange={(e) => setCiSleep(Number(e.target.value))} className="w-full" style={{ accentColor: ciSleep < 7 ? "#FF3B30" : "#34C759" }} />
          </div>
          <div className="mb-4">
            <label className="block text-[0.62rem] text-zinc-500 uppercase mb-2">Energía</label>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((v) => (
                <button key={v} onClick={() => setCiEnergy(v)} className="flex-1 py-2 rounded-lg text-[0.6rem] font-semibold" style={{ background: ciEnergy === v ? energyColors[v] : "var(--bg-elevated)", border: `1px solid ${ciEnergy === v ? energyColors[v] : "var(--border)"}`, color: ciEnergy === v ? "#000" : "var(--text-muted)", cursor: "pointer" }}>
                  {energyLabels[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[0.62rem] text-zinc-500 uppercase mb-2">Dolor muscular</label>
            <div className="flex gap-1.5">
              {([0, 1, 2, 3] as const).map((v) => (
                <button key={v} onClick={() => setCiSoreness(v)} className="flex-1 py-2 rounded-lg text-[0.62rem] font-semibold" style={{ background: ciSoreness === v ? "var(--bg-elevated)" : "transparent", border: `1px solid ${ciSoreness === v ? "var(--text-muted)" : "var(--border)"}`, color: ciSoreness === v ? "var(--text)" : "var(--text-muted)", cursor: "pointer" }}>
                  {sorenessLabels[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 mb-4">
            <div>
              <label className="block text-[0.62rem] text-zinc-500 uppercase mb-1">Peso (kg)</label>
              <input type="number" placeholder={String(prof.weight)} value={ciWeight} onChange={(e) => setCiWeight(e.target.value)} step={0.1} className="w-full" />
            </div>
            <div>
              <label className="block text-[0.62rem] text-zinc-500 uppercase mb-1">Notas</label>
              <input type="text" placeholder="Cómo te sentís..." value={ciNotes} onChange={(e) => setCiNotes(e.target.value)} className="w-full" />
            </div>
          </div>
          <button onClick={submitCheckin} className="btn btn-primary w-full">Guardar</button>
        </div>
      )}

      {/* ───── WEEK DOTS ───── */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Esta Semana</span>
          <Link href="/weekly-report" className="text-[0.65rem] text-[#2C6BED] no-underline">Reporte →</Link>
        </div>
        <div className="flex justify-between">
          {weekStatus.map((d) => {
            const isToday = d.date === todayStr;
            return (
              <div key={d.date} className="flex flex-col items-center gap-1.5">
                <div className="text-[0.58rem] font-semibold" style={{ color: isToday ? "#2C6BED" : "#AEAEB2" }}>{d.dayLabel}</div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: d.trained ? "#34C759" : isToday ? "#2C6BED12" : "var(--bg-elevated)",
                    border: isToday && !d.trained ? "2px solid #2C6BED" : "none",
                  }}
                >
                  {d.trained ? <Check size={14} color="#fff" strokeWidth={3} /> : isToday ? <div className="w-2 h-2 rounded-full bg-[#2C6BED]" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ───── RECENT ACTIVITY ───── */}
      {recentSessions.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Actividad Reciente</span>
            <Link href="/log" className="text-[0.65rem] text-[#2C6BED] no-underline">Ver todo →</Link>
          </div>
          <div className="space-y-2">
            {recentSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2C6BED]/10">
                    <Dumbbell size={14} className="text-[#2C6BED]" />
                  </div>
                  <div>
                    <div className="text-[0.78rem] font-semibold">{s.name}</div>
                    <div className="text-[0.6rem] text-zinc-500">{relativeDate(s.date)} · {s.count} ejercicios</div>
                  </div>
                </div>
                <Check size={14} className="text-[#34C759]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── SLEEP WARNING ───── */}
      {checkin && checkin.sleepHours && checkin.sleepHours < 7 && (
        <div className="card mb-4 flex gap-3 items-start" style={{ borderLeft: "3px solid #FF9500" }}>
          <Moon size={16} className="text-[#FF9500] shrink-0 mt-0.5" />
          <div className="text-[0.72rem] text-zinc-600 leading-relaxed">
            <strong className="text-[#FF9500]">{checkin.sleepHours}h</strong> anoche — necesitás <strong>7h mínimo</strong> para no perder músculo.
          </div>
        </div>
      )}
    </main>
    </PageTransition>
  );
}
