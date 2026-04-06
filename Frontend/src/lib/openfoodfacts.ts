// Open Food Facts API client (7.7 + 7.8)

export interface OFFProduct {
  code: string;
  product_name: string;
  brands?: string;
  image_front_small_url?: string;
  nutriments: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
  nutriments_serving?: {
    "energy-kcal_serving"?: number;
    proteins_serving?: number;
    carbohydrates_serving?: number;
    fat_serving?: number;
  };
}

export interface FoodItem {
  code: string;
  name: string;
  brand: string;
  image?: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number; // mg
    sugar: number;
  };
  servingSize?: string;
  servingGrams?: number;
}

function parseProduct(p: any): FoodItem | null {
  if (!p.product_name) return null;
  const n = p.nutriments || {};
  return {
    code: p.code || "",
    name: p.product_name || "?",
    brand: p.brands || "",
    image: p.image_front_small_url,
    per100g: {
      calories: Math.round(n["energy-kcal_100g"] || 0),
      protein: Math.round((n.proteins_100g || 0) * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      fat: Math.round((n.fat_100g || 0) * 10) / 10,
      fiber: Math.round((n.fiber_100g || 0) * 10) / 10,
      sodium: Math.round(((n.sodium_100g || 0) * 1000) * 10) / 10, // convert g to mg
      sugar: Math.round((n.sugars_100g || 0) * 10) / 10,
    },
    servingSize: p.serving_size,
    servingGrams: p.serving_quantity,
  };
}

/** Search foods on Open Food Facts. Returns max 20 results. */
export async function searchFoods(query: string, page = 1): Promise<FoodItem[]> {
  if (!query.trim()) return [];
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&page=${page}&fields=code,product_name,brands,image_front_small_url,nutriments,serving_size,serving_quantity`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MarkPT/1.0 (fitness app)" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map(parseProduct).filter(Boolean) as FoodItem[];
  } catch {
    return [];
  }
}

/** Look up a product by barcode */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  const cleanCode = barcode.replace(/\D/g, "");
  if (!cleanCode) return null;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json?fields=code,product_name,brands,image_front_small_url,nutriments,serving_size,serving_quantity`,
      { headers: { "User-Agent": "MarkPT/1.0 (fitness app)" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1) return null;
    return parseProduct(data.product);
  } catch {
    return null;
  }
}

/** Calculate macros for a given gram amount based on per-100g values */
export function calcMacros(food: FoodItem, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.per100g.calories * factor),
    protein: Math.round(food.per100g.protein * factor * 10) / 10,
    carbs: Math.round(food.per100g.carbs * factor * 10) / 10,
    fat: Math.round(food.per100g.fat * factor * 10) / 10,
    fiber: Math.round(food.per100g.fiber * factor * 10) / 10,
    sodium: Math.round(food.per100g.sodium * factor),
    sugar: Math.round(food.per100g.sugar * factor * 10) / 10,
  };
}
