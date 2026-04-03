export const profile = {
  name: "Lucas Gabriel Méndez Risopatrón",
  age: 22,
  height: 177,
  weight: 81.2,
  goalWeight: 74.5,
  bodyFatEstimate: 26.5,
  goalBodyFat: 13,
  bmr: 1813,
  tdee: 2810,
  targetCalories: 2300,
  brazilDate: "2027-02-01",
  heavyWeightsDate: "2026-04-21",
  startDate: "2026-04-02",
  currentPhase: 0,
  sleep: { bed: "23:00-00:00", wakeMonTue: "04:40", wakeOther: "flexible" },
  measurements: {
    date: "2026-04-02",
    chest: 105,
    waist: 97,
    hip: 103,
    armR: 34,
    armL: 33,
    thighR: 55,
    thighL: 53,
    calfR: 36,
    calfL: 35,
    neck: 38,
  },
  historicLifts: {
    squat: 140,
    bench: 100,
    deadlift: 200,
  },
  equipment: {
    pullUpBar: true,
    barbell: true,
    rackImprovised: true,
    dumbbellsMaxKg: 12.5,
    barbellWeights: [35, 50],
    cables: false,
    bands: false,
    gym: true,
    gymAvailableFrom: "2026-04-21",
  },
  supplements: [
    { name: "Citrato de Potasio", dose: "600mg", brand: "LABGEA" },
    { name: "Vitamina C", dose: "1000mg", brand: "German Energy" },
  ],
  football: { day: "wednesday", extra: "maybe another day TBD" },
};

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCurrentPhaseLabel(): string {
  const today = new Date();
  const heavyDate = new Date(profile.heavyWeightsDate);
  if (today < heavyDate) return "FASE 0 — Reactivación";
  return "FASE 1 — Vuelta a Pesas";
}
