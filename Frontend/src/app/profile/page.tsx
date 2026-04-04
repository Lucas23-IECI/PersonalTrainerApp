"use client";

import { useState, useEffect, useCallback } from "react";
import { getProfileData, profileDefaults, profileMeasurements, historicLifts, daysUntil } from "@/data/profile";
import {
  saveProfile,
  getBodyMeasurements,
  saveBodyMeasurement,
  getWeightHistory,
  getLatestMeasurement,
  today,
  type UserProfile,
  type BodyMeasurement,
} from "@/lib/storage";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Plus,
  Ruler,
  TrendingDown,
  Target,
  Calendar,
  Weight,
  X,
  Camera,
  Trophy,
  CalendarDays,
} from "lucide-react";

const CIRCUM_FIELDS: { key: keyof BodyMeasurement; label: string }[] = [
  { key: "chest", label: "Pecho" },
  { key: "waist", label: "Cintura" },
  { key: "hip", label: "Cadera" },
  { key: "armR", label: "Brazo D" },
  { key: "armL", label: "Brazo I" },
  { key: "thighR", label: "Muslo D" },
  { key: "thighL", label: "Muslo I" },
  { key: "calfR", label: "Pant. D" },
  { key: "calfL", label: "Pant. I" },
  { key: "neck", label: "Cuello" },
];

