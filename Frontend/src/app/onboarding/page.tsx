"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/storage";
import { profileDefaults } from "@/data/profile";
import { Dumbbell, ChevronRight, ChevronLeft, User, Ruler, Target, Calendar, Award, Check } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Principiante", desc: "Menos de 6 meses entrenando" },
  { value: "intermediate", label: "Intermedio", desc: "6 meses a 2 años" },
  { value: "advanced", label: "Avanzado", desc: "Más de 2 años de experiencia" },
];

const GOAL_OPTIONS = [
  { value: "cut", label: "Perder Grasa", desc: "Déficit calórico + fuerza", emoji: "🔥" },
  { value: "recomp", label: "Recomposición", desc: "Ganar músculo y perder grasa", emoji: "⚡" },
  { value: "bulk", label: "Ganar Músculo", desc: "Superávit calórico + hipertrofia", emoji: "💪" },
];

const EQUIPMENT_OPTIONS = [
  { value: "full-gym", label: "Gym Completo", desc: "Barras, máquinas, poleas" },
  { value: "home-gym", label: "Home Gym", desc: "Mancuernas, banco, barra" },
  { value: "minimal", label: "Mínimo", desc: "Peso corporal + bandas" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [experience, setExperience] = useState("intermediate");
  const [goal, setGoal] = useState("recomp");
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [equipment, setEquipment] = useState("full-gym");
  const [error, setError] = useState("");

  function next() {
    setError("");
    if (step === 1 && name.trim().length < 2) { setError("Ingresá tu nombre"); return; }
    if (step === 1) {
      const n = name.trim();
      const isLucas = n.toLowerCase().includes("lucas") && (n.toLowerCase().includes("méndez") || n.toLowerCase().includes("mendez"));
      if (isLucas) {
        saveProfile(profileDefaults);
        localStorage.setItem("mark-pt-onboarding-done", "true");
        router.push("/");
        return;
      }
    }
    if (step === 2 && (!age || !height || !weight)) { setError("Completá todos los campos"); return; }
    if (step < 7) setStep((step + 1) as Step);
  }

  function prev() {
    if (step > 1) setStep((step - 1) as Step);
  }

  function finish() {
    const n = name.trim();
    const isLucas = n.toLowerCase().includes("lucas") && (n.toLowerCase().includes("méndez") || n.toLowerCase().includes("mendez"));

    if (isLucas) {
      saveProfile(profileDefaults);
    } else {
      const ageNum = parseInt(age) || 22;
      const heightNum = parseInt(height) || 175;
      const weightNum = parseFloat(weight) || 75;
      const isMale = gender === "male";
      const bmr = Math.round(10 * weightNum + 6.25 * heightNum - 5 * ageNum + (isMale ? 5 : -161));
      const activityMultiplier = daysPerWeek >= 5 ? 1.55 : daysPerWeek >= 3 ? 1.375 : 1.2;
      const tdee = Math.round(bmr * activityMultiplier);
      const targetCalories = goal === "cut" ? tdee - 500 : goal === "bulk" ? tdee + 300 : tdee;
      const goalWeight = goal === "cut" ? Math.round((weightNum * 0.9) * 10) / 10 : goal === "bulk" ? Math.round((weightNum * 1.05) * 10) / 10 : weightNum;

      saveProfile({
        ...profileDefaults,
        name: n,
        age: ageNum,
        height: heightNum,
        weight: weightNum,
        goalWeight,
        bmr,
        tdee,
        targetCalories,
      });
    }

    localStorage.setItem("mark-pt-experience", experience);
    localStorage.setItem("mark-pt-goal", goal);
    localStorage.setItem("mark-pt-days-per-week", String(daysPerWeek));
    localStorage.setItem("mark-pt-equipment", equipment);
    localStorage.setItem("mark-pt-gender", gender);
    localStorage.setItem("mark-pt-onboarding-done", "true");
    router.push("/");
  }

  const progress = (step / 7) * 100;

  return (
    <main className="max-w-[420px] mx-auto px-5 min-h-screen flex flex-col">
      {/* PROGRESS BAR */}
      <div className="pt-6 mb-2">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #30D158, var(--accent))" }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>Paso {step} de 7</span>
          {step > 1 && (
            <button onClick={prev} className="text-[0.6rem] flex items-center gap-0.5 bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--accent)" }}>
              <ChevronLeft size={12} /> Atrás
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* STEP 1: NAME */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--accent)", color: "#fff" }}>
              <Dumbbell size={32} />
            </div>
            <h1 className="text-2xl font-black mb-1 text-center">MARK PT</h1>
            <p className="text-sm mb-8 text-center" style={{ color: "var(--text-muted)" }}>Tu entrenador personal</p>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="Tu nombre completo"
              className="w-full text-center text-lg py-3.5 px-4 rounded-xl"
              style={{ background: "var(--bg-card)" }}
              autoFocus
            />
          </div>
        )}

        {/* STEP 2: BODY DATA */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--accent)", color: "#fff" }}>
              <Ruler size={24} />
            </div>
            <h2 className="text-xl font-black mb-1 text-center">Datos Físicos</h2>
            <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>Para calcular tu TDEE y calorías</p>

            <div className="flex gap-2 mb-4">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors"
                  style={{
                    background: gender === g ? "var(--accent)" : "var(--bg-card)",
                    color: gender === g ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {g === "male" ? "♂️ Masculino" : "♀️ Femenino"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[0.65rem] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Edad</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="22" className="w-full py-3 px-4 rounded-xl text-center" style={{ background: "var(--bg-card)" }} />
              </div>
              <div>
                <label className="text-[0.65rem] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Altura (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="177" className="w-full py-3 px-4 rounded-xl text-center" style={{ background: "var(--bg-card)" }} />
              </div>
              <div>
                <label className="text-[0.65rem] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Peso actual (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="80" className="w-full py-3 px-4 rounded-xl text-center" style={{ background: "var(--bg-card)" }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: EXPERIENCE */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FF9500", color: "#fff" }}>
              <Award size={24} />
            </div>
            <h2 className="text-xl font-black mb-1 text-center">Tu Experiencia</h2>
            <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>Esto nos ayuda a personalizar tus rutinas</p>

            <div className="space-y-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  className="w-full p-4 rounded-xl text-left border-2 cursor-pointer transition-all"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: experience === opt.value ? "var(--accent)" : "transparent",
                  }}
                >
                  <span className="font-bold text-sm block">{opt.label}</span>
                  <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: GOAL */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#30D158", color: "#fff" }}>
              <Target size={24} />
            </div>
            <h2 className="text-xl font-black mb-1 text-center">Tu Objetivo</h2>
            <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>¿Qué querés lograr?</p>

            <div className="space-y-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className="w-full p-4 rounded-xl text-left border-2 cursor-pointer transition-all"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: goal === opt.value ? "var(--accent)" : "transparent",
                  }}
                >
                  <span className="font-bold text-sm block">{opt.emoji} {opt.label}</span>
                  <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: DAYS PER WEEK */}
        {step === 5 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--accent)", color: "#fff" }}>
              <Calendar size={24} />
            </div>
            <h2 className="text-xl font-black mb-1 text-center">Días por Semana</h2>
            <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>¿Cuántos días podés entrenar?</p>

            <div className="flex gap-2 justify-center mb-4">
              {[3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysPerWeek(d)}
                  className="w-14 h-14 rounded-xl text-lg font-black border-2 cursor-pointer transition-all"
                  style={{
                    background: daysPerWeek === d ? "var(--accent)" : "var(--bg-card)",
                    color: daysPerWeek === d ? "#fff" : "var(--text-muted)",
                    borderColor: daysPerWeek === d ? "var(--accent)" : "transparent",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {daysPerWeek === 3 && "Full Body recomendado"}
              {daysPerWeek === 4 && "Upper/Lower Split ideal"}
              {daysPerWeek === 5 && "Push/Pull/Legs perfecto"}
              {daysPerWeek === 6 && "PPL × 2 — alta frecuencia"}
            </p>
          </div>
        )}

        {/* STEP 6: EQUIPMENT */}
        {step === 6 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#AF52DE", color: "#fff" }}>
              <Dumbbell size={24} />
            </div>
            <h2 className="text-xl font-black mb-1 text-center">Equipamiento</h2>
            <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>¿Con qué contás para entrenar?</p>

            <div className="space-y-2">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEquipment(opt.value)}
                  className="w-full p-4 rounded-xl text-left border-2 cursor-pointer transition-all"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: equipment === opt.value ? "var(--accent)" : "transparent",
                  }}
                >
                  <span className="font-bold text-sm block">{opt.label}</span>
                  <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: SUMMARY */}
        {step === 7 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #30D158, var(--accent))", color: "#fff" }}>
              <Check size={24} />
            </div>
            <h2 className="text-xl font-black mb-1 text-center">¡Todo Listo!</h2>
            <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>Confirmá tus datos para empezar</p>

            <div className="card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[0.65rem] uppercase" style={{ color: "var(--text-muted)" }}>Nombre</span>
                <span className="text-sm font-bold">{name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[0.65rem] uppercase" style={{ color: "var(--text-muted)" }}>Datos</span>
                <span className="text-sm font-bold">{gender === "male" ? "♂️" : "♀️"} {age} años · {height}cm · {weight}kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[0.65rem] uppercase" style={{ color: "var(--text-muted)" }}>Experiencia</span>
                <span className="text-sm font-bold">{EXPERIENCE_OPTIONS.find((e) => e.value === experience)?.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[0.65rem] uppercase" style={{ color: "var(--text-muted)" }}>Objetivo</span>
                <span className="text-sm font-bold">{GOAL_OPTIONS.find((g) => g.value === goal)?.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[0.65rem] uppercase" style={{ color: "var(--text-muted)" }}>Frecuencia</span>
                <span className="text-sm font-bold">{daysPerWeek} días/semana</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[0.65rem] uppercase" style={{ color: "var(--text-muted)" }}>Equipamiento</span>
                <span className="text-sm font-bold">{EQUIPMENT_OPTIONS.find((e) => e.value === equipment)?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && <p className="text-xs text-red-500 text-center mt-3">{error}</p>}
      </div>

      {/* BOTTOM BUTTON */}
      <div className="pb-8 pt-4">
        {step < 7 ? (
          <button
            onClick={next}
            className="btn w-full py-3.5 text-base font-bold text-white border-none cursor-pointer rounded-xl flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent))" }}
          >
            Siguiente <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={finish}
            className="btn w-full py-3.5 text-base font-bold text-white border-none cursor-pointer rounded-xl flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #34C759, #30D158)" }}
          >
            Empezar 🚀
          </button>
        )}
      </div>
    </main>
  );
}
