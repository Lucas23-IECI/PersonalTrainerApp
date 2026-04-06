// Base de datos offline de alimentos chilenos (~300 items)
// Macros per 100g: [cal, protein, carbs, fat, fiber, sodium_mg, sugar]
// Focused on Concepción / Hualqui region — affordable, accessible foods

export type FoodCategory =
  | "proteínas"
  | "cereales"
  | "frutas"
  | "verduras"
  | "lácteos"
  | "legumbres"
  | "pan"
  | "aceites"
  | "bebidas"
  | "snacks"
  | "platos"
  | "condimentos"
  | "frutos_secos";

export interface ChileanFood {
  id: string;
  name: string;
  category: FoodCategory;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number; // mg
    sugar: number;
  };
  servingSize: string;
  servingGrams: number;
}

// Compact tuple format: [name, category, cal, prot, carbs, fat, fiber, sodium, sugar, serving, servG]
type FoodTuple = [string, FoodCategory, number, number, number, number, number, number, number, string, number];

const RAW: FoodTuple[] = [
  // ═══════════════════ PROTEÍNAS ═══════════════════
  ["Pollo pechuga sin piel", "proteínas", 165, 31, 0, 3.6, 0, 74, 0, "1 presa (150g)", 150],
  ["Pollo muslo con piel", "proteínas", 209, 26, 0, 11, 0, 84, 0, "1 muslo (120g)", 120],
  ["Pollo ala", "proteínas", 203, 30, 0, 8, 0, 82, 0, "2 alas (100g)", 100],
  ["Pollo molido", "proteínas", 143, 17, 0, 8, 0, 70, 0, "100g", 100],
  ["Carne vacuno bistec", "proteínas", 271, 26, 0, 18, 0, 63, 0, "1 bistec (150g)", 150],
  ["Carne molida 10% grasa", "proteínas", 176, 20, 0, 10, 0, 66, 0, "100g", 100],
  ["Carne molida 20% grasa", "proteínas", 254, 17, 0, 20, 0, 66, 0, "100g", 100],
  ["Lomo vetado", "proteínas", 291, 24, 0, 21, 0, 55, 0, "1 filete (180g)", 180],
  ["Cerdo chuleta", "proteínas", 231, 25, 0, 14, 0, 62, 0, "1 chuleta (130g)", 130],
  ["Cerdo lomo", "proteínas", 143, 26, 0, 3.5, 0, 48, 0, "1 filete (150g)", 150],
  ["Cerdo costillar", "proteínas", 277, 24, 0, 20, 0, 56, 0, "1 trozo (150g)", 150],
  ["Pavo pechuga", "proteínas", 135, 30, 0, 1, 0, 46, 0, "1 filete (150g)", 150],
  ["Cordero pierna", "proteínas", 258, 25, 0, 17, 0, 72, 0, "1 trozo (150g)", 150],
  ["Huevo entero", "proteínas", 155, 13, 1.1, 11, 0, 124, 1.1, "1 unidad (60g)", 60],
  ["Clara de huevo", "proteínas", 52, 11, 0.7, 0.2, 0, 166, 0.7, "3 claras (100g)", 100],
  ["Atún en agua (lata)", "proteínas", 116, 26, 0, 0.8, 0, 332, 0, "1 lata (160g)", 160],
  ["Atún en aceite (lata)", "proteínas", 198, 29, 0, 8, 0, 396, 0, "1 lata (160g)", 160],
  ["Salmón fresco", "proteínas", 208, 20, 0, 13, 0, 59, 0, "1 filete (150g)", 150],
  ["Merluza", "proteínas", 90, 18, 0, 1.3, 0, 86, 0, "1 filete (170g)", 170],
  ["Reineta", "proteínas", 105, 20, 0, 2.5, 0, 70, 0, "1 filete (170g)", 170],
  ["Jurel (lata)", "proteínas", 190, 21, 0, 12, 0, 390, 0, "1 lata (170g)", 170],
  ["Sardinas en aceite", "proteínas", 208, 25, 0, 11, 0, 505, 0, "1 lata (125g)", 125],
  ["Choritos (mejillones)", "proteínas", 172, 24, 7, 4.5, 0, 369, 0, "1 taza (150g)", 150],
  ["Camarón cocido", "proteínas", 99, 24, 0.2, 0.3, 0, 111, 0, "100g", 100],
  ["Longaniza", "proteínas", 320, 14, 2, 29, 0, 870, 0, "1 unidad (100g)", 100],
  ["Vienesa", "proteínas", 290, 11, 3, 26, 0, 1050, 1, "2 unidades (100g)", 100],
  ["Jamón de pavo", "proteínas", 110, 18, 2, 3, 0, 940, 1, "3 fetas (50g)", 50],
  ["Jamón cerdo", "proteínas", 145, 21, 1.5, 6, 0, 1203, 0, "3 fetas (50g)", 50],
  ["Tocino", "proteínas", 541, 37, 1.4, 42, 0, 1717, 0, "3 tiras (30g)", 30],
  ["Proteína whey (polvo)", "proteínas", 375, 80, 6, 3, 0, 160, 3, "1 scoop (30g)", 30],

  // ═══════════════════ CEREALES Y GRANOS ═══════════════════
  ["Arroz blanco cocido", "cereales", 130, 2.7, 28, 0.3, 0.4, 1, 0, "1 taza (158g)", 158],
  ["Arroz integral cocido", "cereales", 123, 2.7, 26, 1, 1.8, 1, 0, "1 taza (158g)", 158],
  ["Fideos cocidos", "cereales", 157, 5.8, 31, 0.9, 1.8, 1, 0.6, "1 plato (200g)", 200],
  ["Fideos integrales cocidos", "cereales", 124, 5.3, 25, 0.5, 3.9, 3, 0.6, "1 plato (200g)", 200],
  ["Avena instantánea", "cereales", 379, 13, 68, 7, 10, 6, 1, "½ taza (40g)", 40],
  ["Quinoa cocida", "cereales", 120, 4.4, 21, 1.9, 2.8, 7, 0.9, "1 taza (185g)", 185],
  ["Cuscús cocido", "cereales", 112, 3.8, 23, 0.2, 1.4, 5, 0.1, "1 taza (160g)", 160],
  ["Maicena", "cereales", 381, 0.3, 91, 0.1, 0.9, 9, 0, "1 cda (10g)", 10],
  ["Harina trigo", "cereales", 364, 10, 76, 1, 2.7, 2, 0.3, "1 taza (120g)", 120],
  ["Harina integral", "cereales", 340, 13, 72, 2.5, 11, 2, 0.4, "1 taza (120g)", 120],
  ["Polenta/sémola maíz", "cereales", 362, 8.1, 79, 1.2, 5, 1, 0, "¼ taza seca (40g)", 40],
  ["Mote de trigo cocido", "cereales", 140, 4.2, 29, 0.7, 3.2, 2, 0.3, "1 taza (180g)", 180],
  ["Cebada perlada cocida", "cereales", 123, 2.3, 28, 0.4, 3.8, 3, 0.3, "1 taza (157g)", 157],
  ["Granola", "cereales", 471, 10, 64, 20, 5, 26, 24, "½ taza (50g)", 50],
  ["Cereal fitness", "cereales", 378, 8, 79, 2.5, 5, 520, 17, "1 taza (40g)", 40],

  // ═══════════════════ FRUTAS ═══════════════════
  ["Plátano", "frutas", 89, 1.1, 23, 0.3, 2.6, 1, 12, "1 unidad (120g)", 120],
  ["Manzana", "frutas", 52, 0.3, 14, 0.2, 2.4, 1, 10, "1 unidad (180g)", 180],
  ["Naranja", "frutas", 47, 0.9, 12, 0.1, 2.4, 0, 9.4, "1 unidad (180g)", 180],
  ["Mandarina", "frutas", 53, 0.8, 13, 0.3, 1.8, 2, 11, "2 unidades (150g)", 150],
  ["Pera", "frutas", 57, 0.4, 15, 0.1, 3.1, 1, 10, "1 unidad (180g)", 180],
  ["Uva", "frutas", 69, 0.7, 18, 0.2, 0.9, 2, 16, "1 taza (150g)", 150],
  ["Frutilla", "frutas", 32, 0.7, 7.7, 0.3, 2, 1, 4.9, "1 taza (150g)", 150],
  ["Frambuesa", "frutas", 52, 1.2, 12, 0.7, 6.5, 1, 4.4, "1 taza (125g)", 125],
  ["Arándano", "frutas", 57, 0.7, 14, 0.3, 2.4, 1, 10, "1 taza (145g)", 145],
  ["Cereza", "frutas", 63, 1, 16, 0.2, 2.1, 0, 13, "1 taza (140g)", 140],
  ["Kiwi", "frutas", 61, 1.1, 15, 0.5, 3, 3, 9, "1 unidad (75g)", 75],
  ["Palta (aguacate)", "frutas", 160, 2, 8.5, 15, 6.7, 7, 0.7, "½ unidad (80g)", 80],
  ["Sandía", "frutas", 30, 0.6, 7.6, 0.2, 0.4, 1, 6.2, "1 tajada (280g)", 280],
  ["Melón", "frutas", 34, 0.8, 8.2, 0.2, 0.9, 16, 7.9, "1 tajada (200g)", 200],
  ["Durazno", "frutas", 39, 0.9, 10, 0.3, 1.5, 0, 8.4, "1 unidad (150g)", 150],
  ["Ciruela", "frutas", 46, 0.7, 11, 0.3, 1.4, 0, 10, "3 unidades (100g)", 100],
  ["Damasco", "frutas", 48, 1.4, 11, 0.4, 2, 1, 9.2, "3 unidades (105g)", 105],
  ["Piña", "frutas", 50, 0.5, 13, 0.1, 1.4, 1, 10, "1 rodaja (165g)", 165],
  ["Mango", "frutas", 60, 0.8, 15, 0.4, 1.6, 1, 14, "½ unidad (100g)", 100],
  ["Papaya", "frutas", 43, 0.5, 11, 0.3, 1.7, 8, 7.8, "1 taza (145g)", 145],
  ["Chirimoya", "frutas", 75, 1.6, 18, 0.7, 3, 7, 13, "½ unidad (100g)", 100],
  ["Lúcuma", "frutas", 99, 1.5, 25, 0.5, 1.3, 4, 15, "½ unidad (50g)", 50],
  ["Tuna (higo chumbo)", "frutas", 41, 0.7, 10, 0.5, 3.6, 5, 7, "2 unidades (100g)", 100],
  ["Membrillo", "frutas", 57, 0.4, 15, 0.1, 1.9, 4, 7, "1 unidad (100g)", 100],

  // ═══════════════════ VERDURAS ═══════════════════
  ["Papa cocida", "verduras", 87, 1.9, 20, 0.1, 1.8, 6, 0.8, "1 unidad (150g)", 150],
  ["Camote (batata) cocido", "verduras", 86, 1.6, 20, 0.1, 3, 36, 4.2, "1 trozo (130g)", 130],
  ["Zapallo italiano (zucchini)", "verduras", 17, 1.2, 3.1, 0.3, 1, 8, 2.5, "1 unidad (200g)", 200],
  ["Zapallo camote", "verduras", 26, 1, 6.5, 0.1, 0.5, 1, 2.8, "1 trozo (150g)", 150],
  ["Tomate", "verduras", 18, 0.9, 3.9, 0.2, 1.2, 5, 2.6, "1 unidad (125g)", 125],
  ["Lechuga", "verduras", 15, 1.4, 2.9, 0.2, 1.3, 28, 0.8, "2 tazas (100g)", 100],
  ["Espinaca", "verduras", 23, 2.9, 3.6, 0.4, 2.2, 79, 0.4, "2 tazas (60g)", 60],
  ["Acelga", "verduras", 19, 1.8, 3.7, 0.2, 1.6, 213, 1.1, "1 taza cocida (175g)", 175],
  ["Brócoli", "verduras", 34, 2.8, 7, 0.4, 2.6, 33, 1.7, "1 taza (91g)", 91],
  ["Coliflor", "verduras", 25, 1.9, 5, 0.3, 2, 30, 1.9, "1 taza (100g)", 100],
  ["Zanahoria", "verduras", 41, 0.9, 10, 0.2, 2.8, 69, 4.7, "1 unidad (70g)", 70],
  ["Cebolla", "verduras", 40, 1.1, 9.3, 0.1, 1.7, 4, 4.2, "1 unidad (110g)", 110],
  ["Ajo", "verduras", 149, 6.4, 33, 0.5, 2.1, 17, 1, "3 dientes (9g)", 9],
  ["Pimentón rojo", "verduras", 31, 1, 6, 0.3, 2.1, 4, 4.2, "1 unidad (120g)", 120],
  ["Pimentón verde", "verduras", 20, 0.9, 4.6, 0.2, 1.7, 3, 2.4, "1 unidad (120g)", 120],
  ["Choclo (maíz)", "verduras", 86, 3.3, 19, 1.2, 2.7, 15, 3.2, "1 mazorca (100g)", 100],
  ["Choclo en lata", "verduras", 64, 2.3, 14, 0.5, 1.7, 225, 3.6, "½ taza (80g)", 80],
  ["Apio", "verduras", 14, 0.7, 3, 0.2, 1.6, 80, 1.3, "2 tallos (100g)", 100],
  ["Pepino", "verduras", 16, 0.7, 3.6, 0.1, 0.5, 2, 1.7, "½ unidad (100g)", 100],
  ["Betarraga cocida", "verduras", 44, 1.7, 10, 0.2, 2, 78, 8, "1 unidad (80g)", 80],
  ["Alcachofa", "verduras", 47, 3.3, 11, 0.2, 5.4, 94, 1, "1 unidad (120g)", 120],
  ["Berenjena", "verduras", 25, 1, 6, 0.2, 3, 2, 3.5, "1 taza (82g)", 82],
  ["Champiñón", "verduras", 22, 3.1, 3.3, 0.3, 1, 5, 2, "1 taza (70g)", 70],
  ["Porotos verdes", "verduras", 31, 1.8, 7, 0.2, 2.7, 6, 3.3, "1 taza (100g)", 100],
  ["Arvejas cocidas", "verduras", 84, 5.4, 16, 0.4, 5.5, 3, 5.7, "½ taza (80g)", 80],
  ["Palmitos (lata)", "verduras", 28, 2.5, 4.6, 0.6, 2.4, 426, 0, "3 rodajas (50g)", 50],
  ["Espárrago", "verduras", 20, 2.2, 3.9, 0.1, 2.1, 2, 1.9, "5 unidades (100g)", 100],
  ["Repollo", "verduras", 25, 1.3, 6, 0.1, 2.5, 18, 3.2, "1 taza (90g)", 90],
  ["Puerro", "verduras", 61, 1.5, 14, 0.3, 1.8, 20, 3.9, "1 unidad (90g)", 90],
  ["Rábano", "verduras", 16, 0.7, 3.4, 0.1, 1.6, 39, 1.9, "5 unidades (50g)", 50],

  // ═══════════════════ LÁCTEOS ═══════════════════
  ["Leche entera", "lácteos", 61, 3.2, 4.8, 3.3, 0, 43, 5, "1 vaso (200ml)", 200],
  ["Leche descremada", "lácteos", 34, 3.4, 5, 0.1, 0, 52, 5, "1 vaso (200ml)", 200],
  ["Leche semidescremada", "lácteos", 50, 3.3, 4.9, 1.9, 0, 47, 5, "1 vaso (200ml)", 200],
  ["Yogurt natural", "lácteos", 61, 3.5, 4.7, 3.3, 0, 46, 4.7, "1 pote (170g)", 170],
  ["Yogurt griego", "lácteos", 97, 9, 3.6, 5, 0, 47, 3.6, "1 pote (170g)", 170],
  ["Yogurt batido (sabor)", "lácteos", 88, 3.3, 14, 1.8, 0, 50, 12, "1 pote (175g)", 175],
  ["Queso gauda", "lácteos", 356, 25, 2, 28, 0, 700, 0, "1 lámina (30g)", 30],
  ["Queso chanco", "lácteos", 330, 22, 1, 27, 0, 630, 0, "1 trozo (40g)", 40],
  ["Queso mantecoso", "lácteos", 340, 23, 1, 27, 0, 580, 0, "1 trozo (40g)", 40],
  ["Queso crema", "lácteos", 342, 6, 4, 34, 0, 321, 3.5, "1 cda (30g)", 30],
  ["Quesillo", "lácteos", 98, 11, 3.4, 4.3, 0, 364, 2.7, "1 trozo (80g)", 80],
  ["Ricotta", "lácteos", 174, 11, 3, 13, 0, 84, 0.3, "¼ taza (62g)", 62],
  ["Queso parmesano", "lácteos", 431, 38, 4, 29, 0, 1602, 0, "2 cdas (20g)", 20],
  ["Mantequilla", "lácteos", 717, 0.9, 0.1, 81, 0, 643, 0.1, "1 cda (14g)", 14],
  ["Crema espesa", "lácteos", 340, 2, 3, 36, 0, 34, 3, "2 cdas (30g)", 30],
  ["Leche condensada", "lácteos", 321, 8, 55, 9, 0, 128, 55, "2 cdas (40g)", 40],
  ["Manjar (dulce de leche)", "lácteos", 315, 7, 56, 8, 0, 130, 50, "2 cdas (40g)", 40],
  ["Leche evaporada", "lácteos", 134, 7, 10, 8, 0, 100, 10, "½ taza (120ml)", 120],

  // ═══════════════════ LEGUMBRES ═══════════════════
  ["Porotos (frijoles) cocidos", "legumbres", 127, 8.7, 23, 0.5, 6.4, 1, 0.3, "1 taza (170g)", 170],
  ["Lentejas cocidas", "legumbres", 116, 9, 20, 0.4, 7.9, 2, 1.8, "1 taza (198g)", 198],
  ["Garbanzos cocidos", "legumbres", 164, 8.9, 27, 2.6, 7.6, 7, 4.8, "1 taza (164g)", 164],
  ["Habas cocidas", "legumbres", 110, 7.6, 20, 0.4, 5.4, 5, 1.8, "½ taza (85g)", 85],
  ["Arvejas secas cocidas", "legumbres", 118, 8.3, 21, 0.4, 8.3, 2, 2.9, "1 taza (196g)", 196],
  ["Soja texturizada (seca)", "legumbres", 327, 50, 33, 1.2, 18, 2, 0, "¼ taza seca (30g)", 30],
  ["Tofu firme", "legumbres", 144, 17, 3, 9, 2.3, 14, 0.7, "½ block (125g)", 125],
  ["Harina de garbanzo", "legumbres", 356, 22, 58, 6, 11, 64, 11, "¼ taza (30g)", 30],
  ["Porotos negros cocidos", "legumbres", 132, 8.9, 24, 0.5, 8.7, 1, 0.3, "1 taza (172g)", 172],

  // ═══════════════════ PAN Y MASAS ═══════════════════
  ["Pan marraqueta", "pan", 280, 8, 56, 1.5, 2, 530, 3, "1 unidad (100g)", 100],
  ["Pan hallulla", "pan", 310, 7, 55, 7, 1.8, 500, 3, "1 unidad (100g)", 100],
  ["Pan integral", "pan", 250, 10, 46, 3.5, 6, 450, 4, "2 rebanadas (80g)", 80],
  ["Pan molde blanco", "pan", 267, 8, 50, 3.6, 2.4, 477, 5, "2 rebanadas (56g)", 56],
  ["Pan molde integral", "pan", 252, 12, 43, 3.5, 7, 450, 5, "2 rebanadas (56g)", 56],
  ["Pan pita", "pan", 275, 9, 56, 1.2, 2.2, 536, 1.7, "1 unidad (60g)", 60],
  ["Tortilla de trigo", "pan", 304, 8, 50, 8, 3.1, 594, 2, "1 unidad (50g)", 50],
  ["Pan frica/coliza", "pan", 275, 7, 52, 4, 2, 510, 3, "1 unidad (80g)", 80],
  ["Pan amasado", "pan", 340, 7, 50, 13, 1.5, 480, 2, "1 unidad (100g)", 100],
  ["Galletas de agua", "pan", 432, 9, 72, 12, 2.4, 675, 3, "5 unidades (30g)", 30],
  ["Galletas de soda", "pan", 428, 10, 74, 10, 2.6, 880, 5, "5 unidades (30g)", 30],
  ["Tostadas integrales", "pan", 395, 11, 67, 8, 7, 580, 5, "2 tostadas (20g)", 20],

  // ═══════════════════ ACEITES Y GRASAS ═══════════════════
  ["Aceite de oliva", "aceites", 884, 0, 0, 100, 0, 2, 0, "1 cda (14ml)", 14],
  ["Aceite vegetal/maravilla", "aceites", 884, 0, 0, 100, 0, 0, 0, "1 cda (14ml)", 14],
  ["Aceite de coco", "aceites", 862, 0, 0, 100, 0, 0, 0, "1 cda (14g)", 14],
  ["Mayonesa", "aceites", 680, 1, 1, 75, 0, 635, 1, "1 cda (15g)", 15],
  ["Mayonesa light", "aceites", 330, 0.5, 6, 33, 0, 650, 4, "1 cda (15g)", 15],
  ["Palta (como grasa)", "aceites", 160, 2, 8.5, 15, 6.7, 7, 0.7, "¼ unidad (40g)", 40],
  ["Margarina", "aceites", 717, 0.2, 0.8, 80, 0, 751, 0, "1 cda (14g)", 14],

  // ═══════════════════ BEBIDAS ═══════════════════
  ["Agua", "bebidas", 0, 0, 0, 0, 0, 0, 0, "1 vaso (250ml)", 250],
  ["Coca-Cola", "bebidas", 42, 0, 11, 0, 0, 4, 11, "1 vaso (250ml)", 250],
  ["Coca-Cola Zero", "bebidas", 0, 0, 0, 0, 0, 5, 0, "1 vaso (250ml)", 250],
  ["Sprite", "bebidas", 40, 0, 10, 0, 0, 7, 10, "1 vaso (250ml)", 250],
  ["Fanta", "bebidas", 46, 0, 12, 0, 0, 5, 12, "1 vaso (250ml)", 250],
  ["Jugo en polvo (preparado)", "bebidas", 38, 0, 10, 0, 0, 15, 10, "1 vaso (250ml)", 250],
  ["Jugo de naranja natural", "bebidas", 45, 0.7, 10, 0.2, 0.2, 1, 8.4, "1 vaso (250ml)", 250],
  ["Néctar de fruta", "bebidas", 56, 0.2, 14, 0, 0.2, 5, 12, "1 vaso (250ml)", 250],
  ["Café solo", "bebidas", 2, 0.3, 0, 0, 0, 5, 0, "1 taza (240ml)", 240],
  ["Café con leche", "bebidas", 30, 1.6, 2.4, 1.6, 0, 22, 2.5, "1 taza (240ml)", 240],
  ["Té", "bebidas", 1, 0, 0.3, 0, 0, 3, 0, "1 taza (240ml)", 240],
  ["Milo/cocoa preparado", "bebidas", 53, 2, 8, 1.3, 0.5, 40, 6, "1 taza (250ml)", 250],
  ["Energética (Monster/Red Bull)", "bebidas", 45, 0, 11, 0, 0, 80, 11, "1 lata (250ml)", 250],
  ["Cerveza", "bebidas", 43, 0.5, 3.6, 0, 0, 4, 0, "1 lata (350ml)", 350],
  ["Vino tinto", "bebidas", 85, 0.1, 2.6, 0, 0, 4, 0.6, "1 copa (150ml)", 150],
  ["Pisco sour", "bebidas", 140, 0.5, 14, 0.1, 0.1, 3, 12, "1 vaso (150ml)", 150],

  // ═══════════════════ SNACKS Y DULCES ═══════════════════
  ["Maní tostado", "snacks", 567, 26, 16, 49, 8.5, 18, 4, "¼ taza (35g)", 35],
  ["Maní confitado", "snacks", 500, 15, 40, 30, 4, 200, 30, "¼ taza (35g)", 35],
  ["Almendras", "snacks", 579, 21, 22, 50, 12.5, 1, 4.4, "¼ taza (35g)", 35],
  ["Nueces", "snacks", 654, 15, 14, 65, 6.7, 2, 2.6, "¼ taza (30g)", 30],
  ["Chocolate amargo 70%", "snacks", 598, 8, 46, 43, 11, 20, 24, "2 cuadros (25g)", 25],
  ["Chocolate leche", "snacks", 535, 8, 60, 30, 3, 79, 52, "2 cuadros (25g)", 25],
  ["Galletas chocapic/oreo", "snacks", 480, 5, 68, 21, 2.8, 340, 35, "4 galletas (40g)", 40],
  ["Papas fritas (bolsa)", "snacks", 536, 7, 53, 33, 4, 525, 0.3, "1 bolsa peq (40g)", 40],
  ["Ramitas/chizitos", "snacks", 510, 6, 55, 30, 2, 750, 2, "1 bolsa peq (40g)", 40],
  ["Barra de cereal", "snacks", 400, 6, 68, 12, 4, 150, 25, "1 barra (25g)", 25],
  ["Helado crema", "snacks", 207, 3.5, 24, 11, 0.7, 80, 21, "1 bola (66g)", 66],
  ["Helado agua (paleta)", "snacks", 100, 0.2, 25, 0.1, 0, 15, 20, "1 paleta (80g)", 80],
  ["Dulce membrillo", "snacks", 230, 0.3, 60, 0, 1, 10, 55, "1 trozo (40g)", 40],
  ["Alfajor", "snacks", 430, 5, 60, 19, 1.5, 120, 35, "1 unidad (50g)", 50],
  ["Kuchen", "snacks", 370, 5, 45, 20, 1, 200, 25, "1 trozo (80g)", 80],
  ["Caluga/caramelo", "snacks", 380, 1, 80, 5, 0, 120, 65, "3 unidades (20g)", 20],
  ["Suspiro limeño", "snacks", 260, 3.5, 40, 10, 0, 50, 38, "1 porción (80g)", 80],
  ["Mermelada", "snacks", 250, 0.4, 63, 0, 0.5, 20, 49, "1 cda (20g)", 20],
  ["Miel", "snacks", 304, 0.3, 82, 0, 0.2, 4, 82, "1 cda (21g)", 21],
  ["Azúcar", "snacks", 387, 0, 100, 0, 0, 1, 100, "1 cda (12g)", 12],

  // ═══════════════════ PLATOS CHILENOS ═══════════════════
  ["Cazuela de vacuno", "platos", 65, 5, 6, 2.2, 0.8, 280, 0.8, "1 plato (400g)", 400],
  ["Cazuela de pollo", "platos", 55, 5.5, 5, 1.5, 0.7, 260, 0.7, "1 plato (400g)", 400],
  ["Porotos granados", "platos", 95, 5, 15, 1.5, 4, 240, 2, "1 plato (350g)", 350],
  ["Porotos con rienda", "platos", 110, 6, 18, 1.5, 3.5, 280, 1.5, "1 plato (350g)", 350],
  ["Pastel de choclo", "platos", 145, 8, 14, 7, 1.5, 320, 3, "1 porción (250g)", 250],
  ["Empanada de pino (horno)", "platos", 245, 10, 28, 10, 1.5, 450, 2, "1 unidad (200g)", 200],
  ["Empanada frita de queso", "platos", 310, 9, 30, 17, 1, 380, 1, "1 unidad (120g)", 120],
  ["Sopaipilla", "platos", 280, 5, 34, 14, 1.5, 350, 1, "2 unidades (100g)", 100],
  ["Sopaipilla pasada", "platos", 310, 4, 45, 13, 1, 300, 15, "2 unidades (120g)", 120],
  ["Humitas", "platos", 160, 5, 22, 6, 2, 270, 4, "1 unidad (200g)", 200],
  ["Charquicán", "platos", 95, 6, 10, 3, 1.5, 290, 1.5, "1 plato (350g)", 350],
  ["Carbonada", "platos", 60, 4, 8, 1.5, 0.8, 250, 1, "1 plato (400g)", 400],
  ["Caldillo de congrio", "platos", 70, 7, 4, 3, 0.5, 310, 0.5, "1 plato (350g)", 350],
  ["Curanto en olla", "platos", 130, 11, 8, 6, 1, 350, 1, "1 plato (350g)", 350],
  ["Completo", "platos", 240, 8, 28, 11, 1.5, 680, 3, "1 unidad (250g)", 250],
  ["Italiano (completo)", "platos", 260, 8, 28, 13, 2, 650, 3.5, "1 unidad (270g)", 270],
  ["Choripán", "platos", 310, 12, 25, 18, 1, 780, 2, "1 unidad (200g)", 200],
  ["Lomito (sándwich)", "platos", 270, 15, 25, 12, 1, 600, 2, "1 unidad (250g)", 250],
  ["Barros Luco", "platos", 290, 16, 24, 15, 0.5, 550, 1, "1 unidad (200g)", 200],
  ["Barros Jarpa", "platos", 280, 15, 25, 14, 0.5, 620, 1, "1 unidad (200g)", 200],
  ["Churrasco/bistec a lo pobre", "platos", 200, 14, 12, 11, 0.8, 280, 1, "1 porción (300g)", 300],
  ["Arrollado huaso", "platos", 190, 16, 4, 13, 0.5, 780, 0.5, "2 rodajas (100g)", 100],
  ["Prietas (morcillas)", "platos", 379, 15, 1.3, 35, 0, 680, 0, "1 unidad (100g)", 100],
  ["Pan con palta", "platos", 220, 4.5, 24, 12, 3, 350, 2, "1 marraqueta c/palta", 140],
  ["Pan con huevo", "platos", 260, 10, 28, 11, 1, 350, 2, "1 marraqueta c/huevo", 160],
  ["Ensalada chilena", "platos", 35, 0.8, 4, 2, 1, 180, 3, "1 porción (150g)", 150],
  ["Pebre", "platos", 30, 0.8, 4, 1.5, 1.2, 280, 2, "2 cdas (40g)", 40],
  ["Chancho en piedra", "platos", 35, 0.9, 5, 1.5, 1.3, 310, 3, "2 cdas (40g)", 40],
  ["Arroz con leche", "platos", 120, 3.5, 20, 2.8, 0.2, 50, 14, "1 porción (200g)", 200],
  ["Leche asada", "platos", 150, 5, 22, 5, 0, 65, 18, "1 porción (150g)", 150],
  ["Pan de Pascua", "platos", 370, 6, 55, 14, 2, 200, 30, "1 tajada (80g)", 80],
  ["Cola de mono", "platos", 150, 3, 18, 5, 0, 40, 15, "1 vaso (200ml)", 200],
  ["Mote con huesillo", "platos", 135, 2, 32, 0.2, 1.5, 5, 25, "1 vaso (250g)", 250],
  ["Calzones rotos", "platos", 380, 5, 50, 18, 1, 200, 20, "3 unidades (80g)", 80],
  ["Picarones", "platos", 300, 4, 42, 13, 1.5, 180, 18, "3 unidades (90g)", 90],
  ["Sopa de zapallo", "platos", 45, 1, 8, 1, 1.5, 250, 3, "1 plato (300g)", 300],
  ["Tallarines con salsa", "platos", 140, 5, 22, 3.5, 1.5, 250, 3, "1 plato (300g)", 300],
  ["Arroz con pollo", "platos", 150, 10, 18, 4, 0.5, 280, 0.5, "1 plato (300g)", 300],
  ["Budín de pan", "platos", 230, 6, 35, 8, 0.5, 200, 22, "1 porción (120g)", 120],

  // ═══════════════════ CONDIMENTOS Y SALSAS ═══════════════════
  ["Ketchup", "condimentos", 112, 1.7, 26, 0.1, 0.3, 907, 22, "1 cda (17g)", 17],
  ["Mostaza", "condimentos", 60, 4, 5, 3, 3, 1135, 3, "1 cdita (5g)", 5],
  ["Salsa soja", "condimentos", 53, 8, 5, 0, 0, 5637, 0.4, "1 cda (18g)", 18],
  ["Vinagre", "condimentos", 21, 0, 0.9, 0, 0, 2, 0, "1 cda (15ml)", 15],
  ["Salsa tomate (envasada)", "condimentos", 29, 1.3, 5.8, 0.2, 1, 305, 4, "¼ taza (60g)", 60],
  ["Ají verde/cristal", "condimentos", 20, 0.5, 4, 0.3, 1, 850, 2, "1 cda (15g)", 15],
  ["Merkén", "condimentos", 314, 12, 54, 6, 28, 30, 10, "½ cdita (2g)", 2],
  ["Salsa de ostras", "condimentos", 51, 1, 11, 0, 0, 2733, 2.5, "1 cda (18g)", 18],
  ["Aceite sésamo", "condimentos", 884, 0, 0, 100, 0, 0, 0, "1 cdita (5ml)", 5],
  ["Aliño completo", "condimentos", 200, 5, 25, 8, 3, 2000, 2, "1 cdita (3g)", 3],
  ["Sal", "condimentos", 0, 0, 0, 0, 0, 38758, 0, "1 pizca (1g)", 1],
  ["Caldo en cubo", "condimentos", 250, 13, 18, 14, 0, 18000, 3, "½ cubo (5g)", 5],
  ["Maicena (para espesar)", "condimentos", 381, 0.3, 91, 0.1, 0.9, 9, 0, "1 cda (10g)", 10],

  // ═══════════════════ FRUTOS SECOS Y SEMILLAS ═══════════════════
  ["Almendras", "frutos_secos", 579, 21, 22, 50, 12.5, 1, 4.4, "¼ taza (35g)", 35],
  ["Nueces", "frutos_secos", 654, 15, 14, 65, 6.7, 2, 2.6, "¼ taza (30g)", 30],
  ["Maní tostado sin sal", "frutos_secos", 567, 26, 16, 49, 8.5, 3, 4, "¼ taza (35g)", 35],
  ["Castañas de cajú", "frutos_secos", 553, 18, 30, 44, 3.3, 12, 5.9, "¼ taza (35g)", 35],
  ["Pistachos", "frutos_secos", 560, 20, 28, 45, 10, 1, 7.7, "¼ taza (30g)", 30],
  ["Semillas de chía", "frutos_secos", 486, 17, 42, 31, 34, 16, 0, "2 cdas (24g)", 24],
  ["Semillas de linaza", "frutos_secos", 534, 18, 29, 42, 27, 30, 1.6, "2 cdas (20g)", 20],
  ["Semillas de girasol", "frutos_secos", 584, 21, 20, 51, 8.6, 9, 2.6, "¼ taza (35g)", 35],
  ["Semillas de zapallo", "frutos_secos", 559, 30, 11, 49, 6, 7, 1.4, "¼ taza (30g)", 30],
  ["Sésamo/ajonjolí", "frutos_secos", 573, 18, 23, 50, 12, 11, 0.3, "2 cdas (18g)", 18],
  ["Avellanas", "frutos_secos", 628, 15, 17, 61, 9.7, 0, 4.3, "¼ taza (35g)", 35],
  ["Pasas", "frutos_secos", 299, 3.1, 79, 0.5, 3.7, 11, 59, "¼ taza (40g)", 40],
  ["Dátiles", "frutos_secos", 277, 1.8, 75, 0.2, 6.7, 1, 66, "3 unidades (24g)", 24],
  ["Coco rallado", "frutos_secos", 660, 6, 24, 64, 16, 20, 7, "2 cdas (15g)", 15],
  ["Mantequilla de maní", "frutos_secos", 588, 25, 20, 50, 6, 459, 9, "2 cdas (32g)", 32],
];

