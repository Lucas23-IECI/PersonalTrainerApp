"use client";

import { useState, useEffect } from "react";
import { getCheckinForDate, getSettings, today } from "@/lib/storage";
import {
  calculateSleepDebt,
  getSleepAverage,
  getSleepConsistency,
  getSleepQualityAvg,
  getSleepTips,
  QUALITY_EMOJIS,
  QUALITY_LABELS,
} from "@/lib/sleep-utils";
import SleepLogModal from "@/components/sleep/SleepLogModal";
import SleepDebtCard from "@/components/sleep/SleepDebtCard";
import SleepChart from "@/components/sleep/SleepChart";
import Link from "next/link";
import { ArrowLeft, Moon, Plus, Target, TrendingUp, Lightbulb } from "lucide-react";
import { PageTransition } from "@/components/motion";

export default function SleepPage() {
  const [logOpen, setLogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const todayCheckin = getCheckinForDate(today());
  const goal = getSettings().sleepGoal;
  const avg7 = getSleepAverage(7);
  const avg30 = getSleepAverage(30);
  const consistency = getSleepConsistency(30);
  const qualityAvg = getSleepQualityAvg(7);
  const tips = getSleepTips(14);

  function handleSaved() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <PageTransition key={refreshKey}>
      <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
                <Moon size={18} style={{ color: "#5E5CE6" }} /> Sueño
              </h1>
              <p className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                Meta: {goal}h por noche
              </p>
            </div>
          </div>
          <button
            onClick={() => setLogOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.72rem] font-bold border-none cursor-pointer"
            style={{ background: "#5E5CE6", color: "#fff" }}
          >
            <Plus size={14} /> Registrar
          </button>
        </div>

        {/* Today summary */}
        <div className="card mb-4" style={{ borderLeft: "3px solid #5E5CE6" }}>
          <div className="text-[0.6rem] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Hoy
          </div>
          {todayCheckin?.sleepHours ? (
            <div className="flex items-center gap-4">
              <div>
                <span
                  className="text-3xl font-black"
                  style={{ color: todayCheckin.sleepHours >= goal ? "#34C759" : "#FF3B30" }}
                >
                  {todayCheckin.sleepHours}h
                </span>
              </div>
              {todayCheckin.sleepQuality && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{QUALITY_EMOJIS[todayCheckin.sleepQuality]}</span>
                  <span className="text-[0.68rem]" style={{ color: "var(--text-secondary)" }}>
                    {QUALITY_LABELS[todayCheckin.sleepQuality]}
                  </span>
                </div>
              )}
              {todayCheckin.bedtime && todayCheckin.wakeTime && (
                <div className="text-[0.65rem] ml-auto" style={{ color: "var(--text-muted)" }}>
                  🌙 {todayCheckin.bedtime} → ☀️ {todayCheckin.wakeTime}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setLogOpen(true)}
              className="text-[0.75rem] font-semibold border-none bg-transparent cursor-pointer"
              style={{ color: "#5E5CE6" }}
            >
              + Registrar sueño de anoche
            </button>
          )}
        </div>

        {/* Debt Card */}
        <div className="mb-4">
          <SleepDebtCard />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center py-3">
            <TrendingUp size={14} className="mx-auto mb-1" style={{ color: "#5E5CE6" }} />
            <div className="text-xl font-black" style={{ color: avg7 >= goal ? "#34C759" : "#FF9500" }}>
              {avg7}h
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>
              Promedio 7 días
            </div>
          </div>
          <div className="card text-center py-3">
            <TrendingUp size={14} className="mx-auto mb-1" style={{ color: "#5E5CE6" }} />
            <div className="text-xl font-black" style={{ color: avg30 >= goal ? "#34C759" : "#FF9500" }}>
              {avg30}h
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>
              Promedio 30 días
            </div>
          </div>
          <div className="card text-center py-3">
            <Target size={14} className="mx-auto mb-1" style={{ color: "#5E5CE6" }} />
            <div className="text-xl font-black" style={{ color: consistency >= 70 ? "#34C759" : "#FF9500" }}>
              {consistency}%
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>
              Consistencia 30d
            </div>
          </div>
          <div className="card text-center py-3">
            <span className="text-sm">{qualityAvg >= 4 ? "🌟" : qualityAvg >= 3 ? "😊" : qualityAvg > 0 ? "😐" : "—"}</span>
            <div className="text-xl font-black" style={{ color: "var(--text)" }}>
              {qualityAvg > 0 ? `${qualityAvg}/5` : "—"}
            </div>
            <div className="text-[0.5rem] uppercase" style={{ color: "var(--text-muted)" }}>
              Calidad Prom
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-4">
          <SleepChart days={14} />
        </div>

        {/* Tips */}
        {tips.length > 0 && (
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} style={{ color: "#FFD700" }} />
              <span className="text-[0.65rem] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Recomendaciones
              </span>
            </div>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="text-[0.72rem] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  • {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        <SleepLogModal open={logOpen} onClose={() => setLogOpen(false)} onSaved={handleSaved} />
      </main>
    </PageTransition>
  );
}
