export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  prep: string;
  prepTime: string;
  tags: string[];
}

export interface MealSlot {
  slot: string;
  time: string;
  options: Meal[];
}

export const macroTargets = {
  calories: 2300,
  protein: 170,
  carbs: 230,
  fat: 77,
  water: 3.0,
  note: "Déficit de 500 kcal vs TDEE (2810). Proteína alta (2.1g/kg) para preservar masa muscular en recomposición.",
};

export const mealPlan: MealSlot[] = [
  {
    slot: "Desayuno",
    time: "5:00–5:30 (L/M) · 8:00–9:00 (otros días)",
    options: [
      {
        name: "Huevos + Pan + Plátano",
        calories: 650,
        protein: 38,
        carbs: 62,
        fat: 28,
        ingredients: [
          "4 huevos enteros",
          "2 rebanadas de pan (integral si hay)",
          "1 plátano",
          "1 vaso de leche (250ml)",
        ],
        prep: "Revolver los 4 huevos en sartén con un poco de aceite. Tostar el pan. Comer plátano aparte. Leche fría o tibia.",
        prepTime: "5 min",
        tags: ["rápido", "favorito"],
      },
      {
        name: "Avena Proteica",
        calories: 580,
        protein: 35,
        carbs: 72,
        fat: 16,
        ingredients: [
          "80g avena",
          "300ml leche",
          "2 huevos duros",
          "1 manzana",
          "Canela al gusto",
        ],
        prep: "Avena + leche en olla a fuego medio 3 min (o microondas 2 min). Agregar canela. Los huevos hervir la noche anterior — pelar y comer aparte. Manzana de postre.",
        prepTime: "5 min (huevos pre-hechos)",
        tags: ["prep nocturno", "fácil"],
      },
      {
        name: "Arroz Reciclado + Atún + Huevo",
        calories: 620,
        protein: 46,
        carbs: 58,
        fat: 20,
        ingredients: [
          "150g arroz cocido (del día anterior)",
          "1 lata de atún en agua (escurrida)",
          "2 huevos",
          "Sal, pimienta",
        ],
        prep: "Calentar arroz en sartén. Agregar atún y mezclar. Hacer 2 huevos fritos encima. Sal y pimienta.",
        prepTime: "5 min",
        tags: ["rápido", "reciclado", "alto en proteína"],
      },
    ],
  },
  {
    slot: "Almuerzo",
    time: "13:00–14:00",
    options: [
      {
        name: "Arroz + Doble Atún",
        calories: 640,
        protein: 52,
        carbs: 68,
        fat: 14,
        ingredients: [
          "200g arroz cocido",
          "2 latas de atún en agua",
          "1 cucharada aceite de oliva",
          "Limón, sal",
          "Tomate si hay",
        ],
        prep: "Cocinar arroz (o recalentar). Escurrir atún, mezclar con aceite de oliva y limón. Servir sobre arroz. Tomate al costado.",
        prepTime: "10 min (o 2 min si hay arroz hecho)",
        tags: ["alto en proteína", "básico"],
      },
      {
        name: "Arroz + 4 Huevos Revueltos",
        calories: 620,
        protein: 32,
        carbs: 64,
        fat: 24,
        ingredients: [
          "200g arroz cocido",
          "4 huevos",
          "Aceite para cocinar",
          "Sal, pimienta",
        ],
        prep: "Revolver 4 huevos en sartén. Servir sobre arroz. Agregar cualquier verdura que haya en la casa.",
        prepTime: "5 min",
        tags: ["rápido", "favorito"],
      },
      {
        name: "Comida de Mamá + Extra Proteína",
        calories: 700,
        protein: 40,
        carbs: 70,
        fat: 26,
        ingredients: [
          "Lo que dejó mamá (porción normal)",
          "+ 2 huevos duros o 1 lata de atún EXTRA",
        ],
        prep: "Recalentar lo de mamá. SIEMPRE agregar proteína extra si el plato principal no tiene suficiente. 2 huevos duros son lo más fácil.",
        prepTime: "3 min",
        tags: ["fin de semana", "entre semana variable"],
      },
      {
        name: "Lasaña (cuando hay)",
        calories: 750,
        protein: 35,
        carbs: 65,
        fat: 35,
        ingredients: [
          "Porción de lasaña de mamá",
          "+ 1 vaso de leche",
        ],
        prep: "Recalentar. Acompañar con leche para sumar proteína.",
        prepTime: "3 min",
        tags: ["favorito", "especial"],
      },
    ],
  },
  {
    slot: "Cena",
    time: "20:00–21:00 (NO SALTARSE — NO NEGOTIABLE)",
    options: [
      {
        name: "Huevos Revueltos + Arroz Express",
        calories: 520,
        protein: 30,
        carbs: 48,
        fat: 22,
        ingredients: [
          "3 huevos",
          "150g arroz cocido",
          "Sal, pimienta",
          "Aceite mínimo",
        ],
        prep: "Calentar arroz. Revolver 3 huevos en sartén. Combinar. 5 minutos, sin excusas.",
        prepTime: "5 min",
        tags: ["rápido", "mínimo esfuerzo"],
      },
      {
        name: "Atún con Papas Hervidas",
        calories: 480,
        protein: 38,
        carbs: 52,
        fat: 10,
        ingredients: [
          "300g papas (2-3 medianas)",
          "1 lata de atún",
          "Limón, sal",
        ],
        prep: "CÓMO HACER PAPAS: Pelar, cortar en cubos de 3cm, poner en olla con agua y sal. Hervir 15-20 min hasta que un tenedor entre fácil. Escurrir. Servir con atún, limón y sal. Así de simple.",
        prepTime: "20 min (hervir papas)",
        tags: ["nuevo", "aprender"],
      },
      {
        name: "Arroz Frito con Huevo y Atún",
        calories: 560,
        protein: 40,
        carbs: 56,
        fat: 18,
        ingredients: [
          "200g arroz cocido (del almuerzo o anterior)",
          "2 huevos",
          "1 lata de atún",
          "Aceite, sal, pimienta",
        ],
        prep: "Aceite caliente en sartén. Revolver huevos 30s. Agregar arroz y atún. Mezclar 2 min a fuego alto. Listo.",
        prepTime: "5 min",
        tags: ["rápido", "reciclado"],
      },
    ],
  },
  {
    slot: "Snacks (distribuir en el día)",
    time: "Entre comidas",
    options: [
      {
        name: "Plátano + Leche",
        calories: 255,
        protein: 10,
        carbs: 38,
        fat: 6,
        ingredients: ["1 plátano", "250ml leche"],
        prep: "Pelar y comer. Vaso de leche.",
        prepTime: "0 min",
        tags: ["portátil"],
      },
      {
        name: "2 Huevos Duros",
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
        ingredients: ["2 huevos"],
        prep: "Hervir 5-6 huevos el domingo. Guardar en la nevera. Comer 2 cuando necesites proteína rápida.",
        prepTime: "0 min (pre-hechos)",
        tags: ["meal prep", "proteína rápida"],
      },
      {
        name: "Manzana + Puñado de Maní",
        calories: 260,
        protein: 8,
        carbs: 30,
        fat: 14,
        ingredients: ["1 manzana", "30g maní (un puñado)"],
        prep: "Comer.",
        prepTime: "0 min",
        tags: ["portátil"],
      },
      {
        name: "Avena Rápida con Leche",
        calories: 320,
        protein: 14,
        carbs: 48,
        fat: 8,
        ingredients: ["50g avena", "250ml leche"],
        prep: "Microondas 1.5 min o olla 2 min.",
        prepTime: "2 min",
        tags: ["cuando falta calorías"],
      },
    ],
  },
];

