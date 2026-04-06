"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon } from "lucide-react";
import Link from "next/link";
import {
  today,
  getCheckinForDate,
  saveCheckin,
  type DailyCheckin,
} from "@/lib/storage";
import { QUALITY_EMOJIS, QUALITY_LABELS } from "@/lib/sleep-utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultWeight?: number;
}

const energyLabels = ["", "Muerto", "Bajo", "Normal", "Bien", "Top"];
const energyColors = ["", "#FF3B30", "#FF9500", "#FF9500", "#34C759", "#34C759"];
const sorenessLabels = ["Nada", "Leve", "Moderado", "Fuerte"];
const stressLabels = ["", "Relajado", "Bajo", "Normal", "Alto", "Extremo"];
const stressColors = ["", "#34C759", "#34C759", "#FF9500", "#FF3B30", "#FF3B30"];

export default function CheckinBottomSheet({ open, onClose, onSaved, defaultWeight }: Props) {
  const todayStr = today();
  const [sleep, setSleep] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [soreness, setSoreness] = useState<0 | 1 | 2 | 3>(1);
  const [stress, setStress] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      const existing = getCheckinForDate(todayStr);
      if (existing) {
        setSleep(existing.sleepHours || 7);
        setSleepQuality(existing.sleepQuality || 3);
        setEnergy(existing.energy);
        setSoreness(existing.soreness);
        setStress(existing.stress || 3);
        setWeight(existing.weight ? String(existing.weight) : "");
        setNotes(existing.notes || "");
      } else {
        setSleep(7);
        setSleepQuality(3);
        setEnergy(3);
        setSoreness(1);
        setStress(3);
        setWeight(defaultWeight ? String(defaultWeight) : "");
        setNotes("");
      }
    }
  }, [open, todayStr, defaultWeight]);

  function submit() {
    const ci: DailyCheckin = {
      date: todayStr,
      sleepHours: sleep,
      sleepQuality,
      energy,
      soreness,
      stress,
      weight: weight ? parseFloat(weight) : undefined,
      notes: notes || undefined,
    };
    saveCheckin(ci);
    onSaved();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-w-[540px] mx-auto rounded-t-2xl"
            style={{ background: "var(--bg-card)", maxHeight: "85vh", overflowY: "auto" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--text-muted)" }} />
            </div>

            <div className="px-5 pb-6">
              {/* Title */}
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                  Check-in — {todayStr}
                </div>
                <button
                  onClick={onClose}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sleep */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[0.62rem] uppercase" style={{ color: "var(--text-muted)" }}>
                    Sueño:{" "}
                    <strong className="text-base" style={{ color: sleep < 7 ? "var(--accent-red)" : "var(--accent-green)" }}>
                      {sleep}h
                    </strong>
                  </label>
                  <Link href="/sleep" className="text-[0.58rem] no-underline font-semibold" style={{ color: "#5E5CE6" }}>Ver más →</Link>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={0.5}
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: sleep < 7 ? "var(--accent-red)" : "var(--accent-green)" }}
                />
              </div>

              {/* Sleep Quality */}
              <div className="mb-5">
                <label className="flex items-center gap-1.5 text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                  <Moon size={12} /> Calidad del sueño
                </label>
                <div className="flex gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSleepQuality(v)}
                      className="flex-1 py-2 rounded-lg text-center"
                      style={{
                        background: sleepQuality === v ? "#5E5CE620" : "var(--bg-elevated)",
                        border: `1px solid ${sleepQuality === v ? "#5E5CE6" : "var(--border)"}`,
                        cursor: "pointer",
                      }}
                    >
                      <div className="text-sm">{QUALITY_EMOJIS[v]}</div>
                      <div className="text-[0.45rem] font-medium" style={{ color: sleepQuality === v ? "#5E5CE6" : "var(--text-muted)" }}>
                        {QUALITY_LABELS[v]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div className="mb-5">
                <label className="block text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                  Energía
                </label>
                <div className="flex gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setEnergy(v)}
                      className="flex-1 py-2.5 rounded-lg text-[0.6rem] font-semibold"
                      style={{
                        background: energy === v ? energyColors[v] : "var(--bg-elevated)",
                        border: `1px solid ${energy === v ? energyColors[v] : "var(--border)"}`,
                        color: energy === v ? "#000" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {energyLabels[v]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Soreness */}
              <div className="mb-5">
                <label className="block text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                  Dolor muscular
                </label>
                <div className="flex gap-1.5">
                  {([0, 1, 2, 3] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSoreness(v)}
                      className="flex-1 py-2.5 rounded-lg text-[0.62rem] font-semibold"
                      style={{
                        background: soreness === v ? "var(--bg-elevated)" : "transparent",
                        border: `1px solid ${soreness === v ? "var(--text-muted)" : "var(--border)"}`,
                        color: soreness === v ? "var(--text)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {sorenessLabels[v]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress (7.3) */}
              <div className="mb-5">
                <label className="block text-[0.62rem] uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                  Nivel de estrés
                </label>
                <div className="flex gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setStress(v)}
                      className="flex-1 py-2.5 rounded-lg text-[0.6rem] font-semibold"
                      style={{
                        background: stress === v ? stressColors[v] : "var(--bg-elevated)",
                        border: `1px solid ${stress === v ? stressColors[v] : "var(--border)"}`,
                        color: stress === v ? "#000" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {stressLabels[v]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight + Notes */}
              <div className="grid grid-cols-[120px_1fr] gap-3 mb-5">
                <div>
                  <label className="block text-[0.62rem] uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    placeholder={defaultWeight ? String(defaultWeight) : "—"}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-[0.62rem] uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                    Notas
                  </label>
                  <input
                    type="text"
                    placeholder="Cómo te sentís..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <button onClick={submit} className="btn btn-primary w-full">
                Guardar Check-in
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
