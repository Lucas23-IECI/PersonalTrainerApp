"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun } from "lucide-react";
import {
  today,
  getCheckinForDate,
  saveCheckin,
  type DailyCheckin,
} from "@/lib/storage";
import {
  calculateSleepHours,
  QUALITY_EMOJIS,
  QUALITY_LABELS,
  BEDTIME_PRESETS,
  WAKE_PRESETS,
} from "@/lib/sleep-utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function SleepLogModal({ open, onClose, onSaved }: Props) {
  const todayStr = today();
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [manualHours, setManualHours] = useState<number | null>(null);
  const [useManual, setUseManual] = useState(false);

  const autoHours = calculateSleepHours(bedtime, wakeTime);
  const hours = useManual && manualHours !== null ? manualHours : autoHours;

  useEffect(() => {
    if (open) {
      const existing = getCheckinForDate(todayStr);
      if (existing) {
        if (existing.bedtime) setBedtime(existing.bedtime);
        if (existing.wakeTime) setWakeTime(existing.wakeTime);
        if (existing.sleepQuality) setQuality(existing.sleepQuality);
        if (existing.bedtime || existing.wakeTime) {
          setUseManual(false);
        } else if (existing.sleepHours) {
          setManualHours(existing.sleepHours);
          setUseManual(true);
        }
      } else {
        setBedtime("23:00");
        setWakeTime("07:00");
        setQuality(3);
        setManualHours(null);
        setUseManual(false);
      }
    }
  }, [open, todayStr]);

  function submit() {
    const existing = getCheckinForDate(todayStr);
    const ci: DailyCheckin = {
      date: todayStr,
      energy: existing?.energy || 3,
      soreness: existing?.soreness || 1,
      weight: existing?.weight,
      notes: existing?.notes,
      sleepHours: hours,
      sleepQuality: quality,
      bedtime: useManual ? undefined : bedtime,
      wakeTime: useManual ? undefined : wakeTime,
    };
    saveCheckin(ci);
    onSaved();
    onClose();
  }

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
            style={{ background: "var(--bg-card)", maxHeight: "85vh", overflowY: "auto" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--text-muted)" }} />
            </div>

            <div className="px-5 pb-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Moon size={18} style={{ color: "#5E5CE6" }} />
                  <span className="text-sm font-bold" style={{ color: "#5E5CE6" }}>
                    Registrar Sueño
                  </span>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <X size={20} />
                </button>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setUseManual(false)}
                  className="flex-1 py-2 rounded-lg text-[0.7rem] font-semibold"
                  style={{
                    background: !useManual ? "#5E5CE620" : "var(--bg-elevated)",
                    border: `1px solid ${!useManual ? "#5E5CE6" : "var(--border)"}`,
                    color: !useManual ? "#5E5CE6" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  🕐 Horarios
                </button>
                <button
                  onClick={() => { setUseManual(true); setManualHours(manualHours || autoHours); }}
                  className="flex-1 py-2 rounded-lg text-[0.7rem] font-semibold"
                  style={{
                    background: useManual ? "#5E5CE620" : "var(--bg-elevated)",
                    border: `1px solid ${useManual ? "#5E5CE6" : "var(--border)"}`,
                    color: useManual ? "#5E5CE6" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  ⏱ Horas directas
                </button>
              </div>

              {!useManual ? (
                <>
                  {/* Bedtime */}
                  <div className="mb-4">
                    <label className="flex items-center gap-1.5 text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                      <Moon size={12} /> Me acosté
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {BEDTIME_PRESETS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setBedtime(t)}
                          className="px-3 py-1.5 rounded-lg text-[0.68rem] font-semibold"
                          style={{
                            background: bedtime === t ? "#5E5CE6" : "var(--bg-elevated)",
                            color: bedtime === t ? "#fff" : "var(--text-secondary)",
                            border: `1px solid ${bedtime === t ? "#5E5CE6" : "var(--border)"}`,
                            cursor: "pointer",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wake time */}
                  <div className="mb-4">
                    <label className="flex items-center gap-1.5 text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                      <Sun size={12} /> Me desperté
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {WAKE_PRESETS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setWakeTime(t)}
                          className="px-3 py-1.5 rounded-lg text-[0.68rem] font-semibold"
                          style={{
                            background: wakeTime === t ? "#FF9500" : "var(--bg-elevated)",
                            color: wakeTime === t ? "#fff" : "var(--text-secondary)",
                            border: `1px solid ${wakeTime === t ? "#FF9500" : "var(--border)"}`,
                            cursor: "pointer",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculated duration */}
                  <div className="text-center py-3 rounded-xl mb-4" style={{ background: "var(--bg-elevated)" }}>
                    <div className="text-3xl font-black" style={{ color: autoHours < 7 ? "#FF3B30" : "#34C759" }}>
                      {autoHours}h
                    </div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>duración calculada</div>
                  </div>
                </>
              ) : (
                /* Manual slider */
                <div className="mb-5">
                  <label className="block text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                    Horas dormidas:{" "}
                    <strong className="text-xl" style={{ color: (manualHours || 0) < 7 ? "#FF3B30" : "#34C759" }}>
                      {manualHours || 0}h
                    </strong>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    step={0.5}
                    value={manualHours || 7}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: (manualHours || 0) < 7 ? "#FF3B30" : "#34C759" }}
                  />
                  <div className="flex justify-between text-[0.5rem]" style={{ color: "var(--text-muted)" }}>
                    <span>2h</span>
                    <span>12h</span>
                  </div>
                </div>
              )}

              {/* Quality */}
              <div className="mb-5">
                <label className="block text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                  Calidad del sueño
                </label>
                <div className="flex gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setQuality(v)}
                      className="flex-1 py-2.5 rounded-lg text-center"
                      style={{
                        background: quality === v ? "#5E5CE620" : "var(--bg-elevated)",
                        border: `1px solid ${quality === v ? "#5E5CE6" : "var(--border)"}`,
                        cursor: "pointer",
                      }}
                    >
                      <div className="text-lg">{QUALITY_EMOJIS[v]}</div>
                      <div className="text-[0.5rem] font-medium" style={{ color: quality === v ? "#5E5CE6" : "var(--text-muted)" }}>
                        {QUALITY_LABELS[v]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={submit}
                className="w-full py-3.5 rounded-xl text-[0.88rem] font-bold border-none cursor-pointer transition-transform active:scale-[0.98]"
                style={{ background: "#5E5CE6", color: "#fff" }}
              >
                Guardar Sueño
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
