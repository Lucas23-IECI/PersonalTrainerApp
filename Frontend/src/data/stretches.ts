// ── Stretching & Mobility data ──

export interface Stretch {
  id: string;
  name: string;
  muscles: string[];
  durationSec: number;
  difficulty: "fácil" | "medio" | "avanzado";
  instructions: string;
  icon: string;
}

export interface StretchRoutine {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  durationMin: number;
  stretches: string[]; // stretch ids
}

export const STRETCHES: Stretch[] = [
  // Upper body
  { id: "neck-lateral", name: "Inclinación lateral cuello", muscles: ["cuello", "trapecio"], durationSec: 30, difficulty: "fácil", instructions: "Inclina la cabeza hacia un hombro, mantené 30s. Repetí del otro lado.", icon: "🦒" },
  { id: "chest-doorway", name: "Apertura pectoral en puerta", muscles: ["pecho", "hombro anterior"], durationSec: 30, difficulty: "fácil", instructions: "Apoyá el antebrazo en el marco de una puerta y girá el torso hacia afuera.", icon: "🚪" },
  { id: "cross-body-shoulder", name: "Estiramiento cruzado hombro", muscles: ["hombro posterior", "deltoides"], durationSec: 30, difficulty: "fácil", instructions: "Llevá el brazo cruzado al pecho, presioná con la otra mano.", icon: "💪" },
  { id: "tricep-overhead", name: "Tríceps overhead", muscles: ["tríceps"], durationSec: 25, difficulty: "fácil", instructions: "Llevá la mano detrás de la nuca, presioná el codo con la otra mano.", icon: "🤚" },
  { id: "cat-cow", name: "Gato-Vaca", muscles: ["espalda", "core"], durationSec: 40, difficulty: "fácil", instructions: "En cuatro patas, alterná entre arquear y redondear la espalda.", icon: "🐱" },
  { id: "child-pose", name: "Postura del niño", muscles: ["espalda baja", "hombros", "glúteos"], durationSec: 45, difficulty: "fácil", instructions: "Sentate sobre los talones con los brazos extendidos al frente en el suelo.", icon: "🧒" },
  { id: "thoracic-rotation", name: "Rotación torácica", muscles: ["espalda media", "oblicuos"], durationSec: 30, difficulty: "medio", instructions: "En cuatro patas, llevá la mano detrás de la nuca y rotá el torso hacia arriba.", icon: "🔄" },
  { id: "lat-hang", name: "Colgado en barra", muscles: ["dorsales", "hombros"], durationSec: 30, difficulty: "medio", instructions: "Colgarse de una barra con agarre ancho, relajar los hombros.", icon: "🏗️" },

  // Lower body
  { id: "quad-standing", name: "Cuádriceps de pie", muscles: ["cuádriceps"], durationSec: 30, difficulty: "fácil", instructions: "De pie, llevá el talón hacia el glúteo y sostené el pie con la mano.", icon: "🦵" },
  { id: "hamstring-standing", name: "Isquiotibiales de pie", muscles: ["isquiotibiales"], durationSec: 30, difficulty: "fácil", instructions: "Apoyá el talón en un escalón, extendé la pierna y empujá el pecho hacia la rodilla.", icon: "🦿" },
  { id: "hip-flexor-lunge", name: "Flexor de cadera en lunge", muscles: ["flexor cadera", "psoas"], durationSec: 35, difficulty: "medio", instructions: "Rodilla trasera en el suelo, empujá la cadera hacia adelante.", icon: "🏃" },
  { id: "pigeon-pose", name: "Postura de la paloma", muscles: ["glúteos", "piriforme"], durationSec: 40, difficulty: "medio", instructions: "Pierna delantera cruzada al frente, pierna trasera extendida. Inclinate hacia adelante.", icon: "🕊️" },
  { id: "calf-wall", name: "Gemelos en pared", muscles: ["gemelos", "sóleo"], durationSec: 30, difficulty: "fácil", instructions: "Apoyá las manos en la pared, pierna trasera estirada con talón en el suelo.", icon: "🧱" },
  { id: "butterfly", name: "Mariposa", muscles: ["aductores", "cadera"], durationSec: 40, difficulty: "fácil", instructions: "Sentado, juntá las plantas de los pies y presioná las rodillas hacia abajo.", icon: "🦋" },
  { id: "90-90-hip", name: "Cadera 90/90", muscles: ["cadera", "glúteos"], durationSec: 35, difficulty: "medio", instructions: "Sentado con ambas piernas a 90°, rotá el torso sobre la pierna delantera.", icon: "🔢" },
  { id: "deep-squat-hold", name: "Sentadilla profunda", muscles: ["cadera", "tobillos", "aductores"], durationSec: 45, difficulty: "medio", instructions: "Bajá a sentadilla profunda con talones en el suelo, codos empujan rodillas.", icon: "⬇️" },
  { id: "world-greatest", name: "El mejor estiramiento del mundo", muscles: ["cadera", "espalda", "hombros"], durationSec: 40, difficulty: "avanzado", instructions: "Desde lunge, rotá el torso abriendo el brazo hacia el techo.", icon: "🌍" },
  { id: "foam-roll-it-band", name: "Foam Roll IT Band", muscles: ["banda iliotibial", "cuádriceps"], durationSec: 45, difficulty: "medio", instructions: "Acostado de lado sobre el foam roller, rodá desde la cadera hasta la rodilla.", icon: "🧻" },

  // Full-body / Combo
  { id: "downward-dog", name: "Perro hacia abajo", muscles: ["isquiotibiales", "gemelos", "hombros"], durationSec: 35, difficulty: "fácil", instructions: "Levantá las caderas formando una V invertida, presioná los talones hacia abajo.", icon: "🐕" },
  { id: "cobra", name: "Cobra", muscles: ["abdominales", "espalda baja", "pecho"], durationSec: 30, difficulty: "fácil", instructions: "Boca abajo, empujá el torso hacia arriba con los brazos, caderas en el suelo.", icon: "🐍" },
  { id: "spiderman-lunge", name: "Spiderman Lunge", muscles: ["cadera", "aductores", "cuádriceps"], durationSec: 35, difficulty: "medio", instructions: "Desde plancha, llevá el pie al lado de la mano. Mantené la posición.", icon: "🕷️" },
  { id: "scorpion-stretch", name: "Escorpión", muscles: ["pecho", "cadera", "espalda"], durationSec: 30, difficulty: "avanzado", instructions: "Boca abajo, cruzá el pie por detrás del cuerpo hacia el lado opuesto.", icon: "🦂" },
];

