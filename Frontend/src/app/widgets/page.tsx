"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Flame, Dumbbell, TrendingUp, Target, Trophy } from "lucide-react";
import { getSessions, type WorkoutSession } from "@/lib/storage";
import { getProfileData } from "@/data/profile";
import { getSettings } from "@/lib/storage";

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
      title: "Racha Actual",
      value: `${streak} días`,
      icon: Flame,
      gradient: "from-[#FF9500] to-[#FF3B30]",
      sub: streak >= 7 ? "🔥 ¡Imparable!" : streak >= 3 ? "💪 ¡Seguí así!" : "¡Empezá hoy!",
    },
    {
      title: "Esta Semana",
      value: `${thisWeek} entrenos`,
      icon: Target,
      gradient: "from-[#30D158] to-[#34C759]",
      sub: `Meta: 5 por semana`,
    },
    {
      title: "Total Sesiones",
      value: `${totalSessions}`,
      icon: Dumbbell,
      gradient: "from-[#0A84FF] to-[#2C6BED]",
      sub: "Desde que empezaste",
    },
    {
      title: "Volumen Total",
      value: `${(totalVolume / 1000).toFixed(0)}t`,
      icon: TrendingUp,
      gradient: "from-[#AF52DE] to-[#5856D6]",
      sub: `${totalVolume.toLocaleString()} ${unit} movidos`,
    },
    {
      title: "Peso Actual",
      value: `${prof.weight} ${unit}`,
      icon: Trophy,
      gradient: "from-[#FF2D55] to-[#FF375F]",
      sub: `Meta: ${prof.goalWeight} ${unit}`,
    },
  ];

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-zinc-500 mb-4 bg-transparent border-none cursor-pointer p-0">
        <ChevronLeft size={16} /> Volver
      </button>

      <h1 className="text-xl font-black tracking-tight mb-1">Quick Stats</h1>
      <p className="text-[0.7rem] text-zinc-500 mb-5">
        Widgets rápidos con tus estadísticas. En Android, mantené presionado el ícono de la app para accesos directos.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {widgets.map((w) => (
          <div
            key={w.title}
            className="card p-4 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl bg-gradient-to-br ${w.gradient} opacity-15`} />
            <w.icon size={20} className="mb-2" style={{ color: "var(--accent)" }} />
            <div className="text-[0.6rem] text-zinc-500 uppercase tracking-wider mb-1">{w.title}</div>
            <div className="text-xl font-black">{w.value}</div>
            <div className="text-[0.6rem] text-zinc-500 mt-1">{w.sub}</div>
          </div>
        ))}
      </div>

      <div className="card mt-5 p-4">
        <div className="text-[0.75rem] font-bold mb-2">📱 Widget Android</div>
        <p className="text-[0.65rem] text-zinc-500 leading-relaxed">
          Cuando esta app está instalada como APK, podés añadir un widget de acceso rápido
          a tu escritorio de Android que muestra tu racha y los entrenos de la semana.
          Mantené presionado en un espacio vacío del escritorio → Widgets → MARK PT.
        </p>
      </div>
    </main>
  );
}
