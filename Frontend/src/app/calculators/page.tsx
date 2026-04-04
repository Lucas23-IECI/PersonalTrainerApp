"use client";

import { useState } from "react";
import { ChevronLeft, Calculator, Flame, Target, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSettings } from "@/lib/storage";

type Tab = "1rm" | "tdee" | "macros" | "wilks";

// ===== FORMULAS =====
function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function brzycki1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return 0;
  return Math.round(weight * (36 / (37 - reps)));
}

function calcTDEE(bmr: number, activityLevel: number): number {
  return Math.round(bmr * activityLevel);
}

function mifflinStJeor(weight: number, height: number, age: number, isMale: boolean): number {
  // weight in kg, height in cm
  if (isMale) return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}

function calcWilks(total: number, bodyweight: number, isMale: boolean): number {
  if (bodyweight <= 0 || total <= 0) return 0;
  const bw = bodyweight;
  let coeff: number;
  if (isMale) {
    const a = -216.0475144, b = 16.2606339, c = -0.002388645, d = -0.00113732, e = 7.01863e-6, f = -1.291e-8;
    coeff = 500 / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5);
  } else {
    const a = 594.31747775582, b = -27.23842536447, c = 0.82112226871, d = -0.00930733913, e = 4.731582e-5, f = -9.054e-8;
    coeff = 500 / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5);
  }
  return Math.round(total * Math.max(coeff, 0) * 100) / 100;
}

// Percentages of 1RM for rep ranges
const REP_TABLE = [
  { reps: 1, pct: 100 }, { reps: 2, pct: 97 }, { reps: 3, pct: 94 },
  { reps: 4, pct: 92 }, { reps: 5, pct: 89 }, { reps: 6, pct: 86 },
  { reps: 8, pct: 81 }, { reps: 10, pct: 75 }, { reps: 12, pct: 70 },
  { reps: 15, pct: 65 }, { reps: 20, pct: 58 },
];

const ACTIVITY_LEVELS = [
  { label: "Sedentario", detail: "Escritorio, sin ejercicio", value: 1.2 },
  { label: "Ligero", detail: "1-3 días/semana", value: 1.375 },
  { label: "Moderado", detail: "3-5 días/semana", value: 1.55 },
  { label: "Activo", detail: "6-7 días/semana", value: 1.725 },
  { label: "Muy activo", detail: "Atleta, 2x/día", value: 1.9 },
];