export const STRETCH_ROUTINES: StretchRoutine[] = [
  {
    id: "pre-workout",
    name: "Pre-Entreno",
    description: "Movilidad dinámica para preparar el cuerpo",
    icon: "🔥",
    color: "#FF9500",
    durationMin: 8,
    stretches: ["cat-cow", "thoracic-rotation", "hip-flexor-lunge", "deep-squat-hold", "world-greatest", "downward-dog", "spiderman-lunge"],
  },
  {
    id: "post-workout",
    name: "Post-Entreno",
    description: "Estiramientos estáticos para enfriar",
    icon: "❄️",
    color: "#0A84FF",
    durationMin: 10,
    stretches: ["chest-doorway", "cross-body-shoulder", "tricep-overhead", "quad-standing", "hamstring-standing", "pigeon-pose", "calf-wall", "child-pose"],
  },
  {
    id: "rest-day",
    name: "Día de Descanso",
    description: "Rutina completa de flexibilidad",
    icon: "🧘",
    color: "#AF52DE",
    durationMin: 15,
    stretches: ["neck-lateral", "cat-cow", "thoracic-rotation", "chest-doorway", "lat-hang", "hip-flexor-lunge", "pigeon-pose", "butterfly", "90-90-hip", "deep-squat-hold", "downward-dog", "cobra", "child-pose"],
  },
  {
    id: "lower-body",
    name: "Tren Inferior",
    description: "Enfocado en piernas y cadera",
    icon: "🦵",
    color: "#30D158",
    durationMin: 10,
    stretches: ["quad-standing", "hamstring-standing", "hip-flexor-lunge", "pigeon-pose", "calf-wall", "butterfly", "90-90-hip", "deep-squat-hold"],
  },
  {
    id: "upper-body",
    name: "Tren Superior",
    description: "Hombros, pecho y espalda",
    icon: "💪",
    color: "#FF3B30",
    durationMin: 8,
    stretches: ["neck-lateral", "chest-doorway", "cross-body-shoulder", "tricep-overhead", "cat-cow", "thoracic-rotation", "lat-hang", "cobra"],
  },
  {
    id: "office-break",
    name: "Pausa de Oficina",
    description: "5 min para descomprimir espalda y cuello",
    icon: "🖥️",
    color: "#5856D6",
    durationMin: 5,
    stretches: ["neck-lateral", "cross-body-shoulder", "chest-doorway", "cat-cow", "child-pose"],
  },
];

export function getStretchById(id: string): Stretch | undefined {
  return STRETCHES.find((s) => s.id === id);
}
