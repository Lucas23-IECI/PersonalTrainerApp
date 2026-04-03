"use client";

import { useState, useEffect } from "react";
import {
  mealPlan,
  macroTargets,
  weeklyShoppingList,
  supplementPlan,
  cookingLessons,
  type Meal,
} from "@/data/nutrition";
import {
  today,
  getNutritionForDate,
  saveNutritionEntry,
  getShoppingChecked,
  setShoppingChecked,
  type NutritionEntry,
  type SelectedMeal,
  type CustomMeal,
} from "@/lib/storage";
import { Check, Plus, ShoppingCart, Pill, ChefHat, UtensilsCrossed, Trash2 } from "lucide-react";

type Tab = "tracker" | "plan" | "shopping" | "supps" | "cooking";

export default function NutritionPage() {
  const todayStr = today();
  const [tab, setTab] = useState<Tab>("tracker");
  const [entry, setEntry] = useState<NutritionEntry | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customPro, setCustomPro] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    setEntry(getNutritionForDate(todayStr));
    setCheckedItems(getShoppingChecked());
  }, [todayStr]);

  function toggleShoppingItem(item: string) {
    const updated = checkedItems.includes(item)
      ? checkedItems.filter((i) => i !== item)
      : [...checkedItems, item];
    setCheckedItems(updated);
    setShoppingChecked(updated);
  }

  function toggleMeal(slot: string, meal: Meal) {
    const current = entry || { date: todayStr, meals: [], customMeals: [] };
    const exists = current.meals.find((m) => m.slot === slot && m.name === meal.name);
    const newMeals: SelectedMeal[] = exists
      ? current.meals.filter((m) => !(m.slot === slot && m.name === meal.name))
      : [...current.meals, { slot, name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }];
    const updated: NutritionEntry = { ...current, meals: newMeals };
    saveNutritionEntry(updated);
    setEntry(updated);
  }

  function addCustomMeal() {
    if (!customName || !customCal) return;
    const current = entry || { date: todayStr, meals: [], customMeals: [] };
    const custom: CustomMeal = { name: customName, calories: parseInt(customCal, 10), protein: parseInt(customPro, 10) || 0, carbs: parseInt(customCarbs, 10) || 0, fat: parseInt(customFat, 10) || 0 };
    const updated: NutritionEntry = { ...current, customMeals: [...current.customMeals, custom] };
    saveNutritionEntry(updated);
    setEntry(updated);
    setCustomName(""); setCustomCal(""); setCustomPro(""); setCustomCarbs(""); setCustomFat(""); setShowCustom(false);
  }

  function removeCustom(idx: number) {
    if (!entry) return;
    const updated: NutritionEntry = { ...entry, customMeals: entry.customMeals.filter((_, i) => i !== idx) };
    saveNutritionEntry(updated);
    setEntry(updated);
  }

  const totalCal = (entry?.meals.reduce((s, m) => s + m.calories, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.calories, 0) || 0);
  const totalPro = (entry?.meals.reduce((s, m) => s + m.protein, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.protein, 0) || 0);
  const totalCarbs = (entry?.meals.reduce((s, m) => s + m.carbs, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.carbs, 0) || 0);
  const totalFat = (entry?.meals.reduce((s, m) => s + m.fat, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.fat, 0) || 0);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "tracker", label: "Hoy", icon: <UtensilsCrossed size={14} /> },
    { id: "plan", label: "Plan", icon: <ChefHat size={14} /> },
    { id: "shopping", label: "Compras", icon: <ShoppingCart size={14} /> },
    { id: "supps", label: "Supps", icon: <Pill size={14} /> },
    { id: "cooking", label: "Cocinar", icon: <ChefHat size={14} /> },
  ];

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      <h1 className="text-xl font-black tracking-tight mb-0.5">Nutrición</h1>
      <p className="text-[0.65rem] text-zinc-600 mb-3">
        {macroTargets.calories} kcal · {macroTargets.protein}g P · {macroTargets.carbs}g C · {macroTargets.fat}g F
      </p>

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

      {/* TRACKER */}
      {tab === "tracker" && (
        <div>
          <div className="card mb-3">
            <div className="text-[0.65rem] text-zinc-600 uppercase tracking-wider mb-2.5">Macros — {todayStr}</div>
            {[
              { label: "Calorías", value: totalCal, target: macroTargets.calories, unit: "kcal", color: "#2C6BED" },
              { label: "Proteína", value: totalPro, target: macroTargets.protein, unit: "g", color: "#34C759" },
              { label: "Carbos", value: totalCarbs, target: macroTargets.carbs, unit: "g", color: "#FFCC00" },
              { label: "Grasa", value: totalFat, target: macroTargets.fat, unit: "g", color: "#AF52DE" },
            ].map((m) => (
              <div key={m.label} className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <span className="text-[0.7rem] text-zinc-500">{m.label}</span>
                  <span className="text-[0.7rem] font-bold">{m.value} <span className="text-zinc-600">/ {m.target}{m.unit}</span></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>

          {mealPlan.map((slot) => {
            const selected = entry?.meals.filter((m) => m.slot === slot.slot) || [];
            return (
              <div key={slot.slot} className="card mb-2.5">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-[0.85rem] font-bold">{slot.slot}</div>
                    <div className="text-[0.6rem] text-zinc-600">{slot.time}</div>
                  </div>
                  {selected.length > 0 && <span className="text-[0.6rem] text-[#34C759] font-bold">{selected.reduce((s, m) => s + m.protein, 0)}g P</span>}
                </div>
                <div className="flex flex-col gap-1">
                  {slot.options.map((meal) => {
                    const sel = selected.some((m) => m.name === meal.name);
                    return (
                      <button
                        key={meal.name}
                        onClick={() => toggleMeal(slot.slot, meal)}
                        className={`flex justify-between items-center p-2.5 rounded-lg cursor-pointer text-left w-full border transition-colors ${
                          sel ? "bg-green-500/8 border-green-500/40" : "bg-[#F2F2F7] border-[#E5E5EA]"
                        }`}
                      >
                        <div className="flex-1">
                          <div className={`text-[0.78rem] ${sel ? "font-bold" : "font-medium"} text-zinc-800`}>
                            {sel && <Check size={12} className="inline mr-1 text-[#34C759] align-middle" />}{meal.name}
                          </div>
                          <div className="text-[0.6rem] text-zinc-600">{meal.calories}kcal · {meal.protein}P · {meal.carbs}C · {meal.fat}F</div>
                        </div>
                        {meal.tags.includes("rápido") && <span className="text-[0.55rem] text-yellow-400 ml-1.5">⚡</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {entry && entry.customMeals.length > 0 && (
            <div className="card mb-2.5">
              <div className="text-[0.75rem] font-bold mb-1.5">Comidas Extra</div>
              {entry.customMeals.map((cm, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#E5E5EA]">
                  <div>
                    <div className="text-[0.75rem]">{cm.name}</div>
                    <div className="text-[0.6rem] text-zinc-600">{cm.calories}kcal · {cm.protein}P · {cm.carbs}C · {cm.fat}F</div>
                  </div>
                  <button onClick={() => removeCustom(i)} className="bg-transparent border-none cursor-pointer text-zinc-600 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {!showCustom ? (
            <button onClick={() => setShowCustom(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#F2F2F7] border border-dashed border-[#E5E5EA] rounded-xl cursor-pointer text-zinc-500 text-sm">
              <Plus size={16} /> Agregar comida extra
            </button>
          ) : (
            <div className="card">
              <div className="text-[0.75rem] font-bold mb-2.5">Comida Extra</div>
              <input type="text" placeholder="Nombre" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full mb-2 text-sm" />
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[
                  { label: "kcal", val: customCal, set: setCustomCal },
                  { label: "Prot", val: customPro, set: setCustomPro },
                  { label: "Carbs", val: customCarbs, set: setCustomCarbs },
                  { label: "Fat", val: customFat, set: setCustomFat },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[0.55rem] text-zinc-600 mb-0.5">{f.label}</label>
                    <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)} className="w-full text-center text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setShowCustom(false)} className="btn btn-ghost flex-1">Cancelar</button>
                <button onClick={addCustomMeal} className="flex-[2] py-2 rounded-xl border-none cursor-pointer text-white font-bold text-[0.75rem]" style={{ background: "#34C759" }}>Agregar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PLAN */}
      {tab === "plan" && (
        <div>
          {mealPlan.map((slot) => (
            <div key={slot.slot} className="card mb-2.5">
              <div className="text-[0.85rem] font-bold mb-0.5">{slot.slot}</div>
              <div className="text-[0.6rem] text-zinc-600 mb-2.5">{slot.time}</div>
              {slot.options.map((meal) => (
                <div key={meal.name} className="py-2.5 border-t border-[#E5E5EA]">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold">{meal.name}</span>
                    <span className="text-[0.65rem] text-[#2C6BED] font-bold">{meal.calories} kcal</span>
                  </div>
                  <div className="text-[0.65rem] text-zinc-500 mb-1">{meal.protein}g P · {meal.carbs}g C · {meal.fat}g F · {meal.prepTime}</div>
                  <div className="text-[0.7rem] text-zinc-600 mb-1">{meal.ingredients.join(" · ")}</div>
                  <div className="text-[0.65rem] text-zinc-500 italic">{meal.prep}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* SHOPPING */}
      {tab === "shopping" && (
        <div className="card">
          <div className="text-[0.85rem] font-bold mb-2.5">Lista Semanal</div>
          {weeklyShoppingList.map((item, i) => {
            const checked = checkedItems.includes(item.item);
            return (
              <div
                key={i}
                onClick={() => toggleShoppingItem(item.item)}
                className={`flex justify-between items-center py-1.5 border-b border-[#E5E5EA] text-sm cursor-pointer transition-opacity ${checked ? "opacity-40" : ""}`}
              >
                <span className={`text-zinc-600 ${checked ? "line-through" : ""}`}>
                  {checked && <Check size={12} className="inline mr-1 text-[#34C759] align-middle" />}
                  {item.item}
                </span>
                <span className={`text-zinc-600 ${checked ? "line-through" : ""}`}>{item.quantity}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* SUPPS */}
      {tab === "supps" && (
        <div className="card">
          <div className="text-[0.85rem] font-bold mb-2.5">Suplementos</div>
          {supplementPlan.map((s, i) => (
            <div key={i} className={`py-2.5 ${i < supplementPlan.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">{s.name}</span>
                <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded" style={{
                  background: s.status === "actual" ? "#34C75922" : s.status === "AGREGAR" ? "#FFCC0022" : "#2C6BED22",
                  color: s.status === "actual" ? "#34C759" : s.status === "AGREGAR" ? "#FFCC00" : "#2C6BED",
                }}>{s.status}</span>
              </div>
              <div className="text-[0.7rem] text-zinc-500">{s.dose} · {s.when}</div>
              {s.notes && <div className="text-[0.65rem] text-zinc-600 mt-0.5">{s.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* COOKING */}
      {tab === "cooking" && (
        <div>
          {cookingLessons.map((lesson, i) => (
            <div key={i} className="card mb-2.5">
              <div className="text-[0.85rem] font-bold mb-0.5">{lesson.title}</div>
              <div className="text-[0.65rem] text-[#2C6BED] mb-2">{lesson.difficulty} · {lesson.time}</div>
              {lesson.steps.map((step, j) => (
                <div key={j} className="flex gap-2 py-1 text-[0.75rem] text-zinc-600">
                  <span className="text-zinc-500 font-bold min-w-[18px]">{j + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