export default function CalculatorsPage() {
  const router = useRouter();
  const unit = getSettings().unit;
  const [tab, setTab] = useState<Tab>("1rm");

  // 1RM state
  const [rmWeight, setRmWeight] = useState("");
  const [rmReps, setRmReps] = useState("");

  // TDEE state
  const [tdeeWeight, setTdeeWeight] = useState("");
  const [tdeeHeight, setTdeeHeight] = useState("");
  const [tdeeAge, setTdeeAge] = useState("");
  const [tdeeMale, setTdeeMale] = useState(true);
  const [tdeeActivity, setTdeeActivity] = useState(1.55);

  // Macros state
  const [macroCalories, setMacroCalories] = useState("");
  const [macroGoal, setMacroGoal] = useState<"cut" | "maintain" | "bulk">("maintain");

  // Wilks state
  const [wilksSquat, setWilksSquat] = useState("");
  const [wilksBench, setWilksBench] = useState("");
  const [wilksDeadlift, setWilksDeadlift] = useState("");
  const [wilksBW, setWilksBW] = useState("");
  const [wilksMale, setWilksMale] = useState(true);

  // Computed values
  const w = parseFloat(rmWeight) || 0;
  const r = parseInt(rmReps, 10) || 0;
  const estimated1RM = epley1RM(unit === "lbs" ? w * 0.453592 : w, r);
  const brz1RM = brzycki1RM(unit === "lbs" ? w * 0.453592 : w, r);
  const display1RM = unit === "lbs" ? Math.round(estimated1RM * 2.20462) : estimated1RM;
  const displayBrz = unit === "lbs" ? Math.round(brz1RM * 2.20462) : brz1RM;

  const tBMR = mifflinStJeor(parseFloat(tdeeWeight) || 0, parseFloat(tdeeHeight) || 0, parseInt(tdeeAge, 10) || 0, tdeeMale);
  const tTDEE = calcTDEE(tBMR, tdeeActivity);

  const mCal = parseInt(macroCalories, 10) || 0;
  const macroSplit = macroGoal === "cut"
    ? { protein: 0.40, carbs: 0.30, fat: 0.30 }
    : macroGoal === "bulk"
    ? { protein: 0.30, carbs: 0.45, fat: 0.25 }
    : { protein: 0.30, carbs: 0.40, fat: 0.30 };
  const macros = {
    protein: Math.round((mCal * macroSplit.protein) / 4),
    carbs: Math.round((mCal * macroSplit.carbs) / 4),
    fat: Math.round((mCal * macroSplit.fat) / 9),
  };

  const wTotal = (parseFloat(wilksSquat) || 0) + (parseFloat(wilksBench) || 0) + (parseFloat(wilksDeadlift) || 0);
  const wBW = parseFloat(wilksBW) || 0;
  const wilksScore = calcWilks(unit === "lbs" ? wTotal * 0.453592 : wTotal, unit === "lbs" ? wBW * 0.453592 : wBW, wilksMale);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "1rm", label: "1RM", icon: <Calculator size={14} /> },
    { id: "tdee", label: "TDEE", icon: <Flame size={14} /> },
    { id: "macros", label: "Macros", icon: <Target size={14} /> },
    { id: "wilks", label: "Wilks", icon: <Trophy size={14} /> },
  ];

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-zinc-500 mb-4 bg-transparent border-none cursor-pointer p-0">
        <ChevronLeft size={16} /> Volver
      </button>

      <h1 className="text-xl font-black tracking-tight mb-1">Calculadoras</h1>
      <p className="text-[0.65rem] text-zinc-500 mb-4">Herramientas de fitness</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.7rem] font-semibold whitespace-nowrap cursor-pointer border-none transition-colors ${
              tab === t.id ? "bg-[#2C6BED] text-white" : "bg-[#F2F2F7] text-zinc-500"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 1RM Calculator */}
      {tab === "1rm" && (
        <div>
          <div className="card mb-3">
            <div className="text-[0.75rem] font-bold mb-3">Calculadora 1RM</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Peso ({unit})</label>
                <input
                  type="number"
                  value={rmWeight}
                  onChange={(e) => setRmWeight(e.target.value)}
                  placeholder="100"
                  className="w-full text-center text-lg py-2.5 rounded-xl"
                  style={{ background: "var(--bg-elevated)" }}
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Repeticiones</label>
                <input
                  type="number"
                  value={rmReps}
                  onChange={(e) => setRmReps(e.target.value)}
                  placeholder="5"
                  className="w-full text-center text-lg py-2.5 rounded-xl"
                  style={{ background: "var(--bg-elevated)" }}
                  inputMode="numeric"
                />
              </div>
            </div>

            {display1RM > 0 && (
              <div className="text-center py-4 rounded-xl mb-3" style={{ background: "var(--bg-elevated)" }}>
                <div className="text-[0.6rem] text-zinc-500 uppercase tracking-wider mb-1">1RM Estimado</div>
                <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>{display1RM} {unit}</div>
                <div className="text-[0.6rem] text-zinc-500 mt-1">Brzycki: {displayBrz} {unit}</div>
              </div>
            )}
          </div>

          {/* Rep table */}
          {display1RM > 0 && (
            <div className="card">
              <div className="text-[0.75rem] font-bold mb-2">Tabla de Porcentajes</div>
              <div className="space-y-1.5">
                {REP_TABLE.map((row) => {
                  const val = unit === "lbs" ? Math.round(estimated1RM * 2.20462 * row.pct / 100) : Math.round(estimated1RM * row.pct / 100);
                  return (
                    <div key={row.reps} className="flex justify-between items-center py-1 text-sm">
                      <span className="text-zinc-500">{row.reps} rep{row.reps > 1 ? "s" : ""}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.65rem] text-zinc-500">{row.pct}%</span>
                        <span className="font-bold min-w-[60px] text-right">{val} {unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TDEE Calculator */}
      {tab === "tdee" && (
        <div>
          <div className="card mb-3">
            <div className="text-[0.75rem] font-bold mb-3">Gasto Calórico Diario (TDEE)</div>

            {/* Gender toggle */}
            <div className="flex gap-2 mb-3">
              {[{ male: true, label: "Hombre" }, { male: false, label: "Mujer" }].map((g) => (
                <button
                  key={g.label}
                  onClick={() => setTdeeMale(g.male)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold border-none cursor-pointer"
                  style={{
                    background: tdeeMale === g.male ? "var(--accent)" : "var(--bg-elevated)",
                    color: tdeeMale === g.male ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Peso (kg)</label>
                <input type="number" value={tdeeWeight} onChange={(e) => setTdeeWeight(e.target.value)} placeholder="80" className="w-full text-center text-sm py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="decimal" />
              </div>
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Altura (cm)</label>
                <input type="number" value={tdeeHeight} onChange={(e) => setTdeeHeight(e.target.value)} placeholder="177" className="w-full text-center text-sm py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="numeric" />
              </div>
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Edad</label>
                <input type="number" value={tdeeAge} onChange={(e) => setTdeeAge(e.target.value)} placeholder="22" className="w-full text-center text-sm py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="numeric" />
              </div>
            </div>

            <div className="text-[0.6rem] text-zinc-500 mb-2">Nivel de actividad</div>
            <div className="space-y-1.5 mb-3">
              {ACTIVITY_LEVELS.map((al) => (
                <button
                  key={al.value}
                  onClick={() => setTdeeActivity(al.value)}
                  className="w-full flex justify-between items-center p-2.5 rounded-lg text-left border-none cursor-pointer transition-colors"
                  style={{
                    background: tdeeActivity === al.value ? "rgba(44,107,237,0.1)" : "var(--bg-elevated)",
                    border: tdeeActivity === al.value ? "1px solid var(--accent)" : "1px solid transparent",
                  }}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{al.label}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{al.detail}</div>
                  </div>
                  <span className="text-[0.65rem] font-bold" style={{ color: "var(--accent)" }}>×{al.value}</span>
                </button>
              ))}
            </div>

            {tTDEE > 0 && (
              <div className="text-center py-4 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                <div className="text-[0.6rem] text-zinc-500 mb-1">BMR: {tBMR} kcal/día</div>
                <div className="text-[0.6rem] text-zinc-500 uppercase tracking-wider mb-1">TDEE</div>
                <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>{tTDEE} <span className="text-sm font-normal text-zinc-500">kcal/día</span></div>
                <div className="flex justify-center gap-4 mt-2 text-[0.65rem]">
                  <span style={{ color: "#34C759" }}>Corte: {Math.round(tTDEE * 0.8)}</span>
                  <span style={{ color: "#FFCC00" }}>Mantener: {tTDEE}</span>
                  <span style={{ color: "#FF3B30" }}>Volumen: {Math.round(tTDEE * 1.15)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Macros Calculator */}
      {tab === "macros" && (
        <div>
          <div className="card mb-3">
            <div className="text-[0.75rem] font-bold mb-3">Calculadora de Macros</div>

            <div className="mb-3">
              <label className="block text-[0.6rem] text-zinc-500 mb-1">Calorías diarias (kcal)</label>
              <input type="number" value={macroCalories} onChange={(e) => setMacroCalories(e.target.value)} placeholder="2300" className="w-full text-center text-lg py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="numeric" />
            </div>

            <div className="text-[0.6rem] text-zinc-500 mb-2">Objetivo</div>
            <div className="flex gap-2 mb-4">
              {([
                { id: "cut" as const, label: "Corte", color: "#34C759" },
                { id: "maintain" as const, label: "Mantener", color: "#FFCC00" },
                { id: "bulk" as const, label: "Volumen", color: "#FF9500" },
              ]).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setMacroGoal(g.id)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold border-none cursor-pointer"
                  style={{
                    background: macroGoal === g.id ? g.color + "22" : "var(--bg-elevated)",
                    color: macroGoal === g.id ? g.color : "var(--text-muted)",
                    border: macroGoal === g.id ? `1px solid ${g.color}44` : "1px solid transparent",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {mCal > 0 && (
              <div className="space-y-3">
                {[
                  { label: "Proteína", grams: macros.protein, pct: Math.round(macroSplit.protein * 100), color: "#34C759", cal: macros.protein * 4 },
                  { label: "Carbohidratos", grams: macros.carbs, pct: Math.round(macroSplit.carbs * 100), color: "#FFCC00", cal: macros.carbs * 4 },
                  { label: "Grasa", grams: macros.fat, pct: Math.round(macroSplit.fat * 100), color: "#AF52DE", cal: macros.fat * 9 },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{m.label}</span>
                      <span className="text-lg font-black" style={{ color: m.color }}>{m.grams}g</span>
                    </div>
                    <div className="flex justify-between text-[0.6rem] text-zinc-500">
                      <span>{m.pct}% de las calorías</span>
                      <span>{m.cal} kcal</span>
                    </div>
                    <div className="progress-bar mt-1.5">
                      <div className="progress-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wilks Calculator */}
      {tab === "wilks" && (
        <div>
          <div className="card mb-3">
            <div className="text-[0.75rem] font-bold mb-3">Wilks Score (Powerlifting)</div>

            <div className="flex gap-2 mb-3">
              {[{ male: true, label: "Hombre" }, { male: false, label: "Mujer" }].map((g) => (
                <button
                  key={g.label}
                  onClick={() => setWilksMale(g.male)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold border-none cursor-pointer"
                  style={{
                    background: wilksMale === g.male ? "var(--accent)" : "var(--bg-elevated)",
                    color: wilksMale === g.male ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label className="block text-[0.6rem] text-zinc-500 mb-1">Peso Corporal ({unit})</label>
              <input type="number" value={wilksBW} onChange={(e) => setWilksBW(e.target.value)} placeholder="81" className="w-full text-center text-sm py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="decimal" />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Sentadilla ({unit})</label>
                <input type="number" value={wilksSquat} onChange={(e) => setWilksSquat(e.target.value)} placeholder="140" className="w-full text-center text-sm py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="decimal" />
              </div>
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Banca ({unit})</label>
                <input type="number" value={wilksBench} onChange={(e) => setWilksBench(e.target.value)} placeholder="100" className="w-full text-center text-sm py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="decimal" />
              </div>
              <div>
                <label className="block text-[0.6rem] text-zinc-500 mb-1">Peso Muerto ({unit})</label>
                <input type="number" value={wilksDeadlift} onChange={(e) => setWilksDeadlift(e.target.value)} placeholder="200" className="w-full text-center text-sm py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }} inputMode="decimal" />
              </div>
            </div>

            {wilksScore > 0 && (
              <div className="text-center py-4 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                <div className="text-[0.6rem] text-zinc-500 mb-1">Total: {wTotal} {unit}</div>
                <div className="text-[0.6rem] text-zinc-500 uppercase tracking-wider mb-1">Wilks Score</div>
                <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>{wilksScore}</div>
                <div className="text-[0.65rem] mt-2" style={{ color: "var(--text-muted)" }}>
                  {wilksScore < 200 ? "Principiante" : wilksScore < 300 ? "Intermedio" : wilksScore < 400 ? "Avanzado" : wilksScore < 500 ? "Elite" : "Clase Mundial"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
