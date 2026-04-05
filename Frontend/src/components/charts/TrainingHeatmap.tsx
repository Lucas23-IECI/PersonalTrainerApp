"use client";

import { useMemo } from "react";
import { getSessions } from "@/lib/storage";
import { CalendarDays } from "lucide-react";

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAYS_ES = ["L", "M", "X", "J", "V", "S", "D"];

interface DayCell {
  date: string;
  count: number;
  dayOfWeek: number; // 0=Mon..6=Sun
  weekIndex: number;
}

export default function TrainingHeatmap() {
  const { cells, weeks, monthLabels, totalSessions, activeDays } = useMemo(() => {
    const sessions = getSessions().filter((s) => s.completed);
    const sessionsByDate = new Map<string, number>();
    for (const s of sessions) {
      sessionsByDate.set(s.date, (sessionsByDate.get(s.date) || 0) + 1);
    }

    // Build 16 weeks of cells (≈4 months) ending today
    const today = new Date();
    const totalWeeks = 16;
    const dayCells: DayCell[] = [];

    // Find the Monday of the first week
    const endDay = new Date(today);
    const todayDow = (endDay.getDay() + 6) % 7; // Mon=0
    const startDate = new Date(endDay);
    startDate.setDate(startDate.getDate() - (totalWeeks * 7 - 1) - todayDow);

    // Collect month boundaries for labels
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + d);

        // Skip future dates
        if (cellDate > today) continue;

        const dateStr = cellDate.toISOString().slice(0, 10);
        const month = cellDate.getMonth();
        if (month !== lastMonth) {
          months.push({ label: MONTHS_ES[month], weekIndex: w });
          lastMonth = month;
        }

        dayCells.push({
          date: dateStr,
          count: sessionsByDate.get(dateStr) || 0,
          dayOfWeek: d,
          weekIndex: w,
        });
      }
    }

    const total = dayCells.reduce((s, c) => s + c.count, 0);
    const active = dayCells.filter((c) => c.count > 0).length;

    return {
      cells: dayCells,
      weeks: totalWeeks,
      monthLabels: months,
      totalSessions: total,
      activeDays: active,
    };
  }, []);

  const cellSize = 14;
  const cellGap = 3;
  const labelW = 18;
  const headerH = 16;
  const svgW = labelW + weeks * (cellSize + cellGap);
  const svgH = headerH + 7 * (cellSize + cellGap);

  function getColor(count: number): string {
    if (count === 0) return "var(--bg-elevated)";
    if (count === 1) return "#1a5c2a";
    if (count === 2) return "#2ea043";
    return "#3dd353";
  }

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-[#34C759]" />
          <div className="text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Frecuencia de Entreno</div>
        </div>
        <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
          {activeDays} días · {totalSessions} sesiones
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="block"
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={labelW + m.weekIndex * (cellSize + cellGap)}
              y={12}
              fill="#636366"
              fontSize={9}
              fontWeight={600}
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {[0, 2, 4].map((d) => (
            <text
              key={d}
              x={0}
              y={headerH + d * (cellSize + cellGap) + cellSize - 2}
              fill="#636366"
              fontSize={8}
            >
              {DAYS_ES[d]}
            </text>
          ))}

          {/* Cells */}
          {cells.map((cell, i) => (
            <rect
              key={i}
              x={labelW + cell.weekIndex * (cellSize + cellGap)}
              y={headerH + cell.dayOfWeek * (cellSize + cellGap)}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={getColor(cell.count)}
              opacity={0.9}
            >
              <title>{cell.date}: {cell.count} sesión(es)</title>
            </rect>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>Menos</span>
        {[0, 1, 2, 3].map((level) => (
          <div
            key={level}
            className="rounded-sm"
            style={{
              width: 10,
              height: 10,
              background: getColor(level),
            }}
          />
        ))}
        <span className="text-[0.5rem]" style={{ color: "var(--text-muted)" }}>Más</span>
      </div>
    </div>
  );
}
