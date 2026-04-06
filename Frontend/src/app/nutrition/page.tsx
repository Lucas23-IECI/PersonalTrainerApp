"use client";

import { useState, useEffect } from "react";
import {
  mealPlan,
  weeklyShoppingList,
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
  getMealSlotTargets,
  getDefaultMealSlotTargets,
  addRecentFood,
  trackFoodFrequency,
  getRecipes,
  saveRecipe,
  deleteRecipe,
  calculateRecipeMacros,
  type NutritionEntry,
  type SelectedMeal,
  type CustomMeal,
  type MealTemplate,
  type NutritionTargets,
  type MealSlotTarget,
  type Recipe,
} from "@/lib/storage";
import {
  getSupplements,
  getSupplementLog,
  toggleSupplementTaken,
  getSupplementStreak,
  saveSupplement,
  deleteSupplement,
  getDynamicWaterGoal,
  type Supplement,
} from "@/lib/storage";
import {
  Check, Plus, ShoppingCart, Pill, ChefHat, UtensilsCrossed, Trash2,
  Droplets, Save, FolderOpen, TrendingDown, TrendingUp, Copy,
  Minus, X, ChevronLeft, ChevronRight, Settings, BookOpen, Target,
} from "lucide-react";
import { PageTransition, SwipeTabs } from "@/components/motion";
import CalorieRing from "@/components/CalorieRing";
import AddFoodScreen from "@/components/AddFoodScreen";
import { t } from "@/lib/i18n";
import PullToRefresh from "@/components/PullToRefresh";
import RecipeBuilder, { RecipeList } from "@/components/RecipeBuilder";

type Tab = "tracker" | "plan" | "recipes" | "shopping" | "supps" | "cooking";

