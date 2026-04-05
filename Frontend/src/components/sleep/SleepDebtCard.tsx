"use client";

import { calculateSleepDebt } from "@/lib/sleep-utils";
import { getSettings } from "@/lib/storage";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function SleepDebtCard() {
  const debt = calculateSleepDebt(7);
  const goal = getSettings().sleepGoal;

  const isDebt = debt > 0;
  const isSurplus = debt < -0.5;
  const isNeutral = !isDebt && !isSurplus;

  const color = isDebt
    ? debt > 3 ? "#FF3B30" : "#FF9500"
    : isNeutral ? "#34C759" : "#34C759";
  const bg = isDebt
    ? debt > 3 ? "rgba(255,59,48,0.1)" : "rgba(255,149,0,0.1)"
    : "rgba(52,199,89,0.1)";
  const Icon = isDebt ? TrendingDown : isSurplus ? TrendingUp : Minus;

  let message: string;
  if (isDebt) {
    if (debt > 5) message = "Deuda crítica. Priorizá dormir más esta semana.";
    else if (debt > 3) message = "Necesitás recuperar sueño. Intentá acostarte 30min antes.";
    else message = "Pequeña deuda. Dormí un poco más hoy.";
  } else if (isSurplus) {
    message = "Superaste tu meta esta semana. ¡Bien descansado!";
  } else {
    message = "Estás al día con tu meta de sueño.";
  }

  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}`, background: bg }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "20" }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-lg font-black" style={{ color }}>
              {isDebt ? `-${debt}h` : debt < -0.5 ? `+${Math.abs(debt)}h` : "0h"}
            </span>
            <span className="text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              deuda semanal
            </span>
          </div>
          <div className="text-[0.68rem]" style={{ color: "var(--text-secondary)" }}>
            {message}
          </div>
          <div className="text-[0.55rem] mt-1" style={{ color: "var(--text-muted)" }}>
            Meta: {goal}h/noche · Últimos 7 días
          </div>
        </div>
      </div>
    </div>
  );
}
