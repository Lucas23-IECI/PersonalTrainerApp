"use client";

import { useMemo } from "react";
import { getSessions } from "@/lib/storage";
import { Flame, Zap, Calendar, TrendingUp } from "lucide-react";

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
  thisMonth: number;
  avgPerWeek: number;
  totalSessions: number;
  consistency: number; // % of weeks with at least 1 session
}

export default function TrainingStreakCard() {
  const stats: StreakStats = useMemo(() => {
    const sessions = getSessions().filter((s) => s.completed);
    const trainedDates = new Set(sessions.map((s) => s.date));
    const sortedDates = Array.from(trainedDates).sort();

    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, thisWeek: 0, thisMonth: 0, avgPerWeek: 0, totalSessions: 0, consistency: 0 };
    }

    // Current streak
    const today = new Date();
    let current = 0;
    const d = new Date(today);
    const todayStr = d.toISOString().slice(0, 10);
    if (!trainedDates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (trainedDates.has(ds)) {
        current++;
        d.setDate(d.getDate() - 1);
      } else break;
    }

    // Longest streak
    let longest = 0;
    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        longest = Math.max(longest, tempStreak);
        tempStreak = 1;
      }
    }
    longest = Math.max(longest, tempStreak);

    // This week (Mon-Sun)
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    const mondayStr = monday.toISOString().slice(0, 10);
    const thisWeek = sortedDates.filter((d) => d >= mondayStr).length;

    // This month
    const monthStr = now.toISOString().slice(0, 7);
    const thisMonth = sortedDates.filter((d) => d.startsWith(monthStr)).length;

    // Avg per week (over last 8 weeks)
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 56);
    const eightWeeksStr = eightWeeksAgo.toISOString().slice(0, 10);
    const recentDays = sortedDates.filter((d) => d >= eightWeeksStr).length;
    const avgPerWeek = Math.round((recentDays / 8) * 10) / 10;

    // Consistency: % of weeks with training in last 12 weeks
    const weeksWithTraining = new Set<string>();
    for (const date of sortedDates) {
      const dt = new Date(date);
      const dow = (dt.getDay() + 6) % 7;
      const mon = new Date(dt);
      mon.setDate(dt.getDate() - dow);
      weeksWithTraining.add(mon.toISOString().slice(0, 10));
    }
    const twelveWeeksAgo = new Date(now);
    twelveWeeksAgo.setDate(now.getDate() - 84);
    const recentWeeks = Array.from(weeksWithTraining).filter((w) => w >= twelveWeeksAgo.toISOString().slice(0, 10));
    const consistency = Math.round((recentWeeks.length / 12) * 100);

    return {
      currentStreak: current,
      longestStreak: longest,
      thisWeek,
      thisMonth,
      avgPerWeek,
      totalSessions: sessions.length,
      consistency,
    };
  }, []);

  // Streak fire intensity
  const fireLevel = stats.currentStreak >= 7 ? 3 : stats.currentStreak >= 3 ? 2 : stats.currentStreak >= 1 ? 1 : 0;
  const fireColors = ["#636366", "#FF9500", "#FF6B00", "#FF3B30"];

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="shrink-0" style={{ color: fireColors[fireLevel] }} />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Racha de Entreno</div>
        </div>
      </div>

      {/* Main streak display */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="text-center">
          <div className="text-4xl font-black" style={{ color: fireColors[fireLevel] }}>
            {stats.currentStreak}
          </div>
          <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>días seguidos</div>
        </div>
        <div className="w-px h-12" style={{ background: "var(--border)" }} />
        <div className="text-center">
          <div className="text-2xl font-black" style={{ color: "var(--text-muted)" }}>{stats.longestStreak}</div>
          <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>récord</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="text-center py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <Calendar size={12} className="mx-auto mb-0.5" style={{ color: "var(--accent)" }} />
          <div className="text-[0.75rem] font-bold">{stats.thisWeek}</div>
          <div className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>esta sem</div>
        </div>
        <div className="text-center py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <Calendar size={12} className="text-[#34C759] mx-auto mb-0.5" />
          <div className="text-[0.75rem] font-bold">{stats.thisMonth}</div>
          <div className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>este mes</div>
        </div>
        <div className="text-center py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <TrendingUp size={12} className="text-[#FF9500] mx-auto mb-0.5" />
          <div className="text-[0.75rem] font-bold">{stats.avgPerWeek}</div>
          <div className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>prom/sem</div>
        </div>
        <div className="text-center py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <Zap size={12} className="text-[#BF5AF2] mx-auto mb-0.5" />
          <div className="text-[0.75rem] font-bold">{stats.consistency}%</div>
          <div className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>consist.</div>
        </div>
      </div>

      {/* Consistency bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[0.5rem] mb-1" style={{ color: "var(--text-muted)" }}>
          <span>Consistencia 12 sem</span>
          <span>{stats.consistency}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${stats.consistency}%`,
              background: stats.consistency >= 80 ? "#34C759" : stats.consistency >= 50 ? "#FF9500" : "#FF3B30",
            }}
          />
        </div>
      </div>
    </div>
  );
}
