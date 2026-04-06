"use client";

import { useState, useCallback } from "react";
import {
  X, Plus, Trash2, Search, Loader2, Save, ChefHat,
} from "lucide-react";
import { searchFoods, calcMacros, type FoodItem } from "@/lib/openfoodfacts";
import { searchChileanFoods } from "@/data/chilean-foods";
import {
  type Recipe, type RecipeIngredient, calculateRecipeMacros,
  generateId, getRecipes, saveRecipe, deleteRecipe,
} from "@/lib/storage";

interface Props {
  open: boolean;
  onClose: () => void;
  onUseRecipe?: (recipe: Recipe) => void;
  editRecipe?: Recipe | null;
}

export default function RecipeBuilder({ open, onClose, onUseRecipe, editRecipe }: Props) {
  const [name, setName] = useState(editRecipe?.name || "");
  const [servings, setServings] = useState(editRecipe?.servings || 1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(editRecipe?.ingredients || []);
  const [instructions, setInstructions] = useState(editRecipe?.instructions || "");
  const [prepTime, setPrepTime] = useState(editRecipe?.prepTime || 0);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [addingGrams, setAddingGrams] = useState<{ food: FoodItem; grams: string } | null>(null);

  const [saved, setSaved] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    // Search Chilean foods first (local, fast)
    const localResults = searchChileanFoods(q, 10).map((f): FoodItem => ({
      code: f.id,
      name: f.name,
      brand: "🇨🇱 Local",
      per100g: f.per100g,
      servingSize: f.servingSize,
      servingGrams: f.servingGrams,
    }));
    // Then API
    const apiResults = await searchFoods(q);
    setSearchResults([...localResults, ...apiResults.slice(0, 10)]);
    setSearching(false);
  }, []);

  function handleSearchInput(val: string) {
    setSearchQuery(val);
    if (val.length >= 2) {
      const timer = setTimeout(() => doSearch(val), 400);
      return () => clearTimeout(timer);
    }
  }

  function selectFood(food: FoodItem) {
    setAddingGrams({ food, grams: String(food.servingGrams || 100) });
  }

  function confirmAddIngredient() {
    if (!addingGrams) return;
    const g = parseFloat(addingGrams.grams) || 100;
    const macros = calcMacros(addingGrams.food, g);
    const ingredient: RecipeIngredient = {
      name: addingGrams.food.name,
      grams: g,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      fiber: macros.fiber,
      sodium: macros.sodium,
      sugar: macros.sugar,
    };
    setIngredients((prev) => [...prev, ingredient]);
    setAddingGrams(null);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!name.trim() || ingredients.length === 0) return;
    const recipe: Recipe = {
      id: editRecipe?.id || generateId(),
      name: name.trim(),
      servings: Math.max(servings, 1),
      ingredients,
      instructions: instructions.trim() || undefined,
      prepTime: prepTime > 0 ? prepTime : undefined,
      createdAt: editRecipe?.createdAt || new Date().toISOString(),
    };
    saveRecipe(recipe);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  }

  const totals = calculateRecipeMacros(ingredients, servings);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
          <X size={20} />
        </button>
        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
          {editRecipe ? "Editar receta" : "Nueva receta"}
        </span>
        <button
          onClick={handleSave}
          disabled={!name.trim() || ingredients.length === 0}
          className="bg-transparent border-none cursor-pointer p-1 disabled:opacity-40"
          style={{ color: "var(--accent)" }}
        >
          {saved ? <ChefHat size={20} /> : <Save size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Name + basic info */}
        <input
          type="text"
          placeholder="Nombre de la receta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-base font-bold mb-3 py-2 px-3 rounded-lg border"
          style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
        />

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-[0.65rem] mb-1" style={{ color: "var(--text-muted)" }}>Porciones</label>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              className="w-full py-2 px-3 rounded-lg text-sm border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[0.65rem] mb-1" style={{ color: "var(--text-muted)" }}>Tiempo (min)</label>
            <input
              type="number"
              min={0}
              value={prepTime || ""}
              onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
              placeholder="Opcional"
              className="w-full py-2 px-3 rounded-lg text-sm border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: "var(--text)" }}>Ingredientes</span>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1 text-xs font-medium bg-transparent border-none cursor-pointer"
            style={{ color: "var(--accent)" }}
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        {ingredients.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Agrega ingredientes para tu receta
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 mb-4">
            {ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                    {ing.name}
                  </div>
                  <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                    {ing.grams}g — {ing.calories} kcal · P{ing.protein} · C{ing.carbs} · G{ing.fat}
                  </div>
                </div>
                <button
                  onClick={() => removeIngredient(i)}
                  className="bg-transparent border-none cursor-pointer p-1 ml-2 flex-shrink-0"
                  style={{ color: "#FF3B30" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Totals per serving */}
        {ingredients.length > 0 && (
          <div
            className="rounded-xl p-3 mb-4"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div className="text-[0.65rem] font-bold mb-2" style={{ color: "var(--text-muted)" }}>
              Por porción ({servings} {servings === 1 ? "porción" : "porciones"})
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Kcal", value: totals.calories, color: "var(--accent)" },
                { label: "Prot", value: `${totals.protein}g`, color: "#34C759" },
                { label: "Carbs", value: `${totals.carbs}g`, color: "#FFCC00" },
                { label: "Grasa", value: `${totals.fat}g`, color: "#AF52DE" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-sm font-black" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
            {(totals.fiber > 0 || totals.sodium > 0 || totals.sugar > 0) && (
              <div className="flex gap-3 mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  Fibra: {totals.fiber}g
                </span>
                <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  Sodio: {totals.sodium}mg
                </span>
                <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  Azúcar: {totals.sugar}g
                </span>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
          Instrucciones (opcional)
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Pasos de preparación..."
          rows={4}
          className="w-full py-2 px-3 rounded-lg text-xs border resize-none"
          style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
        />
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: "var(--bg)" }}>
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <button onClick={() => { setShowSearch(false); setAddingGrams(null); }} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
              <X size={18} />
            </button>
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar ingrediente..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                autoFocus
                className="w-full py-2 pl-9 pr-3 rounded-lg text-sm border"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
              />
            </div>
          </div>

          {addingGrams ? (
            <div className="px-4 pt-4">
              <div className="rounded-xl p-4" style={{ background: "var(--bg-card)" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>{addingGrams.food.name}</p>
                <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
                  Por 100g: {addingGrams.food.per100g.calories} kcal · P{addingGrams.food.per100g.protein} · C{addingGrams.food.per100g.carbs} · G{addingGrams.food.per100g.fat}
                </p>
                <label className="block text-[0.65rem] mb-1" style={{ color: "var(--text-muted)" }}>Cantidad (gramos)</label>
                <input
                  type="number"
                  value={addingGrams.grams}
                  onChange={(e) => setAddingGrams({ ...addingGrams, grams: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg text-sm border mb-3"
                  style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
                />
                <button
                  onClick={confirmAddIngredient}
                  className="w-full py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm"
                  style={{ background: "var(--accent)" }}
                >
                  Agregar ingrediente
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 pt-2">
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
                </div>
              )}
              {searchResults.map((food, i) => (
                <button
                  key={`${food.code}-${i}`}
                  onClick={() => selectFood(food)}
                  className="w-full text-left py-2.5 px-3 rounded-lg mb-1 border-none cursor-pointer"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div className="text-xs font-medium" style={{ color: "var(--text)" }}>
                    {food.name}
                    {food.brand && <span className="ml-1" style={{ color: "var(--text-muted)" }}>({food.brand})</span>}
                  </div>
                  <div className="text-[0.6rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {food.per100g.calories} kcal/100g · P{food.per100g.protein} · C{food.per100g.carbs} · G{food.per100g.fat}
                  </div>
                </button>
              ))}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-center text-xs py-6" style={{ color: "var(--text-muted)" }}>
                  No se encontraron ingredientes
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === Recipe List Sub-component ===

export function RecipeList({ onUse, onEdit }: { onUse?: (r: Recipe) => void; onEdit?: (r: Recipe) => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>(getRecipes);

  function handleDelete(id: string) {
    deleteRecipe(id);
    setRecipes(getRecipes());
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-8">
        <ChefHat size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Aún no tienes recetas guardadas
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {recipes.map((recipe) => {
        const macros = calculateRecipeMacros(recipe.ingredients, recipe.servings);
        return (
          <div
            key={recipe.id}
            className="rounded-xl p-3"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{ color: "var(--text)" }}>{recipe.name}</div>
                <div className="text-[0.6rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {recipe.ingredients.length} ingredientes · {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}
                  {recipe.prepTime ? ` · ${recipe.prepTime} min` : ""}
                </div>
                <div className="text-[0.6rem] mt-1" style={{ color: "var(--text-muted)" }}>
                  {macros.calories} kcal · P{macros.protein}g · C{macros.carbs}g · G{macros.fat}g /porción
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                {onUse && (
                  <button
                    onClick={() => onUse(recipe)}
                    className="text-[0.6rem] font-bold px-2 py-1 rounded-md border-none cursor-pointer"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Usar
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(recipe)}
                    className="text-[0.6rem] px-2 py-1 rounded-md border cursor-pointer bg-transparent"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="bg-transparent border-none cursor-pointer p-1"
                  style={{ color: "#FF3B30" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