type Tab = "info" | "medidas" | "graficos";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("info");
  const [prof, setProf] = useState<UserProfile>(profileDefaults);
  const [saved, setSaved] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightHistory, setWeightHistory] = useState<{ date: string; weight: number }[]>([]);
  const [showMeasForm, setShowMeasForm] = useState(false);
  const [measForm, setMeasForm] = useState<BodyMeasurement>({ date: today() });

  const reload = useCallback(() => {
    setProf(getProfileData());
    setMeasurements(getBodyMeasurements());
    setWeightHistory(getWeightHistory());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  function handleSaveProfile() {
    saveProfile(prof);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSaveMeasurement() {
    saveBodyMeasurement(measForm);
    setShowMeasForm(false);
    setMeasForm({ date: today() });
    reload();
  }

  function prefillMeasForm() {
    const latest = getLatestMeasurement();
    const base = latest || {
      ...profileMeasurements,
      date: today(),
      weight: prof.weight,
      bodyFat: prof.bodyFatEstimate,
    };
    setMeasForm({ ...base, date: today() });
  }

  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const initial = measurements.length > 0 ? measurements[0] : null;
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : prof.weight;
  const weightLost = prof.weight - currentWeight;
  const goalProgress = prof.weight !== prof.goalWeight
    ? Math.min(100, Math.max(0, Math.round((weightLost / (prof.weight - prof.goalWeight)) * 100)))
    : 100;

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="text-zinc-400 hover:text-zinc-600">
          <ChevronLeft size={22} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2C6BED] to-[#1a4fd4] flex items-center justify-center text-white text-xl font-black">
            {prof.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">{prof.name.split(" ")[0]}</h1>
            <p className="text-[0.65rem] text-zinc-500">{prof.height}cm · {currentWeight}kg · {prof.age} años</p>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="card py-3 text-center">
          <Weight size={16} className="mx-auto text-[#2C6BED] mb-1" />
          <div className="text-lg font-black">{currentWeight}</div>
          <div className="text-[0.55rem] text-zinc-500 uppercase">kg actual</div>
        </div>
        <div className="card py-3 text-center">
          <Target size={16} className="mx-auto text-[#34C759] mb-1" />
          <div className="text-lg font-black">{prof.goalWeight}</div>
          <div className="text-[0.55rem] text-zinc-500 uppercase">kg meta</div>
        </div>
        <div className="card py-3 text-center">
          <TrendingDown size={16} className="mx-auto text-[#FF9500] mb-1" />
          <div className="text-lg font-black">{weightLost > 0 ? `-${weightLost.toFixed(1)}` : weightLost.toFixed(1)}</div>
          <div className="text-[0.55rem] text-zinc-500 uppercase">kg cambio</div>
        </div>
      </div>

      {/* GOAL PROGRESS BAR */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Progreso a Meta</span>
          <span className="text-sm font-bold text-[#2C6BED]">{goalProgress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${goalProgress}%`, background: goalProgress >= 80 ? "#34C759" : "#2C6BED" }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[0.58rem] text-zinc-500">{prof.weight}kg inicio</span>
          <span className="text-[0.58rem] text-zinc-500">{prof.goalWeight}kg meta</span>
        </div>
      </div>

      {/* PHOTOS LINK */}
      <Link href="/photos" className="card mb-4 flex items-center gap-3 px-4 py-3 group hover:scale-[1.01] active:scale-[0.99] transition-transform">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#AF52DE] to-[#7C3AED] flex items-center justify-center">
          <Camera size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-sm">Fotos de Progreso</span>
          <p className="text-[0.6rem] text-zinc-500">Comparar tu transformación visual</p>
        </div>
        <ChevronLeft size={16} className="text-zinc-400 rotate-180" />
      </Link>

      {/* ACHIEVEMENTS LINK */}
      <Link href="/achievements" className="card mb-4 flex items-center gap-3 px-4 py-3 group hover:scale-[1.01] active:scale-[0.99] transition-transform">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FF9500] flex items-center justify-center">
          <Trophy size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-sm">Logros y Badges</span>
          <p className="text-[0.6rem] text-zinc-500">Tu colección de medallas</p>
        </div>
        <ChevronLeft size={16} className="text-zinc-400 rotate-180" />
      </Link>

      {/* YEAR REVIEW LINK */}
      <Link href="/year-review" className="card mb-4 flex items-center gap-3 px-4 py-3 group hover:scale-[1.01] active:scale-[0.99] transition-transform">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#30D158] to-[#0A84FF] flex items-center justify-center">
          <CalendarDays size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-sm">Resumen del Año</span>
          <p className="text-[0.6rem] text-zinc-500">Tu año en entrenamiento estilo Wrapped</p>
        </div>
        <ChevronLeft size={16} className="text-zinc-400 rotate-180" />
      </Link>

      {/* TABS */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
        {([
          { id: "info" as Tab, label: "Perfil" },
          { id: "medidas" as Tab, label: "Medidas" },
          { id: "graficos" as Tab, label: "Gráficos" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-[0.72rem] font-semibold transition-all"
            style={{
              background: tab === t.id ? "var(--bg-card)" : "transparent",
              color: tab === t.id ? "#2C6BED" : "var(--text-muted)",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              border: "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: PROFILE INFO */}
      {tab === "info" && (
        <div className="space-y-3">
          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Datos Personales</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" value={prof.name} onChange={(v) => setProf({ ...prof, name: v })} />
              <Field label="Edad" value={String(prof.age)} onChange={(v) => setProf({ ...prof, age: Number(v) || 0 })} type="number" />
              <Field label="Altura (cm)" value={String(prof.height)} onChange={(v) => setProf({ ...prof, height: Number(v) || 0 })} type="number" />
              <Field label="Peso (kg)" value={String(prof.weight)} onChange={(v) => setProf({ ...prof, weight: Number(v) || 0 })} type="number" />
            </div>
          </div>

          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Objetivos</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso Meta (kg)" value={String(prof.goalWeight)} onChange={(v) => setProf({ ...prof, goalWeight: Number(v) || 0 })} type="number" />
              <Field label="Grasa Meta (%)" value={String(prof.goalBodyFat)} onChange={(v) => setProf({ ...prof, goalBodyFat: Number(v) || 0 })} type="number" />
              <Field label="Grasa Actual (%)" value={String(prof.bodyFatEstimate)} onChange={(v) => setProf({ ...prof, bodyFatEstimate: Number(v) || 0 })} type="number" />
              <Field label="Calorías Diarias" value={String(prof.targetCalories)} onChange={(v) => setProf({ ...prof, targetCalories: Number(v) || 0 })} type="number" />
            </div>
          </div>

          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Metabolismo</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="BMR" value={String(prof.bmr)} onChange={(v) => setProf({ ...prof, bmr: Number(v) || 0 })} type="number" />
              <Field label="TDEE" value={String(prof.tdee)} onChange={(v) => setProf({ ...prof, tdee: Number(v) || 0 })} type="number" />
            </div>
          </div>

          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Fechas Importantes</div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[0.72rem] font-medium">Pesas Fuertes</div>
                  <div className="text-[0.62rem] text-zinc-500">{prof.heavyWeightsDate}</div>
                </div>
                <span className="text-sm font-bold" style={{ color: daysUntil(prof.heavyWeightsDate) <= 0 ? "#34C759" : "#2C6BED" }}>
                  {daysUntil(prof.heavyWeightsDate) <= 0 ? "✓" : `${daysUntil(prof.heavyWeightsDate)}d`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[0.72rem] font-medium">Brasil</div>
                  <div className="text-[0.62rem] text-zinc-500">{prof.brazilDate}</div>
                </div>
                <span className="text-sm font-bold text-[#2C6BED]">{daysUntil(prof.brazilDate)}d</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-2">Fuerza Histórica</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Squat", value: historicLifts.squat },
                { label: "Bench", value: historicLifts.bench },
                { label: "Deadlift", value: historicLifts.deadlift },
              ].map((l) => (
                <div key={l.label} className="text-center py-2">
                  <div className="text-xl font-black">{l.value}</div>
                  <div className="text-[0.6rem] text-zinc-600">{l.label} kg</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSaveProfile} className="btn btn-primary w-full flex items-center justify-center gap-2">
            <Save size={16} />
            {saved ? "✓ Guardado" : "Guardar Cambios"}
          </button>
        </div>
      )}

      {/* TAB: MEASUREMENTS */}
      {tab === "medidas" && (
        <div className="space-y-3">
          {/* Latest measurement summary */}
          {latest && (
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Última Medición</div>
                <div className="flex items-center gap-1 text-[0.62rem] text-zinc-500">
                  <Calendar size={12} />
                  {latest.date}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {CIRCUM_FIELDS.map(({ key, label }) => {
                  const val = latest[key] as number | undefined;
                  const initVal = initial ? (initial[key] as number | undefined) : undefined;
                  const diff = val && initVal ? val - initVal : 0;
                  return val ? (
                    <div key={key} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <span className="text-[0.72rem] text-zinc-600">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.82rem] font-bold">{val}cm</span>
                        {diff !== 0 && (
                          <span className="text-[0.6rem] font-medium" style={{ color: diff < 0 ? "#34C759" : "#FF3B30" }}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Add measurement button */}
          {!showMeasForm && (
            <button
              onClick={() => { prefillMeasForm(); setShowMeasForm(true); }}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Nueva Medición
            </button>
          )}

          {/* Measurement form */}
          {showMeasForm && (
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Ruler size={16} className="text-[#2C6BED]" />
                  <span className="text-sm font-bold">Nueva Medición</span>
                </div>
                <button onClick={() => setShowMeasForm(false)} className="text-zinc-400" style={{ cursor: "pointer", background: "none", border: "none" }}>
                  <X size={18} />
                </button>
              </div>
              <div className="mb-3">
                <label className="block text-[0.62rem] text-zinc-500 uppercase mb-1">Fecha</label>
                <input type="date" value={measForm.date} onChange={(e) => setMeasForm({ ...measForm, date: e.target.value })} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[0.62rem] text-zinc-500 uppercase mb-1">Peso (kg)</label>
                  <input type="number" step={0.1} value={measForm.weight ?? ""} onChange={(e) => setMeasForm({ ...measForm, weight: e.target.value ? Number(e.target.value) : undefined })} className="w-full" />
                </div>
                <div>
                  <label className="block text-[0.62rem] text-zinc-500 uppercase mb-1">Grasa (%)</label>
                  <input type="number" step={0.1} value={measForm.bodyFat ?? ""} onChange={(e) => setMeasForm({ ...measForm, bodyFat: e.target.value ? Number(e.target.value) : undefined })} className="w-full" />
                </div>
              </div>
              <div className="text-[0.62rem] text-zinc-500 uppercase mb-2">Circunferencias (cm)</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {CIRCUM_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[0.58rem] text-zinc-500 mb-0.5">{label}</label>
                    <input
                      type="number"
                      step={0.5}
                      value={(measForm[key] as number) ?? ""}
                      onChange={(e) => setMeasForm({ ...measForm, [key]: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveMeasurement} className="btn btn-primary w-full">Guardar Medición</button>
            </div>
          )}

          {/* Measurement history list */}
          {measurements.length > 0 && (
            <div className="card">
              <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Historial ({measurements.length})</div>
              <div className="space-y-2">
                {[...measurements].reverse().map((m) => (
                  <div key={m.date} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div className="text-[0.75rem] font-medium">{m.date}</div>
                      <div className="text-[0.6rem] text-zinc-500">
                        {m.weight && `${m.weight}kg`}
                        {m.bodyFat && ` · ${m.bodyFat}%`}
                        {m.waist && ` · cintura ${m.waist}cm`}
                      </div>
                    </div>
                    {m.weight && (
                      <span className="text-sm font-bold">{m.weight}kg</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {measurements.length === 0 && !showMeasForm && (
            <div className="card text-center py-6">
              <Ruler size={28} className="mx-auto text-zinc-300 mb-2" />
              <p className="text-[0.78rem] text-zinc-500">Aún no hay mediciones</p>
              <p className="text-[0.65rem] text-zinc-400">Registrá tu primera medición para ver tu progreso</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: CHARTS */}
      {tab === "graficos" && (
        <div className="space-y-3">
          {/* Weight chart */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Peso en el Tiempo</div>
            {weightHistory.length >= 2 ? (
              <MiniChart
                data={weightHistory.map((w) => w.weight)}
                labels={weightHistory.map((w) => w.date.slice(5))}
                color="#2C6BED"
                goalLine={prof.goalWeight}
              />
            ) : (
              <EmptyChart text="Necesitás al menos 2 registros de peso" />
            )}
          </div>

          {/* Waist chart */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Cintura</div>
            {(() => {
              const waistData = measurements.filter((m) => m.waist).map((m) => ({ val: m.waist!, label: m.date.slice(5) }));
              return waistData.length >= 2 ? (
                <MiniChart data={waistData.map((d) => d.val)} labels={waistData.map((d) => d.label)} color="#FF9500" />
              ) : (
                <EmptyChart text="Necesitás al menos 2 mediciones de cintura" />
              );
            })()}
          </div>

          {/* Body Fat chart */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">% Grasa Corporal</div>
            {(() => {
              const bfData = measurements.filter((m) => m.bodyFat).map((m) => ({ val: m.bodyFat!, label: m.date.slice(5) }));
              return bfData.length >= 2 ? (
                <MiniChart data={bfData.map((d) => d.val)} labels={bfData.map((d) => d.label)} color="#FF3B30" goalLine={prof.goalBodyFat} />
              ) : (
                <EmptyChart text="Necesitás al menos 2 mediciones de grasa corporal" />
              );
            })()}
          </div>

          {/* Arms chart */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Brazos</div>
            {(() => {
              const armData = measurements.filter((m) => m.armR).map((m) => ({ val: m.armR!, label: m.date.slice(5) }));
              return armData.length >= 2 ? (
                <MiniChart data={armData.map((d) => d.val)} labels={armData.map((d) => d.label)} color="#34C759" />
              ) : (
                <EmptyChart text="Necesitás al menos 2 mediciones de brazos" />
              );
            })()}
          </div>

          {/* 4.8 — Chest chart */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Pecho</div>
            {(() => {
              const chestData = measurements.filter((m) => m.chest).map((m) => ({ val: m.chest!, label: m.date.slice(5) }));
              return chestData.length >= 2 ? (
                <MiniChart data={chestData.map((d) => d.val)} labels={chestData.map((d) => d.label)} color="#AF52DE" />
              ) : (
                <EmptyChart text="Necesitás al menos 2 mediciones de pecho" />
              );
            })()}
          </div>

          {/* 4.8 — Thigh chart */}
          <div className="card">
            <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Muslos</div>
            {(() => {
              const thighData = measurements.filter((m) => m.thighR).map((m) => ({ val: m.thighR!, label: m.date.slice(5) }));
              return thighData.length >= 2 ? (
                <MiniChart data={thighData.map((d) => d.val)} labels={thighData.map((d) => d.label)} color="#FF9500" />
              ) : (
                <EmptyChart text="Necesitás al menos 2 mediciones de muslos" />
              );
            })()}
          </div>

          {/* 4.8 — First vs Latest comparison */}
          {initial && latest && measurements.length >= 2 && (
            <div className="card">
              <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-3">Progreso Total</div>
              <div className="flex justify-between text-[0.55rem] text-zinc-500 mb-2">
                <span>{initial.date}</span>
                <span>{latest.date}</span>
              </div>
              <div className="space-y-2">
                {CIRCUM_FIELDS.map(({ key, label }) => {
                  const first = initial[key] as number | undefined;
                  const last = latest[key] as number | undefined;
                  if (!first || !last) return null;
                  const diff = last - first;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[0.65rem] text-zinc-500 w-16 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.min(100, Math.max(10, (last / Math.max(first, last)) * 100))}%`,
                          background: diff <= 0 ? "#34C759" : "#FF9500",
                        }} />
                      </div>
                      <span className="text-[0.6rem] font-bold shrink-0" style={{ color: diff <= 0 ? "#34C759" : "#FF9500" }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}cm
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// === Reusable components ===

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[0.58rem] text-zinc-500 uppercase mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} step={type === "number" ? "any" : undefined} className="w-full" />
    </div>
  );
}

function MiniChart({
  data,
  labels,
  color,
  goalLine,
}: {
  data: number[];
  labels: string[];
  color: string;
  goalLine?: number;
}) {
  const min = Math.min(...data, goalLine ?? Infinity);
  const max = Math.max(...data, goalLine ?? -Infinity);
  const range = max - min || 1;
  const h = 120;
  const w = 100; // percentage
  const padY = 10;

  const points = data.map((v, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * w;
    const y = padY + ((max - v) / range) * (h - padY * 2);
    return `${x},${y}`;
  });

  const goalY = goalLine !== undefined ? padY + ((max - goalLine) / range) * (h - padY * 2) : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 100 ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
        {/* Goal line */}
        {goalY !== null && (
          <line x1="0" y1={goalY} x2="100" y2={goalY} stroke="#34C759" strokeWidth="0.4" strokeDasharray="2,2" />
        )}
        {/* Line */}
        <polyline fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} />
        {/* Dots */}
        {points.map((p, i) => {
          const [cx, cy] = p.split(",");
          return <circle key={i} cx={cx} cy={cy} r="1.5" fill={color} />;
        })}
      </svg>
      {/* Labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[0.55rem] text-zinc-500">{labels[0]}</span>
        <span className="text-[0.55rem] text-zinc-500">{labels[labels.length - 1]}</span>
      </div>
      {/* Value labels */}
      <div className="flex justify-between">
        <span className="text-[0.6rem] font-bold" style={{ color }}>{data[0]}</span>
        <span className="text-[0.6rem] font-bold" style={{ color }}>{data[data.length - 1]}</span>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-[0.72rem] text-zinc-400 text-center">{text}</p>
    </div>
  );
}
