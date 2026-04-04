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
  getNutritionEntries,
  saveNutritionEntry,
  getShoppingChecked,
  setShoppingChecked,
  getMealTemplates,
  saveMealTemplate,
  deleteMealTemplate,
  generateId,
  type NutritionEntry,
  type SelectedMeal,
  type CustomMeal,
  type MealTemplate,
} from "@/lib/storage";
import {
  Check, Plus, ShoppingCart, Pill, ChefHat, UtensilsCrossed, Trash2,
  Search, Droplets, Save, FolderOpen, Camera, TrendingDown, TrendingUp, Minus, X,
} from "lucide-react";
import { SwipeTabs } from "@/components/motion";
import FoodSearchModal from "@/components/FoodSearchModal";
import BarcodeScanner from "@/components/BarcodeScanner";
import { calcMacros, type FoodItem } from "@/lib/openfoodfacts";

type Tab = "tracker" | "plan" | "shopping" | "supps" | "cooking";

const GLASS_ML = 250;
const WATER_TARGET_ML = macroTargets.water * 1000; // 3000ml

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

  // 7.7 / 7.8 states
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  // 7.9 states
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setEntry(getNutritionForDate(todayStr));
    setCheckedItems(getShoppingChecked());
    setTemplates(getMealTemplates());
  }, [todayStr]);

  function updateEntry(updated: NutritionEntry) {
    saveNutritionEntry(updated);
    setEntry(updated);
  }

  function toggleShoppingItem(item: string) {
    const updated = checkedItems.includes(item)
      ? checkedItems.filter((i) => i !== item)
      : [...checkedItems, item];
    setCheckedItems(updated);
    setShoppingChecked(updated);
  }

  function toggleMeal(slot: string, meal: Meal) {
    const current = entry || { date: todayStr, meals: [], customMeals: [], waterMl: 0 };
    const exists = current.meals.find((m) => m.slot === slot && m.name === meal.name);
    const newMeals: SelectedMeal[] = exists
      ? current.meals.filter((m) => !(m.slot === slot && m.name === meal.name))
      : [...current.meals, { slot, name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }];
    updateEntry({ ...current, meals: newMeals });
  }

  function addCustomMeal() {
    if (!customName || !customCal) return;
    const current = entry || { date: todayStr, meals: [], customMeals: [], waterMl: 0 };
    const custom: CustomMeal = { name: customName, calories: parseInt(customCal, 10), protein: parseInt(customPro, 10) || 0, carbs: parseInt(customCarbs, 10) || 0, fat: parseInt(customFat, 10) || 0 };
    updateEntry({ ...current, customMeals: [...current.customMeals, custom] });
    setCustomName(""); setCustomCal(""); setCustomPro(""); setCustomCarbs(""); setCustomFat(""); setShowCustom(false);
  }

  function removeCustom(idx: number) {
    if (!entry) return;
    updateEntry({ ...entry, customMeals: entry.customMeals.filter((_, i) => i !== idx) });
  }

  // 7.7 — Add food from search
  function handleFoodAdd(name: string, calories: number, protein: number, carbs: number, fat: number) {
    const current = entry || { date: todayStr, meals: [], customMeals: [], waterMl: 0 };
    const custom: CustomMeal = { name, calories, protein, carbs, fat };
    updateEntry({ ...current, customMeals: [...current.customMeals, custom] });
  }

  // 7.8 — Barcode scan found
  function handleBarcodeFound(food: FoodItem) {
    setShowBarcode(false);
    // Auto-add as 100g
    const macros = calcMacros(food, 100);
    const label = food.brand ? `${food.name} (${food.brand}) — 100g` : `${food.name} — 100g`;
    handleFoodAdd(label, macros.calories, macros.protein, macros.carbs, macros.fat);
  }

  // 7.10 — Water tracker
  function addWater(ml: number) {
    const current = entry || { date: todayStr, meals: [], customMeals: [], waterMl: 0 };
    const newWater = Math.max(0, (current.waterMl || 0) + ml);
    updateEntry({ ...current, waterMl: newWater });
  }

  // 7.9 — Save template
  function handleSaveTemplate() {
    if (!templateName.trim() || !entry) return;
    const tpl: MealTemplate = {
      id: generateId(),
      name: templateName.trim(),
      meals: entry.meals,
      customMeals: entry.customMeals,
      totalCalories: totalCal,
      totalProtein: totalPro,
      createdAt: todayStr,
    };
    saveMealTemplate(tpl);
    setTemplates(getMealTemplates());
    setTemplateName("");
    setShowSaveTemplate(false);
  }

  // 7.9 — Apply template
  function applyTemplate(tpl: MealTemplate) {
    const current = entry || { date: todayStr, meals: [], customMeals: [], waterMl: 0 };
    updateEntry({
      ...current,
      meals: tpl.meals,
      customMeals: tpl.customMeals,
    });
    setShowTemplates(false);
  }

  function handleDeleteTemplate(id: string) {
    deleteMealTemplate(id);
    setTemplates(getMealTemplates());
  }

  const totalCal = (entry?.meals.reduce((s, m) => s + m.calories, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.calories, 0) || 0);
  const totalPro = (entry?.meals.reduce((s, m) => s + m.protein, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.protein, 0) || 0);
  const totalCarbs = (entry?.meals.reduce((s, m) => s + m.carbs, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.carbs, 0) || 0);
  const totalFat = (entry?.meals.reduce((s, m) => s + m.fat, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.fat, 0) || 0);
  const waterMl = entry?.waterMl || 0;
  const remainingCal = macroTargets.calories - totalCal;

  // 7.11 — Weekly caloric data
  const weeklyData = getWeeklyCalories();

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

      <SwipeTabs tabs={["tracker", "plan", "shopping", "supps", "cooking"] as const} current={tab} onChange={(t) => setTab(t as Tab)}>
      {/* TRACKER */}
      {tab === "tracker" && (
        <div>
          {/* Macro Overview */}
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

          {/* 7.11 — Caloric Balance */}
          <div className="card mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[0.75rem] font-bold">Balance Calórico</div>
              <div className="flex items-center gap-1">
                {remainingCal > 0 ? (
                  <TrendingDown size={14} style={{ color: "#34C759" }} />
                ) : (
                  <TrendingUp size={14} style={{ color: "#FF3B30" }} />
                )}
                <span className="text-sm font-black" style={{ color: remainingCal >= 0 ? "#34C759" : "#FF3B30" }}>
                  {remainingCal >= 0 ? remainingCal : `+${Math.abs(remainingCal)}`} kcal
                </span>
              </div>
            </div>
            <p className="text-[0.6rem] mb-2.5" style={{ color: "var(--text-muted)" }}>
              {remainingCal > 0 ? `Te quedan ${remainingCal} kcal por consumir hoy` : `Superaste tu objetivo por ${Math.abs(remainingCal)} kcal`}
            </p>

            {/* Weekly mini chart */}
            <div className="text-[0.6rem] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Semana</div>
            <div className="flex items-end gap-1" style={{ height: "48px" }}>
              {weeklyData.map((d, i) => {
                const pct = macroTargets.calories > 0 ? Math.min(d.cal / macroTargets.calories, 1.3) : 0;
                const over = d.cal > macroTargets.calories;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${Math.max(pct * 36, 2)}px`,
                        background: d.isToday ? "var(--accent)" : over ? "#FF3B3066" : "#34C75966",
                      }}
                    />
                    <span className="text-[0.5rem]" style={{ color: d.isToday ? "var(--accent)" : "var(--text-muted)" }}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {(() => {
              const weekTotal = weeklyData.reduce((s, d) => s + d.cal, 0);
              const weekAvg = weeklyData.filter(d => d.cal > 0).length > 0
                ? Math.round(weekTotal / weeklyData.filter(d => d.cal > 0).length)
                : 0;
              return weekAvg > 0 ? (
                <div className="text-[0.6rem] mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Promedio: <strong>{weekAvg} kcal/día</strong> · Total: {weekTotal} kcal
                </div>
              ) : null;
            })()}
          </div>

          {/* 7.10 — Water Tracker */}
          <div className="card mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <Droplets size={16} style={{ color: "#007AFF" }} />
                <span className="text-[0.75rem] font-bold">Agua</span>
              </div>
              <span className="text-[0.7rem] font-bold" style={{ color: "#007AFF" }}>
                {(waterMl / 1000).toFixed(1)}L <span className="text-zinc-500 font-normal">/ {macroTargets.water}L</span>
              </span>
            </div>
            <div className="progress-bar mb-2">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min((waterMl / WATER_TARGET_ML) * 100, 100)}%`,
                  background: "#007AFF",
                }}
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => addWater(GLASS_ML)}
                className="flex-1 py-2 rounded-xl border-none cursor-pointer text-sm font-bold text-white"
                style={{ background: "#007AFF" }}
              >
                <Droplets size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} /> +1 Vaso
              </button>
              <button
                onClick={() => addWater(500)}
                className="py-2 px-3 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold"
                style={{ background: "var(--bg-elevated)", color: "#007AFF" }}
              >
                +500ml
              </button>
              <button
                onClick={() => addWater(-GLASS_ML)}
                className="py-2 px-3 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                <Minus size={12} className="inline" style={{ verticalAlign: "-1px" }} />
              </button>
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {Array.from({ length: Math.ceil(WATER_TARGET_ML / GLASS_ML) }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full transition-colors"
                  style={{
                    background: (i + 1) * GLASS_ML <= waterMl ? "#007AFF" : "var(--bg-elevated)",
                    border: "1px solid",
                    borderColor: (i + 1) * GLASS_ML <= waterMl ? "#007AFF" : "var(--border)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* 7.7/7.8 — Food Search + Barcode Buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowFoodSearch(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-none cursor-pointer text-sm font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              <Search size={14} /> Buscar Alimento
            </button>
            <button
              onClick={() => setShowBarcode(true)}
              className="py-2.5 px-4 rounded-xl border-none cursor-pointer text-sm font-bold"
              style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
            >
              <Camera size={14} className="inline mr-1" style={{ verticalAlign: "-2px" }} /> Código
            </button>
          </div>

          {/* Meal Slots */}
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

          {/* Custom meals list */}
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

          {/* Add custom meal manually */}
          {!showCustom ? (
            <button onClick={() => setShowCustom(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#F2F2F7] border border-dashed border-[#E5E5EA] rounded-xl cursor-pointer text-zinc-500 text-sm mb-3">
              <Plus size={16} /> Agregar comida manual
            </button>
          ) : (
            <div className="card mb-3">
              <div className="text-[0.75rem] font-bold mb-2.5">Comida Manual</div>
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

          {/* 7.9 — Meal Templates */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowSaveTemplate(true)}
              disabled={!entry || (entry.meals.length === 0 && entry.customMeals.length === 0)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer text-[0.7rem] font-bold border-none disabled:opacity-40"
              style={{ background: "var(--bg-elevated)", color: "var(--accent-green, #34C759)" }}
            >
              <Save size={13} /> Guardar Template
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              disabled={templates.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer text-[0.7rem] font-bold border-none disabled:opacity-40"
              style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
            >
              <FolderOpen size={13} /> Cargar Template
            </button>
          </div>
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
      </SwipeTabs>

      {/* MODALS */}

      {/* 7.7 — Food Search Modal */}
      <FoodSearchModal
        open={showFoodSearch}
        onClose={() => setShowFoodSearch(false)}
        onAdd={handleFoodAdd}
      />

      {/* 7.8 — Barcode Scanner Modal */}
      <BarcodeScanner
        open={showBarcode}
        onClose={() => setShowBarcode(false)}
        onFound={handleBarcodeFound}
      />

      {/* 7.9 — Save Template Dialog */}
      {showSaveTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowSaveTemplate(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-[90%] max-w-[400px] rounded-2xl p-5" style={{ background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Guardar como Template</div>
            <input
              type="text"
              placeholder="Nombre del template..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full mb-3 text-sm rounded-lg py-2.5 px-3 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
              autoFocus
            />
            <div className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
              {entry?.meals.length || 0} comidas + {entry?.customMeals.length || 0} extras · {totalCal} kcal · {totalPro}g P
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveTemplate(false)} className="btn btn-ghost flex-1 text-sm">Cancelar</button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex-[2] py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm disabled:opacity-40"
                style={{ background: "#34C759" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.9 — Load Template Dialog */}
      {showTemplates && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShowTemplates(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-[540px] max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Mis Templates</span>
              <button onClick={() => setShowTemplates(false)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {templates.length === 0 && (
                <p className="text-center py-8 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                  No tenés templates guardados
                </p>
              )}
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--bg-elevated)" }}>
                  <div className="flex-1">
                    <div className="text-[0.8rem] font-bold" style={{ color: "var(--text)" }}>{tpl.name}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {tpl.totalCalories} kcal · {tpl.totalProtein}g P · {tpl.meals.length + tpl.customMeals.length} items · {tpl.createdAt}
                    </div>
                  </div>
                  <button
                    onClick={() => applyTemplate(tpl)}
                    className="py-1.5 px-3 rounded-lg border-none cursor-pointer text-[0.7rem] font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="bg-transparent border-none cursor-pointer p-1"
                    style={{ color: "#FF3B30" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 7.11 — Helper: get this week's calorie data for the mini chart
function getWeeklyCalories(): { label: string; cal: number; isToday: boolean }[] {
  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  const result: { label: string; cal: number; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = getNutritionEntries().find((n) => n.date === dateStr);
    const cal = entry
      ? entry.meals.reduce((s, m) => s + m.calories, 0) + entry.customMeals.reduce((s, m) => s + m.calories, 0)
      : 0;
    result.push({
      label: dayLabels[i],
      cal,
      isToday: dateStr === now.toISOString().split("T")[0],
    });
  }
  return result;
}
