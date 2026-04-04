"use client";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

export default function CalorieRing({
  consumed, goal, protein, carbs, fat,
  proteinTarget, carbsTarget, fatTarget,
}: CalorieRingProps) {
  const remaining = goal - consumed;
  const pct = Math.min(consumed / goal, 1);
  const radius = 58;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  // Color based on status
  const ringColor = consumed > goal ? "#FF3B30" : "#34C759";

  // Mini macro bars
  const macros = [
    { label: "Proteína", value: protein, target: proteinTarget, color: "#34C759" },
    { label: "Carbos", value: carbs, target: carbsTarget, color: "#FFCC00" },
    { label: "Grasa", value: fat, target: fatTarget, color: "#AF52DE" },
  ];

  return (
    <div className="flex items-center gap-5">
      {/* Ring */}
      <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-black" style={{ color: remaining >= 0 ? "var(--text)" : "#FF3B30", lineHeight: 1 }}>
            {Math.abs(remaining)}
          </div>
          <div className="text-[0.6rem] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
            {remaining >= 0 ? "Restantes" : "Excedido"}
          </div>
        </div>
      </div>

      {/* Macro summary */}
      <div className="flex-1 flex flex-col gap-3">
        {macros.map((m) => {
          const pctM = m.target > 0 ? Math.min(m.value / m.target, 1) : 0;
          return (
            <div key={m.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[0.65rem] font-medium" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                <span className="text-[0.65rem] font-bold" style={{ color: "var(--text)" }}>
                  {m.value}<span style={{ color: "var(--text-muted)" }}>/{m.target}g</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "var(--bg-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pctM * 100}%`, background: m.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
