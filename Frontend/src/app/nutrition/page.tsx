"use client";

import { useState, useEffect } from "react";
import {
  mealPlan,
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
  getNutritionTargets,
  saveNutritionTargets,
  getFoodFavorites,
  addFoodFavorite,
  removeFoodFavorite,
  getRecentFoods,
  addRecentFood,
  type NutritionEntry,
  type SelectedMeal,
  type CustomMeal,
  type MealTemplate,
  type NutritionTargets,
  type FoodFavorite,
} from "@/lib/storage";
import {
  Check, Plus, ShoppingCart, Pill, ChefHat, UtensilsCrossed, Trash2,
  Search, Droplets, Save, FolderOpen, Camera, TrendingDown, TrendingUp,
  Minus, X, ChevronLeft, ChevronRight, Clock, Heart, Settings,
} from "lucide-react";
import { SwipeTabs } from "@/components/motion";
import FoodSearchModal from "@/components/FoodSearchModal";
import BarcodeScanner from "@/components/BarcodeScanner";
import { calcMacros, type FoodItem } from "@/lib/openfoodfacts";

type Tab = "tracker" | "plan" | "shopping" | "supps" | "cooking";

const GLASS_ML = 250;
const MEAL_SLOTS = ["Desayuno", "Almuerzo", "Cena", "Snacks"];

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [tab, setTab] = useState<Tab>("tracker");
  const [entry, setEntry] = useState<NutritionEntry | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [targets, setTargets] = useState<NutritionTargets>({ calories: 2300, protein: 170, carbs: 230, fat: 77, water: 3.0 });

  // Add food to slot state
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customPro, setCustomPro] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  // Modals
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [showRecents, setShowRecents] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showTargetEditor, setShowTargetEditor] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  // Favorites & recents
  const [favorites, setFavorites] = useState<FoodFavorite[]>([]);
  const [recents, setRecents] = useState<CustomMeal[]>([]);

  useEffect(() => {
    setEntry(getNutritionForDate(selectedDate));
    setCheckedItems(getShoppingChecked());
    setTemplates(getMealTemplates());
    setTargets(getNutritionTargets());
    setFavorites(getFoodFavorites());
    setRecents(getRecentFoods());
  }, [selectedDate]);

  const WATER_TARGET_ML = targets.water * 1000;

  function updateEntry(updated: NutritionEntry) {
    saveNutritionEntry(updated);
    setEntry(updated);
  }

  // Date navigation
  function changeDate(offset: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function isToday(date: string) {
    return date === today();
  }

  // Get foods for a specific slot
  function getFoodsForSlot(slot: string): { type: "plan" | "custom"; index: number; name: string; calories: number; protein: number; carbs: number; fat: number }[] {
    if (!entry) return [];
    const planFoods = entry.meals
      .filter((m) => m.slot === slot)
      .map((m, i) => ({ type: "plan" as const, index: i, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat }));
    const customFoods = entry.customMeals
      .map((m, i) => ({ ...m, originalIndex: i }))
      .filter((m) => m.slot === slot)
      .map((m) => ({ type: "custom" as const, index: m.originalIndex, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat }));
    return [...planFoods, ...customFoods];
  }

  // Get custom meals with no slot (legacy)
  function getUnslottedCustomMeals() {
    if (!entry) return [];
    return entry.customMeals
      .map((m, i) => ({ ...m, originalIndex: i }))
      .filter((m) => !m.slot);
  }

  // Toggle a plan meal in a slot
  function toggleMeal(slot: string, meal: Meal) {
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    const exists = current.meals.find((m) => m.slot === slot && m.name === meal.name);
    const newMeals: SelectedMeal[] = exists
      ? current.meals.filter((m) => !(m.slot === slot && m.name === meal.name))
      : [...current.meals, { slot, name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }];
    updateEntry({ ...current, meals: newMeals });
  }

  // Add custom food to a specific slot
  function addFoodToSlot(slot: string, name: string, calories: number, protein: number, carbs: number, fat: number) {
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    const custom: CustomMeal = { name, calories, protein, carbs, fat, slot };
    updateEntry({ ...current, customMeals: [...current.customMeals, custom] });
    addRecentFood(custom);
    setRecents(getRecentFoods());
  }

  // Add manual food
  function addManualFood() {
    if (!customName || !customCal || !activeSlot) return;
    addFoodToSlot(
      activeSlot,
      customName,
      parseInt(customCal, 10),
      parseInt(customPro, 10) || 0,
      parseInt(customCarbs, 10) || 0,
      parseInt(customFat, 10) || 0
    );
    setCustomName(""); setCustomCal(""); setCustomPro(""); setCustomCarbs(""); setCustomFat("");
    setShowManualForm(false);
    setActiveSlot(null);
  }

  // Remove plan meal
  function removePlanMeal(slot: string, name: string) {
    if (!entry) return;
    updateEntry({ ...entry, meals: entry.meals.filter((m) => !(m.slot === slot && m.name === name)) });
  }

  // Remove custom meal
  function removeCustom(idx: number) {
    if (!entry) return;
    updateEntry({ ...entry, customMeals: entry.customMeals.filter((_, i) => i !== idx) });
  }

  // Food search → add to active slot
  function handleFoodAdd(name: string, calories: number, protein: number, carbs: number, fat: number) {
    if (activeSlot) {
      addFoodToSlot(activeSlot, name, calories, protein, carbs, fat);
    } else {
      // Fallback: add to "Snacks"
      addFoodToSlot("Snacks", name, calories, protein, carbs, fat);
    }
    setActiveSlot(null);
  }

  // Barcode scan found
  function handleBarcodeFound(food: FoodItem) {
    setShowBarcode(false);
    const macros = calcMacros(food, 100);
    const label = food.brand ? `${food.name} (${food.brand}) — 100g` : `${food.name} — 100g`;
    handleFoodAdd(label, macros.calories, macros.protein, macros.carbs, macros.fat);
  }

  // Water tracker
  function addWater(ml: number) {
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    const newWater = Math.max(0, (current.waterMl || 0) + ml);
    updateEntry({ ...current, waterMl: newWater });
  }

  // Toggle favorite
  function toggleFavorite(name: string, calories: number, protein: number, carbs: number, fat: number) {
    const existing = favorites.find((f) => f.name === name);
    if (existing) {
      removeFoodFavorite(existing.id);
    } else {
      addFoodFavorite({ id: generateId(), name, calories, protein, carbs, fat });
    }
    setFavorites(getFoodFavorites());
  }

  function isFav(name: string) {
    return favorites.some((f) => f.name === name);
  }

  // Templates
  function handleSaveTemplate() {
    if (!templateName.trim() || !entry) return;
    const tpl: MealTemplate = {
      id: generateId(),
      name: templateName.trim(),
      meals: entry.meals,
      customMeals: entry.customMeals,
      totalCalories: totalCal,
      totalProtein: totalPro,
      createdAt: selectedDate,
    };
    saveMealTemplate(tpl);
    setTemplates(getMealTemplates());
    setTemplateName("");
    setShowSaveTemplate(false);
  }

  function applyTemplate(tpl: MealTemplate) {
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    updateEntry({ ...current, meals: tpl.meals, customMeals: tpl.customMeals });
    setShowTemplates(false);
  }

  function handleDeleteTemplate(id: string) {
    deleteMealTemplate(id);
    setTemplates(getMealTemplates());
  }

  function toggleShoppingItem(item: string) {
    const updated = checkedItems.includes(item)
      ? checkedItems.filter((i) => i !== item)
      : [...checkedItems, item];
    setCheckedItems(updated);
    setShoppingChecked(updated);
  }

  // Save custom targets
  function handleSaveTargets(cal: number, pro: number, carbs: number, fat: number, water: number) {
    const t: NutritionTargets = { calories: cal, protein: pro, carbs, fat, water };
    saveNutritionTargets(t);
    setTargets(t);
    setShowTargetEditor(false);
  }

  // Totals
  const totalCal = (entry?.meals.reduce((s, m) => s + m.calories, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.calories, 0) || 0);
  const totalPro = (entry?.meals.reduce((s, m) => s + m.protein, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.protein, 0) || 0);
  const totalCarbs = (entry?.meals.reduce((s, m) => s + m.carbs, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.carbs, 0) || 0);
  const totalFat = (entry?.meals.reduce((s, m) => s + m.fat, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.fat, 0) || 0);
  const waterMl = entry?.waterMl || 0;
  const remainingCal = targets.calories - totalCal;
  const weeklyData = getWeeklyCalories(targets.calories);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "tracker", label: "Hoy", icon: <UtensilsCrossed size={14} /> },
    { id: "plan", label: "Plan", icon: <ChefHat size={14} /> },
    { id: "shopping", label: "Compras", icon: <ShoppingCart size={14} /> },
    { id: "supps", label: "Supps", icon: <Pill size={14} /> },
    { id: "cooking", label: "Cocinar", icon: <ChefHat size={14} /> },
  ];

  // Format date display
  const dateObj = new Date(selectedDate + "T12:00:00");
  const dateLabel = isToday(selectedDate)
    ? "Hoy"
    : dateObj.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-0.5">
        <h1 className="text-xl font-black tracking-tight">Nutrición</h1>
        <button
          onClick={() => setShowTargetEditor(true)}
          className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg"
          style={{ color: "var(--text-muted)" }}
          title="Ajustar objetivos"
        >
          <Settings size={18} />
        </button>
      </div>
      <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
        {targets.calories} kcal · {targets.protein}g P · {targets.carbs}g C · {targets.fat}g F
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.7rem] font-semibold whitespace-nowrap cursor-pointer border-none transition-colors ${
              tab === t.id ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)]"
            }`}
            style={tab !== t.id ? { background: "var(--bg-elevated)" } : {}}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <SwipeTabs tabs={["tracker", "plan", "shopping", "supps", "cooking"] as const} current={tab} onChange={(t) => setTab(t as Tab)}>
      {/* TRACKER */}
      {tab === "tracker" && (
        <div>
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-xl border-none cursor-pointer"
              style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setSelectedDate(today())}
              className="px-4 py-2 rounded-xl border-none cursor-pointer text-sm font-bold min-w-[120px] text-center"
              style={{
                background: isToday(selectedDate) ? "var(--accent)" : "var(--bg-elevated)",
                color: isToday(selectedDate) ? "white" : "var(--text)",
              }}
            >
              {dateLabel}
            </button>
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-xl border-none cursor-pointer"
              style={{
                background: "var(--bg-elevated)",
                color: isToday(selectedDate) ? "var(--text-muted)" : "var(--text)",
              }}
              disabled={isToday(selectedDate)}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Macro Overview */}
          <div className="card mb-3">
            <div className="text-[0.65rem] uppercase tracking-wider mb-2.5" style={{ color: "var(--text-muted)" }}>
              Macros — {selectedDate}
            </div>
            {[
              { label: "Calorías", value: totalCal, target: targets.calories, unit: "kcal", color: "#2C6BED" },
              { label: "Proteína", value: totalPro, target: targets.protein, unit: "g", color: "#34C759" },
              { label: "Carbos", value: totalCarbs, target: targets.carbs, unit: "g", color: "#FFCC00" },
              { label: "Grasa", value: totalFat, target: targets.fat, unit: "g", color: "#AF52DE" },
            ].map((m) => (
              <div key={m.label} className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                  <span className="text-[0.7rem] font-bold" style={{ color: "var(--text)" }}>
                    {m.value} <span style={{ color: "var(--text-muted)" }}>/ {m.target}{m.unit}</span>
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Caloric Balance */}
          <div className="card mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[0.75rem] font-bold" style={{ color: "var(--text)" }}>Balance Calórico</div>
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
            <div className="text-[0.6rem] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Semana</div>
            <div className="flex items-end gap-1" style={{ height: "48px" }}>
              {weeklyData.map((d, i) => {
                const pct = targets.calories > 0 ? Math.min(d.cal / targets.calories, 1.3) : 0;
                const over = d.cal > targets.calories;
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
              const daysWithData = weeklyData.filter(d => d.cal > 0).length;
              const weekAvg = daysWithData > 0 ? Math.round(weekTotal / daysWithData) : 0;
              return weekAvg > 0 ? (
                <div className="text-[0.6rem] mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Promedio: <strong>{weekAvg} kcal/día</strong> · Total: {weekTotal} kcal
                </div>
              ) : null;
            })()}
          </div>

          {/* Water Tracker */}
          <div className="card mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <Droplets size={16} style={{ color: "#007AFF" }} />
                <span className="text-[0.75rem] font-bold" style={{ color: "var(--text)" }}>Agua</span>
              </div>
              <span className="text-[0.7rem] font-bold" style={{ color: "#007AFF" }}>
                {(waterMl / 1000).toFixed(1)}L <span style={{ color: "var(--text-muted)" }}>/ {targets.water}L</span>
              </span>
            </div>
            <div className="progress-bar mb-2">
              <div className="progress-fill" style={{ width: `${Math.min((waterMl / WATER_TARGET_ML) * 100, 100)}%`, background: "#007AFF" }} />
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => addWater(GLASS_ML)} className="flex-1 py-2 rounded-xl border-none cursor-pointer text-sm font-bold text-white" style={{ background: "#007AFF" }}>
                <Droplets size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} /> +1 Vaso
              </button>
              <button onClick={() => addWater(500)} className="py-2 px-3 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold" style={{ background: "var(--bg-elevated)", color: "#007AFF" }}>
                +500ml
              </button>
              <button onClick={() => addWater(-GLASS_ML)} className="py-2 px-3 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
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

          {/* Global search/barcode/recents/favs buttons */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            <button
              onClick={() => { setActiveSlot("Snacks"); setShowFoodSearch(true); }}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              <Search size={13} /> Buscar
            </button>
            <button
              onClick={() => { setActiveSlot("Snacks"); setShowBarcode(true); }}
              className="py-2 px-3 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold"
              style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
            >
              <Camera size={13} className="inline mr-1" style={{ verticalAlign: "-2px" }} /> Código
            </button>
            {recents.length > 0 && (
              <button
                onClick={() => setShowRecents(true)}
                className="py-2 px-3 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold"
                style={{ background: "var(--bg-elevated)", color: "#FF9500" }}
              >
                <Clock size={13} className="inline mr-1" style={{ verticalAlign: "-2px" }} /> Recientes
              </button>
            )}
            {favorites.length > 0 && (
              <button
                onClick={() => setShowFavorites(true)}
                className="py-2 px-3 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold"
                style={{ background: "var(--bg-elevated)", color: "#FF3B30" }}
              >
                <Heart size={13} className="inline mr-1" style={{ verticalAlign: "-2px" }} /> Favoritos
              </button>
            )}
          </div>

          {/* ===== MEAL SLOTS ===== */}
          {MEAL_SLOTS.map((slotName) => {
            const foods = getFoodsForSlot(slotName);
            const slotCal = foods.reduce((s, f) => s + f.calories, 0);
            const slotPro = foods.reduce((s, f) => s + f.protein, 0);
            const planSlot = mealPlan.find((s) => s.slot === slotName);

            return (
              <div key={slotName} className="card mb-2.5">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-[0.85rem] font-bold" style={{ color: "var(--text)" }}>{slotName}</div>
                    {planSlot && (
                      <div className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>{planSlot.time}</div>
                    )}
                  </div>
                  <div className="text-right">
                    {foods.length > 0 && (
                      <div className="text-[0.6rem] font-bold" style={{ color: "#34C759" }}>
                        {slotCal} kcal · {slotPro}g P
                      </div>
                    )}
                  </div>
                </div>

                {/* Foods in this slot */}
                {foods.length > 0 && (
                  <div className="flex flex-col gap-1 mb-2">
                    {foods.map((food, fi) => (
                      <div key={fi} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.73rem] font-medium truncate" style={{ color: "var(--text)" }}>{food.name}</div>
                          <div className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
                            {food.calories}kcal · {food.protein}P · {food.carbs}C · {food.fat}F
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFavorite(food.name, food.calories, food.protein, food.carbs, food.fat)}
                          className="bg-transparent border-none cursor-pointer p-1"
                          style={{ color: isFav(food.name) ? "#FF3B30" : "var(--text-muted)" }}
                        >
                          {isFav(food.name) ? <Heart size={13} fill="#FF3B30" /> : <Heart size={13} />}
                        </button>
                        <button
                          onClick={() => {
                            if (food.type === "plan") {
                              removePlanMeal(slotName, food.name);
                            } else {
                              removeCustom(food.index);
                            }
                          }}
                          className="bg-transparent border-none cursor-pointer p-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons for this slot */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setActiveSlot(slotName); setShowFoodSearch(true); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed cursor-pointer text-[0.65rem] font-semibold"
                    style={{ background: "transparent", borderColor: "var(--border)", color: "var(--accent)" }}
                  >
                    <Search size={12} /> Buscar
                  </button>
                  <button
                    onClick={() => { setActiveSlot(slotName); setShowManualForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed cursor-pointer text-[0.65rem] font-semibold"
                    style={{ background: "transparent", borderColor: "var(--border)", color: "#34C759" }}
                  >
                    <Plus size={12} /> Manual
                  </button>
                  {planSlot && planSlot.options.length > 0 && (
                    <button
                      onClick={() => setShowSuggestions(showSuggestions === slotName ? null : slotName)}
                      className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg border border-dashed cursor-pointer text-[0.65rem] font-semibold"
                      style={{ background: "transparent", borderColor: "var(--border)", color: "#FF9500" }}
                    >
                      <ChefHat size={12} /> Sugerencias
                    </button>
                  )}
                </div>

                {/* Suggestions from meal plan (expandable) */}
                {showSuggestions === slotName && planSlot && (
                  <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="text-[0.6rem] font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>OPCIONES DEL PLAN</div>
                    <div className="flex flex-col gap-1">
                      {planSlot.options.map((meal) => {
                        const sel = entry?.meals.some((m) => m.slot === slotName && m.name === meal.name);
                        return (
                          <button
                            key={meal.name}
                            onClick={() => toggleMeal(slotName, meal)}
                            className="flex justify-between items-center p-2 rounded-lg cursor-pointer text-left w-full border transition-colors"
                            style={{
                              background: sel ? "#34C75912" : "var(--bg-elevated)",
                              borderColor: sel ? "#34C75940" : "transparent",
                            }}
                          >
                            <div className="flex-1">
                              <div className="text-[0.73rem] font-medium" style={{ color: "var(--text)" }}>
                                {sel && <Check size={11} className="inline mr-1" style={{ color: "#34C759", verticalAlign: "-1px" }} />}
                                {meal.name}
                              </div>
                              <div className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
                                {meal.calories}kcal · {meal.protein}P · {meal.carbs}C · {meal.fat}F
                                {meal.tags.includes("rápido") && " ⚡"}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Legacy unslotted custom meals */}
          {getUnslottedCustomMeals().length > 0 && (
            <div className="card mb-2.5">
              <div className="text-[0.75rem] font-bold mb-1.5" style={{ color: "var(--text)" }}>Comidas Extra (sin categoría)</div>
              {getUnslottedCustomMeals().map((cm) => (
                <div key={cm.originalIndex} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div className="text-[0.75rem]" style={{ color: "var(--text)" }}>{cm.name}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {cm.calories}kcal · {cm.protein}P · {cm.carbs}C · {cm.fat}F
                    </div>
                  </div>
                  <button onClick={() => removeCustom(cm.originalIndex)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Templates */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowSaveTemplate(true)}
              disabled={!entry || (entry.meals.length === 0 && entry.customMeals.length === 0)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer text-[0.7rem] font-bold border-none disabled:opacity-40"
              style={{ background: "var(--bg-elevated)", color: "#34C759" }}
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
              <div className="text-[0.85rem] font-bold mb-0.5" style={{ color: "var(--text)" }}>{slot.slot}</div>
              <div className="text-[0.6rem] mb-2.5" style={{ color: "var(--text-muted)" }}>{slot.time}</div>
              {slot.options.map((meal) => (
                <div key={meal.name} className="py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{meal.name}</span>
                    <span className="text-[0.65rem] font-bold" style={{ color: "var(--accent)" }}>{meal.calories} kcal</span>
                  </div>
                  <div className="text-[0.65rem] mb-1" style={{ color: "var(--text-muted)" }}>
                    {meal.protein}g P · {meal.carbs}g C · {meal.fat}g F · {meal.prepTime}
                  </div>
                  <div className="text-[0.7rem] mb-1" style={{ color: "var(--text-muted)" }}>{meal.ingredients.join(" · ")}</div>
                  <div className="text-[0.65rem] italic" style={{ color: "var(--text-muted)" }}>{meal.prep}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* SHOPPING */}
      {tab === "shopping" && (
        <div className="card">
          <div className="text-[0.85rem] font-bold mb-2.5" style={{ color: "var(--text)" }}>Lista Semanal</div>
          {weeklyShoppingList.map((item, i) => {
            const checked = checkedItems.includes(item.item);
            return (
              <div
                key={i}
                onClick={() => toggleShoppingItem(item.item)}
                className={`flex justify-between items-center py-1.5 text-sm cursor-pointer transition-opacity ${checked ? "opacity-40" : ""}`}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span style={{ color: "var(--text-muted)" }} className={checked ? "line-through" : ""}>
                  {checked && <Check size={12} className="inline mr-1 align-middle" style={{ color: "#34C759" }} />}
                  {item.item}
                </span>
                <span style={{ color: "var(--text-muted)" }} className={checked ? "line-through" : ""}>{item.quantity}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* SUPPS */}
      {tab === "supps" && (
        <div className="card">
          <div className="text-[0.85rem] font-bold mb-2.5" style={{ color: "var(--text)" }}>Suplementos</div>
          {supplementPlan.map((s, i) => (
            <div key={i} className="py-2.5" style={i < supplementPlan.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{s.name}</span>
                <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded" style={{
                  background: s.status === "actual" ? "#34C75922" : s.status === "AGREGAR" ? "#FFCC0022" : "#2C6BED22",
                  color: s.status === "actual" ? "#34C759" : s.status === "AGREGAR" ? "#FFCC00" : "#2C6BED",
                }}>{s.status}</span>
              </div>
              <div className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{s.dose} · {s.when}</div>
              {s.notes && <div className="text-[0.65rem] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* COOKING */}
      {tab === "cooking" && (
        <div>
          {cookingLessons.map((lesson, i) => (
            <div key={i} className="card mb-2.5">
              <div className="text-[0.85rem] font-bold mb-0.5" style={{ color: "var(--text)" }}>{lesson.title}</div>
              <div className="text-[0.65rem] mb-2" style={{ color: "var(--accent)" }}>{lesson.difficulty} · {lesson.time}</div>
              {lesson.steps.map((step, j) => (
                <div key={j} className="flex gap-2 py-1 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                  <span className="font-bold min-w-[18px]" style={{ color: "var(--text-muted)" }}>{j + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      </SwipeTabs>

      {/* ===== MODALS ===== */}

      {/* Food Search Modal */}
      <FoodSearchModal
        open={showFoodSearch}
        onClose={() => { setShowFoodSearch(false); setActiveSlot(null); }}
        onAdd={handleFoodAdd}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        open={showBarcode}
        onClose={() => { setShowBarcode(false); setActiveSlot(null); }}
        onFound={handleBarcodeFound}
      />

      {/* Manual Food Form Modal */}
      {showManualForm && activeSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => { setShowManualForm(false); setActiveSlot(null); }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-[90%] max-w-[400px] rounded-2xl p-5" style={{ background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold" style={{ color: "var(--text)" }}>Agregar a {activeSlot}</div>
              <button onClick={() => { setShowManualForm(false); setActiveSlot(null); }} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nombre del alimento"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full mb-2 text-sm rounded-lg py-2.5 px-3 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
              autoFocus
            />
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { label: "kcal *", val: customCal, set: setCustomCal },
                { label: "Prot (g)", val: customPro, set: setCustomPro },
                { label: "Carbs (g)", val: customCarbs, set: setCustomCarbs },
                { label: "Fat (g)", val: customFat, set: setCustomFat },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-[0.55rem] mb-0.5" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full text-center text-sm rounded-lg py-2 border"
                    style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setShowManualForm(false); setActiveSlot(null); }}
                className="flex-1 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold"
                style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Cancelar
              </button>
              <button
                onClick={addManualFood}
                disabled={!customName || !customCal}
                className="flex-[2] py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm disabled:opacity-40"
                style={{ background: "#34C759" }}
              >
                <Plus size={14} className="inline mr-1" style={{ verticalAlign: "-2px" }} /> Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recents Modal */}
      {showRecents && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShowRecents(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-[540px] max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: "#FF9500" }} />
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Comidas Recientes</span>
              </div>
              <button onClick={() => setShowRecents(false)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {recents.map((food, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--bg-elevated)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] font-semibold truncate" style={{ color: "var(--text)" }}>{food.name}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {food.calories}kcal · {food.protein}P · {food.carbs}C · {food.fat}F
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {MEAL_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => {
                          addFoodToSlot(slot, food.name, food.calories, food.protein, food.carbs, food.fat);
                          setShowRecents(false);
                        }}
                        className="py-1 px-2 rounded-lg border-none cursor-pointer text-[0.55rem] font-bold text-white"
                        style={{ background: "var(--accent)" }}
                        title={`Agregar a ${slot}`}
                      >
                        {slot.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Favorites Modal */}
      {showFavorites && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShowFavorites(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-[540px] max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Heart size={16} fill="#FF3B30" style={{ color: "#FF3B30" }} />
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Favoritos</span>
              </div>
              <button onClick={() => setShowFavorites(false)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {favorites.length === 0 && (
                <p className="text-center py-8 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                  No tenés favoritos. Tocá el ❤️ en cualquier comida para guardarla.
                </p>
              )}
              {favorites.map((fav) => (
                <div key={fav.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--bg-elevated)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] font-semibold truncate" style={{ color: "var(--text)" }}>{fav.name}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {fav.calories}kcal · {fav.protein}P · {fav.carbs}C · {fav.fat}F
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {MEAL_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => {
                          addFoodToSlot(slot, fav.name, fav.calories, fav.protein, fav.carbs, fav.fat);
                          setShowFavorites(false);
                        }}
                        className="py-1 px-2 rounded-lg border-none cursor-pointer text-[0.55rem] font-bold text-white"
                        style={{ background: "var(--accent)" }}
                        title={`Agregar a ${slot}`}
                      >
                        {slot.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      removeFoodFavorite(fav.id);
                      setFavorites(getFoodFavorites());
                    }}
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

      {/* Targets Editor Modal */}
      {showTargetEditor && <TargetEditorModal targets={targets} onSave={handleSaveTargets} onClose={() => setShowTargetEditor(false)} />}

      {/* Save Template Dialog */}
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
              <button onClick={() => setShowSaveTemplate(false)} className="flex-1 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold" style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }}>Cancelar</button>
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

      {/* Load Template Dialog */}
      {showTemplates && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShowTemplates(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-[540px] max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
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
                  <button onClick={() => handleDeleteTemplate(tpl.id)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "#FF3B30" }}>
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

// Target Editor Modal
function TargetEditorModal({ targets, onSave, onClose }: { targets: NutritionTargets; onSave: (cal: number, pro: number, carbs: number, fat: number, water: number) => void; onClose: () => void }) {
  const [cal, setCal] = useState(String(targets.calories));
  const [pro, setPro] = useState(String(targets.protein));
  const [carbs, setCarbs] = useState(String(targets.carbs));
  const [fat, setFat] = useState(String(targets.fat));
  const [water, setWater] = useState(String(targets.water));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-[90%] max-w-[400px] rounded-2xl p-5" style={{ background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>Objetivos Nutricionales</div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
          Personalizá tus objetivos diarios. Se calculan automáticamente desde tu perfil pero podés ajustarlos.
        </p>
        <div className="flex flex-col gap-2.5 mb-4">
          {[
            { label: "Calorías (kcal)", val: cal, set: setCal, color: "#2C6BED" },
            { label: "Proteína (g)", val: pro, set: setPro, color: "#34C759" },
            { label: "Carbohidratos (g)", val: carbs, set: setCarbs, color: "#FFCC00" },
            { label: "Grasa (g)", val: fat, set: setFat, color: "#AF52DE" },
            { label: "Agua (litros)", val: water, set: setWater, color: "#007AFF" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
              <label className="text-[0.7rem] flex-1" style={{ color: "var(--text)" }}>{f.label}</label>
              <input
                type="number"
                inputMode="decimal"
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className="w-24 text-right text-sm rounded-lg py-2 px-3 border"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold" style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }}>Cancelar</button>
          <button
            onClick={() => onSave(
              parseInt(cal, 10) || 2300,
              parseInt(pro, 10) || 170,
              parseInt(carbs, 10) || 230,
              parseInt(fat, 10) || 77,
              parseFloat(water) || 3.0
            )}
            className="flex-[2] py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm"
            style={{ background: "var(--accent)" }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: get this week's calorie data
function getWeeklyCalories(targetCal: number): { label: string; cal: number; isToday: boolean }[] {
  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const now = new Date();
  const dayOfWeek = now.getDay();
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
