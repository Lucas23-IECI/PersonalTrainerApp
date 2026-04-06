"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Flame, Dumbbell, TrendingUp, Target, Trophy } from "lucide-react";
import { getSessions, type WorkoutSession } from "@/lib/storage";
import { getProfileData } from "@/data/profile";
import { getSettings } from "@/lib/storage";

import { PageTransition } from "@/components/motion";
import { t } from "@/lib/i18n";
function calcStreak(sessions: WorkoutSession[]): number {
  if (!sessions.length) return 0;
  const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diff <= streak + 1) streak++;
    else break;
  }
  return streak;
}

export default function WidgetsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prof, setProf] = useState(getProfileData());
  const unit = getSettings().unit;

  useEffect(() => {
    setSessions(getSessions());
    setProf(getProfileData());
  }, []);

  const streak = calcStreak(sessions);
  const thisWeek = sessions.filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  }).length;

  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce((acc, s) => {
    return acc + s.exercises.reduce((ea, ex) => {
      return ea + ex.sets.reduce((sa, set) => sa + (set.weight || 0) * (set.reps || 0), 0);
    }, 0);
  }, 0);

  const widgets = [
    {
      title: t("widgets.currentStreak"),
      value: `${streak} ${t("widgets.days")}`,
      icon: Flame,
      gradient: "from-[#FF9500] to-[#FF3B30]",
      sub: streak >= 7 ? t("widgets.unstoppable") : streak >= 3 ? t("widgets.keepItUp") : t("widgets.startToday"),
    },
    {
      title: t("widgets.thisWeek"),
      value: `${thisWeek} ${t("widgets.workouts")}`,
      icon: Target,
      gradient: "from-[#30D158] to-[#34C759]",
      sub: t("widgets.weeklyGoal"),
    },
    {
      title: t("widgets.totalSessions"),
      value: `${totalSessions}`,
      icon: Dumbbell,
      gradient: "from-[var(--accent)] to-[var(--accent)]",
      sub: t("widgets.sinceBegan"),
    },
    {
      title: t("widgets.totalVolume"),
      value: `${(totalVolume / 1000).toFixed(0)}t`,
      icon: TrendingUp,
      gradient: "from-[#AF52DE] to-[#5856D6]",
      sub: `${totalVolume.toLocaleString()} ${unit} ${t("widgets.moved")}`,
    },
    {
      title: t("widgets.currentWeight"),
      value: `${prof.weight} ${unit}`,
      icon: Trophy,
      gradient: "from-[#FF2D55] to-[#FF375F]",
      sub: `Meta: ${prof.goalWeight} ${unit}`,
    },
  ];

  return (
    <PageTransition>
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={16} /> {t("common.back")}
      </button>

      <h1 className="text-xl font-black tracking-tight mb-1">{t("widgets.title")}</h1>
      <p className="text-[0.7rem] mb-5" style={{ color: "var(--text-muted)" }}>
        {t("widgets.description")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {widgets.map((w) => (
          <div
            key={w.title}
            className="card p-4 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl bg-gradient-to-br ${w.gradient} opacity-15`} />
            <w.icon size={20} className="mb-2" style={{ color: "var(--accent)" }} />
            <div className="text-[0.6rem] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{w.title}</div>
            <div className="text-xl font-black">{w.value}</div>
            <div className="text-[0.6rem] mt-1" style={{ color: "var(--text-muted)" }}>{w.sub}</div>
          </div>
        ))}
      </div>

      <div className="card mt-5 p-4">
        <div className="text-[0.75rem] font-bold mb-2">{t("widgets.androidWidget")}</div>
        <p className="text-[0.65rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Cuando esta app está instalada como APK, podés añadir un widget de acceso rápido
          a tu escritorio de Android que muestra tu racha y los entrenos de la semana.
          Mantené presionado en un espacio vacío del escritorio → Widgets → MARK PT.
        </p>
      </div>
    </main>
    </PageTransition>
  );
}
