// Meal Prep & Auto Shopping List generation (Phase 6.3)

import {
  type SelectedMeal,
  type CustomMeal,
  type ShoppingItem,
  getMealPrepList,
  saveMealPrepList,
} from "@/lib/storage";
import { CHILEAN_FOODS } from "@/data/chilean-foods";

interface MealForPrep {
  name: string;
  servings: number; // how many times this week
}

/** Estimate shopping ingredients from a list of meals planned for the week */
export function generateShoppingList(
  planMeals: SelectedMeal[],
  customMeals: CustomMeal[],
  days: number = 7,
): ShoppingItem[] {
  // Count occurrences of each food
  const counts = new Map<string, number>();
  for (const m of planMeals) {
    counts.set(m.name, (counts.get(m.name) || 0) + 1);
  }
  for (const m of customMeals) {
    counts.set(m.name, (counts.get(m.name) || 0) + 1);
  }

  const items: ShoppingItem[] = [];

  counts.forEach((count, name) => {
    // Try to match to a Chilean food for category info
    const cleanName = name.split("—")[0].split("(")[0].trim().toLowerCase();
    const match = CHILEAN_FOODS.find(
      (f) => f.name.toLowerCase().includes(cleanName) || cleanName.includes(f.name.toLowerCase()),
    );

    items.push({
      name: name.split("—")[0].trim(),
      quantity: count,
      unit: "porciones",
      category: match?.category || "otros",
      checked: false,
    });
  });

  // Sort by category then name
  items.sort((a, b) => {
    if (a.category !== b.category) return (a.category || "").localeCompare(b.category || "");
    return a.name.localeCompare(b.name);
  });

  return items;
}

/** Merge new items into existing shopping list, preserving checked state */
export function mergeShoppingList(existing: ShoppingItem[], generated: ShoppingItem[]): ShoppingItem[] {
  const result: ShoppingItem[] = [];
  const existingMap = new Map<string, ShoppingItem>();
  for (const item of existing) {
    existingMap.set(item.name.toLowerCase(), item);
  }

  for (const item of generated) {
    const key = item.name.toLowerCase();
    const prev = existingMap.get(key);
    result.push({
      ...item,
      checked: prev?.checked || false,
    });
    existingMap.delete(key);
  }

  // Keep manually-added items
  for (const remaining of existingMap.values()) {
    result.push(remaining);
  }

  return result;
}

/** Generate shopping list from multiple days of nutrition data and save */
export function generateAndSavePrepList(
  weekMeals: SelectedMeal[],
  weekCustom: CustomMeal[],
): ShoppingItem[] {
  const existing = getMealPrepList();
  const generated = generateShoppingList(weekMeals, weekCustom);
  const merged = mergeShoppingList(existing, generated);
  saveMealPrepList(merged);
  return merged;
}

/** Get weekly meal summary for prep planning */
export function getMealPrepSummary(
  weekMeals: SelectedMeal[],
  weekCustom: CustomMeal[],
): MealForPrep[] {
  const counts = new Map<string, number>();
  for (const m of [...weekMeals, ...weekCustom]) {
    const name = m.name.split("—")[0].trim();
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, servings]) => ({ name, servings }))
    .sort((a, b) => b.servings - a.servings);
}
