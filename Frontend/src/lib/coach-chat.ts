/**
 * 7.6 — IA: Coach Chat (FAQ local + context-aware responses)
 * Rule-based fitness coach that answers common questions using
 * the user's actual training data for personalized responses.
 */

import { getSessions, getCheckins, getProfile, safeGetItem, safeSetItem, safeRemoveItem} from "./storage";
import { getWeaknessAnalysis } from "./weakness-analysis";
import { getRecoveryDashboard } from "./muscle-recovery";
import { calculateFatigue } from "./deload";
import { getWeeklyMuscleData } from "./storage";
import { getMuscleBalanceScore } from "./muscle-goals";

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: number;
}

// ── FAQ Knowledge Base ──

interface FaqEntry {
  keywords: string[];
  answer: string;
}

const FAQ_DB: FaqEntry[] = [
  // Nutrition
  {
    keywords: ["proteína", "proteina", "protein", "cuánta proteína", "cuanta proteina"],
    answer: "Para ganar músculo, apuntá a 1.6-2.2g de proteína por kg de peso corporal al día. Si pesás 75kg, eso son 120-165g diarios. Distribuí la ingesta en 3-5 comidas."
  },
  {
    keywords: ["creatina", "creatine"],
    answer: "La creatina monohidrato es el suplemento más estudiado. Dosis: 3-5g/día, todos los días. No necesita fase de carga (pero podés hacer 20g/día × 5 días si querés saturar rápido). Tomala con lo que sea, el timing no importa."
  },
  {
    keywords: ["calorías", "calorias", "tdee", "déficit", "deficit", "superávit", "superavit", "bulk", "cut"],
    answer: "Para perder grasa: déficit de 300-500 kcal/día. Para ganar músculo: superávit de 200-400 kcal/día. Tu TDEE depende del peso, actividad, y metabolismo. Usá la calculadora de la app para estimarlo."
  },
  {
    keywords: ["agua", "hidratación", "hidratacion", "water"],
    answer: "Tomá al menos 0.033L por kg de peso corporal + 0.5L extra los días de entrenamiento. Señales de deshidratación: orina oscura, fatiga, dolor de cabeza."
  },
  // Training
  {
    keywords: ["volumen", "sets", "series", "cuántas series", "cuantas series"],
    answer: "Para hipertrofia: 10-20 sets por grupo muscular por semana. Principiantes pueden crecer con 10-12, avanzados necesitan 15-20+. Distribuí en 2-3 sesiones semanales por músculo."
  },
  {
    keywords: ["rpe", "rir", "intensidad", "esfuerzo"],
    answer: "RPE (Rate of Perceived Exertion): escala 1-10 del esfuerzo. RPE 8 = podrías hacer 2 reps más. RIR = reps en reserva (10 - RPE). Para hipertrofia, entrená entre RPE 7-9. Dejá 1-3 reps en reserva."
  },
  {
    keywords: ["deload", "descarga", "descanso", "overtraining", "sobreentrenamiento"],
    answer: "Cada 4-8 semanas, hacé una semana de descarga: reducí volumen 40-50% y peso al 60%. Señales para deload: fatiga persistente, RPE alto sin progreso, dolor articular, mal sueño."
  },
  {
    keywords: ["frecuencia", "cuántos días", "cuantos dias", "veces por semana"],
    answer: "Para hipertrofia óptima: 3-6 días/semana. Cada músculo 2-3 veces/semana. Splits populares: PPL (6 días), Upper/Lower (4 días), Full Body (3 días). Más frecuencia no siempre es mejor."
  },
  {
    keywords: ["calentamiento", "warmup", "warm up", "calentar"],
    answer: "Siempre calentá: 5 min de cardio ligero + sets ramping (50%×8, 70%×5, 85%×3 del peso de trabajo). Esto reduce riesgo de lesión y mejora rendimiento."
  },
  {
    keywords: ["progresión", "progresion", "progresar", "meseta", "plateau", "estancado"],
    answer: "Formas de progresar: 1) Más peso (sobrecarga progresiva), 2) Más reps, 3) Más sets, 4) Mejor técnica, 5) Menos descanso. Si estás estancado, probá cambiar ejercicios, reps, o hacé un deload."
  },
  // Recovery
  {
    keywords: ["sueño", "dormir", "sleep", "descanso nocturno"],
    answer: "El sueño es crítico: apuntá a 7-9 horas. Tips: misma hora de acostarse, cuarto oscuro y fresco, nada de pantallas 1h antes. El sueño pobre reduce fuerza ~10% y retrasa la recuperación muscular."
  },
  {
    keywords: ["recuperación", "recuperacion", "recovery", "doms", "dolor muscular"],
    answer: "La recuperación muscular tarda 48-72h para la mayoría de músculos. Para mejorarla: dormí 7-9h, comé suficiente proteína, manejá el estrés, hidratate bien. El DOMS no indica daño — podés entrenar con DOMS leve."
  },
  {
    keywords: ["stretching", "estiramiento", "flexibilidad", "movilidad"],
    answer: "Estiramientos estáticos post-entreno (30-60s por músculo). Movilidad dinámica como calentamiento. La flexibilidad mejora el rango de movimiento y reduce riesgo de lesiones."
  },
  // Exercises
  {
    keywords: ["squat", "sentadilla", "piernas"],
    answer: "La sentadilla es el rey del tren inferior. Trabaja quads, glúteos, core. Tips: pies ancho de hombros, rodillas siguen los pies, baja hasta paralelo o más, espalda neutra."
  },
  {
    keywords: ["press banca", "bench press", "pecho"],
    answer: "Press banca: retrae escápulas, arco leve en espalda baja, baja la barra al pecho (línea de pezones), empuja con fuerza. Agarre: 1.5× ancho de hombros para pecho."
  },
  {
    keywords: ["peso muerto", "deadlift", "espalda"],
    answer: "Peso muerto: mantené la barra pegada al cuerpo, espalda neutra, empujá con las piernas, apretá glúteos arriba. No redondees la espalda baja. Convencional vs sumo: probá ambos."
  },
  // Body comp
  {
    keywords: ["grasa", "perder grasa", "quemar grasa", "definición", "definicion"],
    answer: "Para perder grasa: déficit calórico + entrenamiento de fuerza + proteína alta (2g/kg). El cardio ayuda pero no es obligatorio. Apuntá a 0.5-1% de peso corporal por semana."
  },
  {
    keywords: ["ganar músculo", "ganar musculo", "hipertrofia", "masa muscular"],
    answer: "Para hipertrofia: superávit calórico moderado (200-400 kcal), proteína 1.6-2.2g/kg, 10-20 sets/músculo/semana, RPE 7-9, progresión gradual. La consistencia es más importante que la perfección."
  },
];