export const weeklyShoppingList = [
  { item: "Huevos", quantity: "30 unidades (1 maple)", notes: "Base de tu proteína. No escatimes." },
  { item: "Atún en agua (latas)", quantity: "10–12 latas", notes: "Buscar las más baratas. Escurrir siempre." },
  { item: "Arroz", quantity: "2 kg", notes: "Cocinar de a bastante y guardar en la nevera." },
  { item: "Leche entera", quantity: "3–4 litros", notes: "Proteína + calorías fáciles. Si te cae mal, semidesnatada." },
  { item: "Avena", quantity: "500g–1kg", notes: "Desayuno o snack. Barata y llena." },
  { item: "Plátanos", quantity: "7–10", notes: "1 por día mínimo. Potasio + carbohidrato rápido." },
  { item: "Manzanas", quantity: "5–7", notes: "Snack portátil." },
  { item: "Pan (integral si puede)", quantity: "1 paquete", notes: "Para desayuno." },
  { item: "Papas", quantity: "1.5–2 kg", notes: "APRENDE A HACERLAS. 300g = una cena." },
  { item: "Maní (sin sal si puede)", quantity: "200g", notes: "Snack. Grasas saludables. No comer el paquete entero." },
  { item: "Aceite de oliva", quantity: "1 botella", notes: "Para cocinar y aliñar. Poco — es calórico." },
  { item: "Limones", quantity: "3–4", notes: "Para atún y papas." },
  { item: "Sal, pimienta", quantity: "Tener en casa", notes: "" },
];

