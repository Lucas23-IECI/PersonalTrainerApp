"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Moon, Droplets, X, Check } from "lucide-react";
import {
  today,
  getCheckinForDate,
  saveCheckin,
  getNutritionForDate,
  saveNutritionEntry,
  type DailyCheckin,
} from "@/lib/storage";
import { t } from "@/lib/i18n";

type Tab = "weight" | "sleep" | "water";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialTab?: Tab;
}

const WATER_PRESETS = [250, 500, 750, 1000];

export default function QuickLogSheet({ open, onClose, onSaved, initialTab = "weight" }: Props) {
  const todayStr = today();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState(7);
  const [waterAdd, setWaterAdd] = useState(250);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSaved(false);
      const checkin = getCheckinForDate(todayStr);
      if (checkin?.weight) setWeight(String(checkin.weight));
      if (checkin?.sleepHours) setSleep(checkin.sleepHours);
    }
  }, [open, todayStr, initialTab]);

  function saveWeight() {
    const w = parseFloat(weight);
    if (!w || w <= 0 || w > 500) return;
    const existing = getCheckinForDate(todayStr);
    const checkin: DailyCheckin = {
      date: todayStr,
      sleepHours: existing?.sleepHours || 7,
      energy: existing?.energy || 3,
      soreness: existing?.soreness || 1,
      weight: w,
      notes: existing?.notes || "",
    };
    if (existing?.sleepQuality) checkin.sleepQuality = existing.sleepQuality;
    saveCheckin(checkin);
    flashSaved();
  }

  function saveSleep() {
    const existing = getCheckinForDate(todayStr);
    const checkin: DailyCheckin = {
      date: todayStr,
      sleepHours: sleep,
      energy: existing?.energy || 3,
      soreness: existing?.soreness || 1,
      weight: existing?.weight || 0,
      notes: existing?.notes || "",
    };
    if (existing?.sleepQuality) checkin.sleepQuality = existing.sleepQuality;
    saveCheckin(checkin);
    flashSaved();
  }

  function addWater() {
    const entry = getNutritionForDate(todayStr);
    entry.waterMl += waterAdd;
    saveNutritionEntry(entry);
    flashSaved();
  }

  function flashSaved() {
    setSaved(true);
    onSaved();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  }

  const tabs: { id: Tab; icon: typeof Scale; label: string }[] = [
    { id: "weight", icon: Scale, label: t("quickLog.weight") },
    { id: "sleep", icon: Moon, label: t("quickLog.sleep") },
    { id: "water", icon: Droplets, label: t("quickLog.water") },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-w-[540px] mx-auto rounded-t-2xl"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="px-5 pt-3 pb-6" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--text-muted)" }} />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[0.85rem] font-bold">{t("quickLog.title")}</span>
                <button onClick={onClose} className="p-1 border-none bg-transparent cursor-pointer" style={{ color: "var(--text-muted)" }}>
                  <X size={18} />
                </button>
              </div>

              {/* Tab pills */}
              <div className="flex gap-2 mb-5">
                {tabs.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[0.7rem] font-semibold border-none cursor-pointer transition-all"
                    style={{
                      background: tab === id ? "var(--accent)" : "var(--bg-elevated)",
                      color: tab === id ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Content */}
              {tab === "weight" && (
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
                    {t("quickLog.weightLabel")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="500"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="75.0"
                    className="w-full text-center text-2xl font-black py-3 mb-4"
                    autoFocus
                  />
                  <button onClick={saveWeight} className="btn btn-primary w-full">
                    {saved ? <><Check size={16} /> {t("quickLog.saved")}</> : t("common.save")}
                  </button>
                </div>
              )}

              {tab === "sleep" && (
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
                    {t("quickLog.sleepLabel")}
                  </label>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={() => setSleep(Math.max(2, sleep - 0.5))}
                      className="w-10 h-10 rounded-full border-none cursor-pointer text-lg font-bold"
                      style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
                    >
                      −
                    </button>
                    <span className="text-3xl font-black" style={{ minWidth: 80, textAlign: "center" }}>
                      {sleep}h
                    </span>
                    <button
                      onClick={() => setSleep(Math.min(14, sleep + 0.5))}
                      className="w-10 h-10 rounded-full border-none cursor-pointer text-lg font-bold"
                      style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={14}
                    step={0.5}
                    value={sleep}
                    onChange={(e) => setSleep(Number(e.target.value))}
                    className="w-full mb-4"
                    style={{ accentColor: "var(--accent-violet)" }}
                  />
                  <button onClick={saveSleep} className="btn btn-primary w-full">
                    {saved ? <><Check size={16} /> {t("quickLog.saved")}</> : t("common.save")}
                  </button>
                </div>
              )}

              {tab === "water" && (
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
                    {t("quickLog.waterLabel")}
                  </label>
                  {/* Current water */}
                  <div className="text-center mb-4">
                    <span className="text-2xl font-black" style={{ color: "var(--accent-blue)" }}>
                      {(getNutritionForDate(todayStr).waterMl / 1000).toFixed(1)}L
                    </span>
                    <span className="text-[0.65rem] ml-1" style={{ color: "var(--text-muted)" }}>
                      {t("quickLog.waterToday")}
                    </span>
                  </div>
                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {WATER_PRESETS.map((ml) => (
                      <button
                        key={ml}
                        onClick={() => setWaterAdd(ml)}
                        className="py-2.5 rounded-xl text-[0.72rem] font-semibold border-none cursor-pointer transition-all"
                        style={{
                          background: waterAdd === ml ? "var(--accent-blue)" : "var(--bg-elevated)",
                          color: waterAdd === ml ? "#fff" : "var(--text-secondary)",
                        }}
                      >
                        {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                      </button>
                    ))}
                  </div>
                  <button onClick={addWater} className="btn btn-primary w-full" style={{ background: "var(--accent-blue)" }}>
                    {saved ? <><Check size={16} /> {t("quickLog.saved")}</> : <>+ {waterAdd}ml</>}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