function buildId(name: string): string {
  return "cl-" + name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const CHILEAN_FOODS: ChileanFood[] = RAW.map(
  ([name, category, cal, prot, carbs, fat, fiber, sodium, sugar, servingSize, servingGrams]) => ({
    id: buildId(name),
    name,
    category,
    per100g: { calories: cal, protein: prot, carbs, fat, fiber, sodium, sugar },
    servingSize,
    servingGrams,
  }),
);

/** Search Chilean foods by name (locale-insensitive). Returns max `limit` results. */
export function searchChileanFoods(query: string, limit = 30): ChileanFood[] {
  if (!query.trim()) return [];
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CHILEAN_FOODS.filter((f) => {
    const n = f.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return n.includes(q) || f.category.includes(q);
  }).slice(0, limit);
}

/** Get foods by category */
export function getChileanFoodsByCategory(category: FoodCategory): ChileanFood[] {
  return CHILEAN_FOODS.filter((f) => f.category === category);
}

export const FOOD_CATEGORIES: { id: FoodCategory; label: string; emoji: string }[] = [
  { id: "proteínas", label: "Proteínas", emoji: "🥩" },
  { id: "cereales", label: "Cereales y Granos", emoji: "🌾" },
  { id: "frutas", label: "Frutas", emoji: "🍎" },
  { id: "verduras", label: "Verduras", emoji: "🥬" },
  { id: "lácteos", label: "Lácteos", emoji: "🥛" },
  { id: "legumbres", label: "Legumbres", emoji: "🫘" },
  { id: "pan", label: "Pan y Masas", emoji: "🍞" },
  { id: "aceites", label: "Aceites y Grasas", emoji: "🫒" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "snacks", label: "Snacks y Dulces", emoji: "🍫" },
  { id: "platos", label: "Platos Chilenos", emoji: "🇨🇱" },
  { id: "condimentos", label: "Condimentos", emoji: "🧂" },
  { id: "frutos_secos", label: "Frutos Secos y Semillas", emoji: "🥜" },
];