const GLASS_ML = 250;
const MEAL_SLOTS = ["Desayuno", "Almuerzo", "Cena", "Snacks"];
const SLOT_ICONS: Record<string, string> = { Desayuno: "☀️", Almuerzo: "🍽️", Cena: "🌙", Snacks: "🍎" };

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [tab, setTab] = useState<Tab>("tracker");
  const [entry, setEntry] = useState<NutritionEntry | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [targets, setTargets] = useState<NutritionTargets>({ calories: 2300, protein: 170, carbs: 230, fat: 77, water: 3.0 });

  // AddFoodScreen
  const [showAddFood, setShowAddFood] = useState(false);
  const [addFoodSlot, setAddFoodSlot] = useState("Snacks");

  // Suggestion expansion
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  // Modals
  const [showTargetEditor, setShowTargetEditor] = useState(false);
  const [showMealGoalsEditor, setShowMealGoalsEditor] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  // Recipes
  const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Supplements (7.1)
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [suppLog, setSuppLog] = useState<Record<string, boolean>>({});
  const [showAddSupp, setShowAddSupp] = useState(false);
  const [editSupp, setEditSupp] = useState<Supplement | null>(null);

  // Dynamic hydration (7.2)
  const [dynamicWaterGoal, setDynamicWaterGoal] = useState(3.0);

  useEffect(() => {
    setEntry(getNutritionForDate(selectedDate));
    setCheckedItems(getShoppingChecked());
    setTemplates(getMealTemplates());
    setTargets(getNutritionTargets());
    setSupplements(getSupplements());
    setSuppLog(getSupplementLog(selectedDate).taken);
    setDynamicWaterGoal(getDynamicWaterGoal());
  }, [selectedDate]);

  const WATER_TARGET_ML = targets.water * 1000;

  function updateEntry(updated: NutritionEntry) {
    saveNutritionEntry(updated);
    setEntry(updated);
  }

  function changeDate(offset: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function isToday(date: string) {
    return date === today();
  }

  function getFoodsForSlot(slot: string): { type: "plan" | "custom"; index: number; name: string; calories: number; protein: number; carbs: number; fat: number; photoUrl?: string }[] {
    if (!entry) return [];
    const planFoods = entry.meals
      .filter((m) => m.slot === slot)
      .map((m, i) => ({ type: "plan" as const, index: i, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, photoUrl: m.photoUrl }));
    const customFoods = entry.customMeals
      .map((m, i) => ({ ...m, originalIndex: i }))
      .filter((m) => m.slot === slot)
      .map((m) => ({ type: "custom" as const, index: m.originalIndex, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, photoUrl: m.photoUrl }));
    return [...planFoods, ...customFoods];
  }

  function getUnslottedCustomMeals() {
    if (!entry) return [];
    return entry.customMeals
      .map((m, i) => ({ ...m, originalIndex: i }))
      .filter((m) => !m.slot);
  }

  function toggleMeal(slot: string, meal: Meal) {
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    const exists = current.meals.find((m) => m.slot === slot && m.name === meal.name);
    const newMeals: SelectedMeal[] = exists
      ? current.meals.filter((m) => !(m.slot === slot && m.name === meal.name))
      : [...current.meals, { slot, name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }];
    updateEntry({ ...current, meals: newMeals });
  }

  function addFoodToSlot(slot: string, name: string, calories: number, protein: number, carbs: number, fat: number, fiber?: number, sodium?: number, sugar?: number, photoUrl?: string) {
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    const custom: CustomMeal = { name, calories, protein, carbs, fat, fiber, sodium, sugar, slot, photoUrl };
    updateEntry({ ...current, customMeals: [...current.customMeals, custom] });
    addRecentFood(custom);
    trackFoodFrequency(name, calories, protein, carbs, fat, fiber, sodium, sugar);
  }

  function openAddFood(slot: string) {
    setAddFoodSlot(slot);
    setShowAddFood(true);
  }

  function handleAddFromScreen(name: string, calories: number, protein: number, carbs: number, fat: number, fiber?: number, sodium?: number, sugar?: number, photoUrl?: string) {
    addFoodToSlot(addFoodSlot, name, calories, protein, carbs, fat, fiber, sodium, sugar, photoUrl);
  }

  function removePlanMeal(slot: string, name: string) {
    if (!entry) return;
    updateEntry({ ...entry, meals: entry.meals.filter((m) => !(m.slot === slot && m.name === name)) });
  }

  function removeCustom(idx: number) {
    if (!entry) return;
    updateEntry({ ...entry, customMeals: entry.customMeals.filter((_, i) => i !== idx) });
  }

  function addWater(ml: number) {
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    const newWater = Math.max(0, (current.waterMl || 0) + ml);
    updateEntry({ ...current, waterMl: newWater });
  }

  // Copy foods from yesterday
  function copyYesterday() {
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yEntry = getNutritionForDate(yesterday.toISOString().split("T")[0]);
    if (!yEntry || (yEntry.meals.length === 0 && yEntry.customMeals.length === 0)) return;
    const current = entry || { date: selectedDate, meals: [], customMeals: [], waterMl: 0 };
    updateEntry({
      ...current,
      meals: [...current.meals, ...yEntry.meals],
      customMeals: [...current.customMeals, ...yEntry.customMeals],
    });
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

  function handleSaveTargets(cal: number, pro: number, carbs: number, fat: number, water: number, fiber?: number, sodium?: number, sugar?: number) {
    const t: NutritionTargets = { calories: cal, protein: pro, carbs, fat, water, fiber, sodium, sugar };
    saveNutritionTargets(t);
    setTargets(t);
    setShowTargetEditor(false);
  }

  // Totals
  const totalCal = (entry?.meals.reduce((s, m) => s + m.calories, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.calories, 0) || 0);
  const totalPro = (entry?.meals.reduce((s, m) => s + m.protein, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.protein, 0) || 0);
  const totalCarbs = (entry?.meals.reduce((s, m) => s + m.carbs, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.carbs, 0) || 0);
  const totalFat = (entry?.meals.reduce((s, m) => s + m.fat, 0) || 0) + (entry?.customMeals.reduce((s, m) => s + m.fat, 0) || 0);
  const totalFiber = (entry?.meals.reduce((s, m) => s + (m.fiber || 0), 0) || 0) + (entry?.customMeals.reduce((s, m) => s + (m.fiber || 0), 0) || 0);
  const totalSodium = (entry?.meals.reduce((s, m) => s + (m.sodium || 0), 0) || 0) + (entry?.customMeals.reduce((s, m) => s + (m.sodium || 0), 0) || 0);
  const totalSugar = (entry?.meals.reduce((s, m) => s + (m.sugar || 0), 0) || 0) + (entry?.customMeals.reduce((s, m) => s + (m.sugar || 0), 0) || 0);
  const waterMl = entry?.waterMl || 0;
  const remainingCal = targets.calories - totalCal;
  const weeklyData = getWeeklyCalories(targets.calories);
  const dayIsEmpty = totalCal === 0;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "tracker", label: t("nutrition.daily"), icon: <UtensilsCrossed size={14} /> },
    { id: "plan", label: t("nutrition.plan"), icon: <ChefHat size={14} /> },
    { id: "recipes", label: "Recetas", icon: <BookOpen size={14} /> },
    { id: "shopping", label: t("nutrition.shopping"), icon: <ShoppingCart size={14} /> },
    { id: "supps", label: t("nutrition.supplements"), icon: <Pill size={14} /> },
    { id: "cooking", label: t("nutrition.cooking"), icon: <ChefHat size={14} /> },
  ];

  const dateObj = new Date(selectedDate + "T12:00:00");
  const dateLabel = isToday(selectedDate)
    ? t("common.today")
    : dateObj.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });

  return (
    <PageTransition>
    <PullToRefresh onRefresh={() => setEntry(getNutritionForDate(selectedDate))}>
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <h1 className="text-xl font-black tracking-tight">{t("nutrition.title")}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMealGoalsEditor(true)}
            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg"
            style={{ color: "var(--text-muted)" }}
            title={t("nutrition.editMealGoals")}
          >
            <Target size={17} />
          </button>
          <button
            onClick={() => setShowTargetEditor(true)}
            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg"
            style={{ color: "var(--text-muted)" }}
            title="Ajustar objetivos"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

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

      <SwipeTabs tabs={["tracker", "plan", "recipes", "shopping", "supps", "cooking"] as const} current={tab} onChange={(t) => setTab(t as Tab)}>
      {/* ========== TRACKER (MFP-style Food Diary) ========== */}
      {tab === "tracker" && (
        <div>
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-3 mb-4">
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

          {/* Calorie Ring + Macros */}
          <div className="card mb-3">
            <CalorieRing
              consumed={totalCal}
              goal={targets.calories}
              protein={totalPro}
              carbs={totalCarbs}
              fat={totalFat}
              proteinTarget={targets.protein}
              carbsTarget={targets.carbs}
              fatTarget={targets.fat}
              fiber={totalFiber}
              sodium={totalSodium}
              sugar={totalSugar}
              fiberTarget={targets.fiber}
              sodiumTarget={targets.sodium}
              sugarTarget={targets.sugar}
            />
          </div>

          {/* Caloric Balance Mini */}
          <div className="card mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {remainingCal > 0 ? (
                <TrendingDown size={14} style={{ color: "#34C759" }} />
              ) : (
                <TrendingUp size={14} style={{ color: "#FF3B30" }} />
              )}
              <span className="text-[0.75rem] font-bold" style={{ color: remainingCal >= 0 ? "#34C759" : "#FF3B30" }}>
                {remainingCal >= 0 ? `${remainingCal} ${t("nutrition.caloriesRemaining")}` : `+${Math.abs(remainingCal)} ${t("nutrition.caloriesExceeded")}`}
              </span>
            </div>
            <div className="flex items-end gap-0.5" style={{ height: "28px" }}>
              {weeklyData.map((d, i) => {
                const pct = targets.calories > 0 ? Math.min(d.cal / targets.calories, 1.3) : 0;
                const over = d.cal > targets.calories;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: "12px" }}>
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${Math.max(pct * 20, 2)}px`,
                        background: d.isToday ? "var(--accent)" : over ? "#FF3B3066" : "#34C75966",
                      }}
                    />
                    <span className="text-[0.4rem]" style={{ color: d.isToday ? "var(--accent)" : "var(--text-muted)" }}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Water Tracker - Enhanced (7.2) */}
          <div className="card mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Droplets size={14} style={{ color: "#007AFF" }} />
                <span className="text-[0.75rem] font-bold" style={{ color: "var(--text)" }}>{t("nutrition.water")}</span>
              </div>
              <span className="text-[0.7rem] font-bold" style={{ color: "#007AFF" }}>
                {(waterMl / 1000).toFixed(1)}L <span style={{ color: "var(--text-muted)" }}>/ {dynamicWaterGoal}L</span>
              </span>
            </div>
            <div className="progress-bar mb-1.5">
              <div className="progress-fill" style={{ width: `${Math.min((waterMl / (dynamicWaterGoal * 1000)) * 100, 100)}%`, background: "#007AFF" }} />
            </div>
            <div className="text-[0.55rem] mb-2" style={{ color: "var(--text-muted)" }}>
              {t("hydration.basedOnWeight")} · {dynamicWaterGoal !== targets.water ? `${t("hydration.dynamic")}: ${dynamicWaterGoal}L` : t("hydration.restDay")}
              {dynamicWaterGoal > targets.water && ` · ${t("hydration.trainingDay")}`}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => addWater(GLASS_ML)} className="flex-1 py-1.5 rounded-lg border-none cursor-pointer text-[0.7rem] font-bold text-white" style={{ background: "#007AFF" }}>
                {t("nutrition.addGlass")}
              </button>
              <button onClick={() => addWater(500)} className="py-1.5 px-3 rounded-lg border-none cursor-pointer text-[0.65rem] font-bold" style={{ background: "var(--bg-elevated)", color: "#007AFF" }}>
                {t("nutrition.add500ml")}
              </button>
              <button onClick={() => addWater(-GLASS_ML)} className="py-1.5 px-3 rounded-lg border-none cursor-pointer text-[0.65rem] font-bold" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                <Minus size={12} />
              </button>
            </div>
          </div>

          {/* Copy Yesterday / Templates (when day is empty) */}
          {dayIsEmpty && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={copyYesterday}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl cursor-pointer border-none text-[0.75rem] font-bold"
                style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
              >
                <Copy size={14} /> {t("nutrition.copyFromYesterday")}
              </button>
              {templates.length > 0 && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl cursor-pointer border-none text-[0.75rem] font-bold"
                  style={{ background: "var(--bg-elevated)", color: "#34C759" }}
                >
                  <FolderOpen size={14} /> {t("nutrition.useTemplate")}
                </button>
              )}
            </div>
          )}

          {/* ===== FOOD DIARY - MEAL SLOTS ===== */}
          {MEAL_SLOTS.map((slotName) => {
            const foods = getFoodsForSlot(slotName);
            const slotCal = foods.reduce((s, f) => s + f.calories, 0);
            const slotPro = foods.reduce((s, f) => s + f.protein, 0);
            const slotCarbs = foods.reduce((s, f) => s + f.carbs, 0);
            const slotFat = foods.reduce((s, f) => s + f.fat, 0);
            const planSlot = mealPlan.find((s) => s.slot === slotName);
            const mealGoal = getMealSlotTargets(targets)[slotName];

            return (
              <div key={slotName} className="card mb-2">
                {/* Slot header */}
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{SLOT_ICONS[slotName] || "🍽️"}</span>
                    <span className="text-[0.85rem] font-bold" style={{ color: "var(--text)" }}>{slotName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {foods.length > 0 && (
                      <span className="text-[0.65rem] font-bold" style={{ color: "var(--text-muted)" }}>
                        {slotCal} kcal
                      </span>
                    )}
                    <button
                      onClick={() => openAddFood(slotName)}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                      style={{ background: "var(--accent)", color: "white" }}
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Per-meal macro progress (Feature 6.8) */}
                {mealGoal && foods.length > 0 && (
                  <div className="flex gap-1.5 mb-1.5">
                    {[
                      { label: "Cal", cur: slotCal, goal: mealGoal.calories, color: "var(--accent)" },
                      { label: "P", cur: slotPro, goal: mealGoal.protein, color: "#34C759" },
                      { label: "C", cur: slotCarbs, goal: mealGoal.carbs, color: "#FFCC00" },
                      { label: "F", cur: slotFat, goal: mealGoal.fat, color: "#AF52DE" },
                    ].map((m) => {
                      const pct = m.goal > 0 ? Math.min((m.cur / m.goal) * 100, 100) : 0;
                      const over = m.cur > m.goal && m.goal > 0;
                      return (
                        <div key={m.label} className="flex-1">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[0.5rem] font-bold" style={{ color: over ? "#FF3B30" : "var(--text-muted)" }}>{m.label}</span>
                            <span className="text-[0.45rem]" style={{ color: "var(--text-muted)" }}>{m.cur}/{m.goal}</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? "#FF3B30" : m.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Food list */}
                {foods.length > 0 && (
                  <div className="flex flex-col gap-1 mb-1.5">
                    {foods.map((food, fi) => (
                      <div key={fi} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                        {food.photoUrl && (
                          <img src={food.photoUrl} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.73rem] font-medium truncate" style={{ color: "var(--text)" }}>{food.name}</div>
                          <div className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
                            {food.calories}kcal · {food.protein}P · {food.carbs}C · {food.fat}F
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (food.type === "plan") removePlanMeal(slotName, food.name);
                            else removeCustom(food.index);
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

                {/* Empty state — tap the + */}
                {foods.length === 0 && (
                  <button
                    onClick={() => openAddFood(slotName)}
                    className="w-full py-3 rounded-lg border border-dashed cursor-pointer text-[0.7rem] font-medium"
                    style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    {t("nutrition.addFood")}
                  </button>
                )}

                {/* Suggestions toggle */}
                {planSlot && planSlot.options.length > 0 && foods.length === 0 && (
                  <button
                    onClick={() => setShowSuggestions(showSuggestions === slotName ? null : slotName)}
                    className="mt-1.5 text-[0.6rem] font-semibold bg-transparent border-none cursor-pointer"
                    style={{ color: "var(--accent)" }}
                  >
                    {showSuggestions === slotName ? t("nutrition.hideSuggestions") : t("nutrition.showSuggestions")}
                  </button>
                )}

                {showSuggestions === slotName && planSlot && (
                  <div className="mt-1.5 pt-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                    {planSlot.options.map((meal) => {
                      const sel = entry?.meals.some((m) => m.slot === slotName && m.name === meal.name);
                      return (
                        <button
                          key={meal.name}
                          onClick={() => toggleMeal(slotName, meal)}
                          className="w-full flex justify-between items-center p-2 rounded-lg cursor-pointer text-left mb-1 border transition-colors"
                          style={{
                            background: sel ? "#34C75912" : "var(--bg-elevated)",
                            borderColor: sel ? "#34C75940" : "transparent",
                          }}
                        >
                          <div className="flex-1">
                            <div className="text-[0.7rem] font-medium" style={{ color: "var(--text)" }}>
                              {sel && <Check size={11} className="inline mr-1" style={{ color: "#34C759" }} />}
                              {meal.name}
                            </div>
                            <div className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                              {meal.calories}kcal · {meal.protein}P · {meal.carbs}C · {meal.fat}F
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Legacy unslotted custom meals */}
          {getUnslottedCustomMeals().length > 0 && (
            <div className="card mb-2">
              <div className="text-[0.7rem] font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>Comidas Extra (sin categoría)</div>
              {getUnslottedCustomMeals().map((cm) => (
                <div key={cm.originalIndex} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div className="text-[0.73rem]" style={{ color: "var(--text)" }}>{cm.name}</div>
                    <div className="text-[0.58rem]" style={{ color: "var(--text-muted)" }}>
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

          {/* Templates (when day has data) */}
          {!dayIsEmpty && (
            <div className="flex gap-2 mt-2 mb-3">
              <button
                onClick={() => setShowSaveTemplate(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer text-[0.7rem] font-bold border-none"
                style={{ background: "var(--bg-elevated)", color: "#34C759" }}
              >
                <Save size={13} /> Guardar Template
              </button>
              {templates.length > 0 && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer text-[0.7rem] font-bold border-none"
                  style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
                >
                  <FolderOpen size={13} /> Templates
                </button>
              )}
            </div>
          )}
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

      {/* RECIPES */}
      {tab === "recipes" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[0.85rem] font-bold" style={{ color: "var(--text)" }}>Mis Recetas</div>
            <button
              onClick={() => { setEditingRecipe(null); setShowRecipeBuilder(true); }}
              className="flex items-center gap-1 py-1.5 px-3 rounded-lg border-none cursor-pointer text-[0.7rem] font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={14} /> Nueva
            </button>
          </div>
          <RecipeList
            onUse={(recipe) => {
              const macros = calculateRecipeMacros(recipe.ingredients, recipe.servings);
              addFoodToSlot("Snacks", `\u{1F373} ${recipe.name}`, macros.calories, macros.protein, macros.carbs, macros.fat, macros.fiber, macros.sodium, macros.sugar);
            }}
            onEdit={(r) => { setEditingRecipe(r); setShowRecipeBuilder(true); }}
          />
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

      {/* SUPPS — Interactive (7.1) */}
      {tab === "supps" && (
        <div>
          {/* Progress banner */}
          {(() => {
            const activeSupps = supplements.filter((s) => s.active);
            const takenCount = activeSupps.filter((s) => suppLog[s.id]).length;
            const total = activeSupps.length;
            const allDone = total > 0 && takenCount === total;
            return (
              <div className="card mb-3" style={{ borderLeft: allDone ? "3px solid #34C759" : "3px solid var(--accent)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[0.85rem] font-bold" style={{ color: allDone ? "#34C759" : "var(--text)" }}>
                      {allDone ? `✅ ${t("supps.allTaken")}` : `${t("supps.title")}`}
                    </div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {takenCount}/{total} · {t("supps.progress")}
                    </div>
                  </div>
                  <div className="text-2xl font-black" style={{ color: allDone ? "#34C759" : "var(--accent)" }}>
                    {total > 0 ? Math.round((takenCount / total) * 100) : 0}%
                  </div>
                </div>
                {total > 0 && (
                  <div className="progress-bar mt-2">
                    <div className="progress-fill" style={{ width: `${(takenCount / total) * 100}%`, background: allDone ? "#34C759" : "var(--accent)" }} />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Supplement list */}
          {supplements.filter((s) => s.active).map((s) => {
            const taken = !!suppLog[s.id];
            const streak = getSupplementStreak(s.id);
            return (
              <div
                key={s.id}
                className="card mb-2 flex items-center gap-3 cursor-pointer transition-all"
                style={{ opacity: taken ? 0.7 : 1, borderLeft: taken ? "3px solid #34C759" : "3px solid transparent" }}
                onClick={() => {
                  toggleSupplementTaken(selectedDate, s.id);
                  setSuppLog(getSupplementLog(selectedDate).taken);
                }}
              >
                <div className="text-2xl flex-shrink-0">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.8rem] font-bold ${taken ? "line-through" : ""}`} style={{ color: "var(--text)" }}>
                      {s.name}
                    </span>
                    {taken && <Check size={14} style={{ color: "#34C759" }} />}
                  </div>
                  <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                    {s.dose} · {s.when}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {streak > 0 && (
                    <div className="text-[0.55rem] font-bold" style={{ color: "#FF9500" }}>
                      🔥 {streak} {t("supps.days")}
                    </div>
                  )}
                  <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded ${taken ? "bg-[#34C75922] text-[#34C759]" : "bg-[#FF950022] text-[#FF9500]"}`}>
                    {taken ? t("supps.taken") : t("supps.pending")}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Inactive supplements */}
          {supplements.filter((s) => !s.active).length > 0 && (
            <div className="mt-3 mb-2">
              <div className="text-[0.6rem] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Inactivos</div>
              {supplements.filter((s) => !s.active).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg mb-1 cursor-pointer"
                  style={{ background: "var(--bg-elevated)", opacity: 0.6 }}
                  onClick={() => {
                    saveSupplement({ ...s, active: true });
                    setSupplements(getSupplements());
                  }}
                >
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{s.name} — {s.dose}</span>
                  <Plus size={12} className="ml-auto" style={{ color: "var(--accent)" }} />
                </div>
              ))}
            </div>
          )}

          {/* Add supplement button */}
          <button
            onClick={() => { setEditSupp(null); setShowAddSupp(true); }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 rounded-xl cursor-pointer border-none text-[0.75rem] font-bold"
            style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
          >
            <Plus size={14} /> {t("supps.addNew")}
          </button>

          {/* Add/Edit Supplement Modal */}
          {showAddSupp && (
            <SuppModal
              initial={editSupp}
              onSave={(s) => { saveSupplement(s); setSupplements(getSupplements()); setShowAddSupp(false); }}
              onDelete={editSupp ? () => { deleteSupplement(editSupp.id); setSupplements(getSupplements()); setShowAddSupp(false); } : undefined}
              onClose={() => setShowAddSupp(false)}
            />
          )}
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

      {/* MFP-style Add Food Screen */}
      <AddFoodScreen
        open={showAddFood}
        slot={addFoodSlot}
        onClose={() => setShowAddFood(false)}
        onAdd={handleAddFromScreen}
      />

      {/* Targets Editor Modal */}
      {showTargetEditor && <TargetEditorModal targets={targets} onSave={handleSaveTargets} onClose={() => setShowTargetEditor(false)} />}

      {/* Per-Meal Goals Editor (Feature 6.8) */}
      {showMealGoalsEditor && (
        <MealGoalsEditor
          targets={targets}
          onSave={(perMeal) => {
            const updated = { ...targets, perMeal };
            saveNutritionTargets(updated);
            setTargets(updated);
            setShowMealGoalsEditor(false);
          }}
          onClose={() => setShowMealGoalsEditor(false)}
        />
      )}

      {/* Recipe Builder Modal */}
      <RecipeBuilder
        open={showRecipeBuilder}
        onClose={() => { setShowRecipeBuilder(false); setEditingRecipe(null); }}
        editRecipe={editingRecipe}
        onUseRecipe={(recipe) => {
          const macros = calculateRecipeMacros(recipe.ingredients, recipe.servings);
          addFoodToSlot("Snacks", `\u{1F373} ${recipe.name}`, macros.calories, macros.protein, macros.carbs, macros.fat, macros.fiber, macros.sodium, macros.sugar);
          setShowRecipeBuilder(false);
        }}
      />

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
    </PullToRefresh>
    </PageTransition>
  );
}

// Target Editor Modal
function TargetEditorModal({ targets, onSave, onClose }: { targets: NutritionTargets; onSave: (cal: number, pro: number, carbs: number, fat: number, water: number, fiber?: number, sodium?: number, sugar?: number) => void; onClose: () => void }) {
  const [cal, setCal] = useState(String(targets.calories));
  const [pro, setPro] = useState(String(targets.protein));
  const [carbs, setCarbs] = useState(String(targets.carbs));
  const [fat, setFat] = useState(String(targets.fat));
  const [water, setWater] = useState(String(targets.water));
  const [fiber, setFiber] = useState(String(targets.fiber || ""));
  const [sodium, setSodium] = useState(String(targets.sodium || ""));
  const [sugar, setSugar] = useState(String(targets.sugar || ""));

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
            { label: "Calorías (kcal)", val: cal, set: setCal, color: "var(--accent)" },
            { label: "Proteína (g)", val: pro, set: setPro, color: "#34C759" },
            { label: "Carbohidratos (g)", val: carbs, set: setCarbs, color: "#FFCC00" },
            { label: "Grasa (g)", val: fat, set: setFat, color: "#AF52DE" },
            { label: "Fibra (g)", val: fiber, set: setFiber, color: "#8B5E3C" },
            { label: "Sodio (mg)", val: sodium, set: setSodium, color: "#FF6B35" },
            { label: "Azúcar (g)", val: sugar, set: setSugar, color: "#FF2D55" },
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
              parseFloat(water) || 3.0,
              parseInt(fiber, 10) || undefined,
              parseInt(sodium, 10) || undefined,
              parseInt(sugar, 10) || undefined
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

// Per-Meal Goals Editor (Feature 6.8)
function MealGoalsEditor({ targets, onSave, onClose }: {
  targets: NutritionTargets;
  onSave: (perMeal: Record<string, MealSlotTarget>) => void;
  onClose: () => void;
}) {
  const current = getMealSlotTargets(targets);
  const [slots, setSlots] = useState<Record<string, MealSlotTarget>>(() => {
    const copy: Record<string, MealSlotTarget> = {};
    for (const s of MEAL_SLOTS) {
      copy[s] = { ...(current[s] || { calories: 0, protein: 0, carbs: 0, fat: 0 }) };
    }
    return copy;
  });

  function updateSlot(slot: string, field: keyof MealSlotTarget, value: string) {
    setSlots((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], [field]: parseInt(value, 10) || 0 },
    }));
  }

  function autoDistribute() {
    const result = getDefaultMealSlotTargets(targets);
    setSlots(result);
  }

  // Totals
  const totalCal = MEAL_SLOTS.reduce((s, sl) => s + (slots[sl]?.calories || 0), 0);
  const totalPro = MEAL_SLOTS.reduce((s, sl) => s + (slots[sl]?.protein || 0), 0);
  const totalCarbs = MEAL_SLOTS.reduce((s, sl) => s + (slots[sl]?.carbs || 0), 0);
  const totalFat = MEAL_SLOTS.reduce((s, sl) => s + (slots[sl]?.fat || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-[540px] max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Target size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{t("nutrition.mealGoalsTitle")}</span>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
            {t("nutrition.distribution")} — {t("nutrition.ofDaily")}: {targets.calories} kcal / {targets.protein}P / {targets.carbs}C / {targets.fat}F
          </p>

          <button
            onClick={autoDistribute}
            className="w-full mb-4 py-2 rounded-xl border-none cursor-pointer text-[0.7rem] font-bold"
            style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
          >
            🔄 {t("nutrition.autoDistribute")} (25/35/30/10%)
          </button>

          {MEAL_SLOTS.map((slot) => {
            const goal = slots[slot] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
            const pctCal = targets.calories > 0 ? Math.round((goal.calories / targets.calories) * 100) : 0;
            return (
              <div key={slot} className="mb-4 p-3 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{SLOT_ICONS[slot] || "🍽️"}</span>
                    <span className="text-[0.8rem] font-bold" style={{ color: "var(--text)" }}>{slot}</span>
                  </div>
                  <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {pctCal}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { key: "calories" as const, label: "Cal", unit: "kcal", color: "var(--accent)" },
                    { key: "protein" as const, label: "Prot", unit: "g", color: "#34C759" },
                    { key: "carbs" as const, label: "Carbs", unit: "g", color: "#FFCC00" },
                    { key: "fat" as const, label: "Fat", unit: "g", color: "#AF52DE" },
                  ]).map((f) => (
                    <div key={f.key}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                        <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>{f.label}</span>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={goal[f.key] || ""}
                        onChange={(e) => updateSlot(slot, f.key, e.target.value)}
                        className="w-full text-center text-[0.75rem] font-bold rounded-lg py-1.5 border"
                        style={{ background: "var(--bg-card)", color: "var(--text)", borderColor: "var(--border)" }}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Totals summary */}
          <div className="p-3 rounded-xl mb-2" style={{ background: "var(--bg-elevated)", borderLeft: `3px solid ${totalCal > targets.calories ? "#FF3B30" : "#34C759"}` }}>
            <div className="text-[0.6rem] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Total vs Diario</div>
            <div className="grid grid-cols-4 gap-2 text-center text-[0.65rem]">
              {[
                { label: "Cal", sum: totalCal, daily: targets.calories },
                { label: "P", sum: totalPro, daily: targets.protein },
                { label: "C", sum: totalCarbs, daily: targets.carbs },
                { label: "F", sum: totalFat, daily: targets.fat },
              ].map((m) => (
                <div key={m.label}>
                  <span className="font-bold" style={{ color: m.sum === m.daily ? "#34C759" : m.sum > m.daily ? "#FF3B30" : "var(--text)" }}>
                    {m.sum}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}> / {m.daily}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold" style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            Cancelar
          </button>
          <button
            onClick={() => onSave(slots)}
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

// ── Supplement Add/Edit Modal (7.1) ──
function SuppModal({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Supplement | null;
  onSave: (s: Supplement) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const ICONS = ["💪", "🍊", "☀️", "🥛", "🧂", "💊", "🫧", "🧬", "🩸", "🐟"];
  const [name, setName] = useState(initial?.name || "");
  const [dose, setDose] = useState(initial?.dose || "");
  const [when, setWhen] = useState(initial?.when || "");
  const [icon, setIcon] = useState(initial?.icon || "💊");

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="w-full max-w-[540px] rounded-t-2xl p-5"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[0.85rem] font-bold mb-4" style={{ color: "var(--text)" }}>
          {initial ? "Editar suplemento" : t("supps.addNew")}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className="w-9 h-9 rounded-lg text-lg flex items-center justify-center cursor-pointer border"
              style={{
                background: icon === ic ? "var(--accent-soft)" : "var(--bg-elevated)",
                borderColor: icon === ic ? "var(--accent)" : "transparent",
              }}
            >
              {ic}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder={t("supps.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-2"
        />
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input type="text" placeholder={t("supps.dose")} value={dose} onChange={(e) => setDose(e.target.value)} />
          <input type="text" placeholder={t("supps.when")} value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>

        <div className="flex gap-2">
          {onDelete && (
            <button onClick={onDelete} className="py-2.5 px-4 rounded-xl border-none cursor-pointer text-sm font-bold" style={{ background: "#FF3B3022", color: "#FF3B30" }}>
              {t("supps.delete")}
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold" style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            Cancelar
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave({ id: initial?.id || `supp-${Date.now()}`, name: name.trim(), dose: dose.trim(), when: when.trim(), icon, active: true, reminderTime: initial?.reminderTime })}
            className="flex-[2] py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm"
            style={{ background: "var(--accent)", opacity: name.trim() ? 1 : 0.5 }}
          >
            {t("supps.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