/** Match a user query to FAQ entries by keyword overlap */
function matchFaq(query: string): FaqEntry | null {
  const lower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let bestMatch: FaqEntry | null = null;
  let bestScore = 0;

  for (const entry of FAQ_DB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.includes(kwNorm)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

/** Generate context-aware response using the user's training data */
function getContextualResponse(query: string): string | null {
  const lower = query.toLowerCase();

  // Recovery question
  if (lower.includes("recuper") || lower.includes("listo para entrenar") || lower.includes("puedo entrenar")) {
    const dashboard = getRecoveryDashboard();
    const recovering = dashboard.recoveringMuscles.slice(0, 3);
    let response = `${dashboard.topTip}\n\nRecuperación general: ${dashboard.overallPct}%`;
    if (dashboard.readyMuscles.length > 0) {
      response += `\n✅ Listos: ${dashboard.readyMuscles.slice(0, 6).join(", ")}`;
    }
    if (recovering.length > 0) {
      response += `\n⏳ Recuperando: ${recovering.map((m) => `${m.muscle} (${m.pct}%)`).join(", ")}`;
    }
    return response;
  }

  // Fatigue question
  if (lower.includes("fatiga") || lower.includes("cansado") || lower.includes("overtraining") || lower.includes("deload")) {
    const fatigue = calculateFatigue();
    return `Tu nivel de fatiga: ${fatigue.overall}/100 (${fatigue.level})\n\n${fatigue.recommendation}${
      fatigue.musclesOverMrv.length > 0
        ? `\n\nMúsculos sobre MRV: ${fatigue.musclesOverMrv.join(", ")}`
        : ""
    }`;
  }

  // Weakness/balance question
  if (lower.includes("debilidad") || lower.includes("balance") || lower.includes("imbalance") || lower.includes("mejorar") || lower.includes("weak")) {
    const analysis = getWeaknessAnalysis();
    let response = `Score de balance: ${analysis.score}/100 (${analysis.level})`;
    if (analysis.items.length > 0) {
      response += "\n\n🔍 Áreas a mejorar:";
      analysis.items.slice(0, 4).forEach((item) => {
        const emoji = item.severity === "high" ? "🔴" : item.severity === "medium" ? "🟡" : "🟢";
        response += `\n${emoji} ${item.title} — ${item.action}`;
      });
    }
    if (analysis.strengths.length > 0) {
      response += `\n\n💪 Fortalezas: ${analysis.strengths.join(", ")}`;
    }
    return response;
  }

  // Volume question
  if (lower.includes("volumen semanal") || lower.includes("cuánto entrenar") || lower.includes("cuanto entrenar")) {
    const weeklyData = getWeeklyMuscleData();
    const balance = getMuscleBalanceScore(weeklyData);
    let totalSets = 0;
    for (const m of Object.values(weeklyData)) totalSets += m.sets;

    return `Sets totales esta semana: ${totalSets}\n\nBalance muscular: ${balance.score}/100\n${balance.details.map((d) => `• ${d.category}: ${d.label}`).join("\n")}${
      balance.recommendations.length > 0 ? `\n\n📝 ${balance.recommendations.join("\n📝 ")}` : ""
    }`;
  }

  // Profile/stats
  if (lower.includes("mi perfil") || lower.includes("mis datos") || lower.includes("mis stats") || lower.includes("estadísticas")) {
    const profile = getProfile();
    const sessions = getSessions().filter((s) => s.completed);
    const checkins = getCheckins();
    const last30 = sessions.filter((s) => s.date >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));

    let response = `📊 Tus datos:`;
    if (profile) {
      response += `\n• Peso: ${profile.weight || "—"}kg`;
    }
    response += `\n• Sesiones totales: ${sessions.length}`;
    response += `\n• Sesiones últimos 30d: ${last30.length}`;
    if (checkins.length > 0) {
      const lastC = checkins.sort((a, b) => b.date.localeCompare(a.date))[0];
      response += `\n• Último check-in: energía ${lastC.energy}/5, dolor ${lastC.soreness}/3`;
      if (lastC.stress) response += `, estrés ${lastC.stress}/5`;
    }
    return response;
  }

  return null;
}

/** Main coach response function */
export function getCoachResponse(query: string): string {
  if (!query.trim()) return "¿En qué puedo ayudarte? Preguntame sobre entrenamiento, nutrición, recuperación, o tus stats.";

  // 1. Try context-aware data response
  const contextual = getContextualResponse(query);
  if (contextual) return contextual;

  // 2. Try FAQ match
  const faqMatch = matchFaq(query);
  if (faqMatch) return faqMatch.answer;

  // 3. Fallback
  return "No tengo información específica sobre eso. Probá preguntar sobre:\n\n"
    + "💪 Entrenamiento (volumen, RPE, frecuencia, progresión)\n"
    + "🍗 Nutrición (proteína, calorías, creatina, hidratación)\n"
    + "😴 Recuperación (sueño, descanso, deload)\n"
    + "📊 Tus datos (recuperación, fatiga, balance, debilidades)\n"
    + "🏋️ Ejercicios (sentadilla, press banca, peso muerto)";
}

/** Suggested quick prompts for the chat */
export const QUICK_PROMPTS = [
  { emoji: "💪", text: "¿Estoy listo para entrenar?" },
  { emoji: "😴", text: "¿Necesito un deload?" },
  { emoji: "🔍", text: "¿Cuáles son mis debilidades?" },
  { emoji: "📊", text: "¿Cómo va mi volumen semanal?" },
  { emoji: "🥩", text: "¿Cuánta proteína necesito?" },
  { emoji: "💧", text: "¿Cuánta agua debo tomar?" },
];

const CHAT_KEY = "mark-pt-coach-chat";

export function getChatHistory(): CoachMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGetItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: CoachMessage[]): void {
  safeSetItem(CHAT_KEY, JSON.stringify(messages.slice(-50))); // keep last 50 messages
}

export function clearChatHistory(): void {
  safeRemoveItem(CHAT_KEY);
}