export const supplementPlan = [
  {
    name: "Citrato de Potasio",
    dose: "600mg/día",
    when: "Con comida",
    status: "actual",
    notes: "Ya lo tomas. Mantener mientras dure el envase. Bueno post-isotretinoína.",
  },
  {
    name: "Vitamina C",
    dose: "1000mg/día",
    when: "Con desayuno",
    status: "actual",
    notes: "Ya lo tomas. Bueno para inmunidad y piel post-tratamiento. Mantener.",
  },
  {
    name: "Creatina Monohidrato",
    dose: "5g/día todos los días",
    when: "Con cualquier comida (no importa cuándo)",
    status: "AGREGAR",
    notes: "Suplemento más estudiado del mundo. +1-2kg de fuerza en primeras semanas, mejora recuperación, evidencia en hipertrofia. Buscar creatina monohidrato pura, la más barata sirve. NO necesitas fase de carga.",
  },
  {
    name: "Vitamina D3",
    dose: "2000–4000 IU/día",
    when: "Con comida que tenga grasa",
    status: "AGREGAR",
    notes: "Abril = otoño en Chile. Menos sol. Vitamina D afecta testosterona, energía, inmunidad. Tomar con almuerzo o cena.",
  },
  {
    name: "Whey Protein",
    dose: "1 scoop (25-30g proteína) cuando no llegues a 170g con comida",
    when: "Post-entreno o con snack",
    status: "RECOMENDADO",
    notes: "Con tus habilidades de cocina y estilo de vida, vas a necesitar esto para llegar a tu target de proteína. No es obligatorio si comes 3 comidas sólidas con 40g+ proteína cada una. Pero seamos realistas.",
  },
];

export const cookingLessons = [
  {
    title: "Papas Hervidas",
    difficulty: "Fácil",
    time: "20 min",
    steps: [
      "Pelar 2-3 papas medianas (300g)",
      "Cortar en cubos de 3cm",
      "Poner en olla con agua fría + 1 cda sal",
      "Fuego alto hasta hervir, luego medio",
      "15-20 min — probar con tenedor (si entra fácil, listo)",
      "Escurrir agua",
      "Sal, pimienta, un chorro de aceite de oliva o limón",
    ],
  },
  {
    title: "Pollo a la Sartén (así de fácil)",
    difficulty: "Fácil",
    time: "15 min",
    steps: [
      "Comprar pechugas de pollo (aprox 200g por porción)",
      "Secar con papel de cocina (IMPORTANTE — si está mojado no se dora)",
      "Sal y pimienta ambos lados",
      "Sartén a fuego medio-alto con 1 cda de aceite",
      "Cuando el aceite esté caliente, poner la pechuga",
      "NO TOCAR por 5-6 minutos (que se dore)",
      "Dar vuelta. 5-6 minutos más",
      "Cortar en el medio para verificar — no debe estar rosa",
      "Listo. Servir con arroz, papas, lo que sea",
    ],
  },
  {
    title: "Huevos Duros (batch para la semana)",
    difficulty: "Fácil",
    time: "12 min",
    steps: [
      "Poner 6 huevos en olla con agua fría (que los cubra)",
      "Fuego alto hasta hervir",
      "Cuando hierva, bajar a medio. 10 minutos.",
      "Sacar y meter en agua fría 5 min",
      "Guardar en la nevera con cáscara",
      "Duran 5-7 días. Pelar cuando vayas a comer.",
    ],
  },
  {
    title: "Arroz para 3 días",
    difficulty: "Fácil",
    time: "20 min",
    steps: [
      "2 tazas de arroz + 4 tazas de agua + 1 cda sal",
      "Fuego alto hasta hervir",
      "Bajar a fuego mínimo, tapar",
      "15-18 min sin destapar",
      "Apagar, dejar tapado 5 min más",
      "Guardar en tupper en la nevera. Rinde 3 días.",
    ],
  },
];
