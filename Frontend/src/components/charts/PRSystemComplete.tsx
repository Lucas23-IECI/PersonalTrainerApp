"use client";

import { useMemo, useState, useRef } from "react";
import { getSessions } from "@/lib/storage";
import { Trophy, Medal, ChevronDown, ChevronUp, Share2 } from "lucide-react";

interface PRByRepRange {
  exerciseName: string;
  repRange: string;
  weight: number;
  reps: number;
  e1rm: number;
  date: string;
}

interface ExercisePRGroup {
  exerciseName: string;
  prs: PRByRepRange[];
  bestE1rm: number;
  latestPRDate: string;
}

const REP_RANGES = [
  { label: "1RM", min: 1, max: 1 },
  { label: "3RM", min: 2, max: 3 },
  { label: "5RM", min: 4, max: 5 },
  { label: "8RM", min: 6, max: 8 },
  { label: "10RM", min: 9, max: 10 },
  { label: "12RM+", min: 11, max: 999 },
];

function getRangeLabel(reps: number): string {
  const range = REP_RANGES.find((r) => reps >= r.min && reps <= r.max);
  return range?.label || "12RM+";
}

export default function PRSystemComplete() {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "recent">("all");
  const [sharing, setSharing] = useState(false);
  const prCardRef = useRef<HTMLDivElement>(null);

  async function sharePRCard(exerciseName: string, prs: PRByRepRange[], bestE1rm: number) {
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (!prCardRef.current) { setSharing(false); return; }
      const canvas = await html2canvas(prCardRef.current, {
        backgroundColor: "#000",
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");

      if (navigator.share && navigator.canShare) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `PR-${exerciseName}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `PR - ${exerciseName}` });
          setSharing(false);
          return;
        }
      }

      const link = document.createElement("a");
      link.download = `MARK-PT-PR-${exerciseName}.png`;
      link.href = dataUrl;
      link.click();
    } catch { /* silent */ }
    setSharing(false);
  }

  const groups: ExercisePRGroup[] = useMemo(() => {
    const sessions = getSessions().filter((s) => s.completed);
    // Map: exerciseName -> rangeLabel -> best set
    const prMap = new Map<string, Map<string, PRByRepRange>>();

    for (const session of sessions) {
      for (const exercise of session.exercises) {
        if (exercise.skipped || exercise.sets.length === 0) continue;
        const name = exercise.name;
        if (!prMap.has(name)) prMap.set(name, new Map());
        const rangeMap = prMap.get(name)!;

        for (const set of exercise.sets) {
          const w = set.weight || 0;
          const r = set.reps;
          if (w === 0 || r === 0) continue;

          const e1rm = w * (1 + r / 30);
          const rangeLabel = getRangeLabel(r);
          const existing = rangeMap.get(rangeLabel);

          if (!existing || w > existing.weight || (w === existing.weight && r > existing.reps)) {
            rangeMap.set(rangeLabel, {
              exerciseName: name,
              repRange: rangeLabel,
              weight: w,
              reps: r,
              e1rm: Math.round(e1rm * 10) / 10,
              date: session.date,
            });
          }
        }
      }
    }

    const result: ExercisePRGroup[] = [];
    prMap.forEach((rangeMap, name) => {
      const prs = Array.from(rangeMap.values()).sort((a, b) => {
        const orderA = REP_RANGES.findIndex((r) => r.label === a.repRange);
        const orderB = REP_RANGES.findIndex((r) => r.label === b.repRange);
        return orderA - orderB;
      });
      const bestE1rm = Math.max(...prs.map((p) => p.e1rm));
      const latestPRDate = prs.reduce((latest, p) => (p.date > latest ? p.date : latest), "");
      result.push({ exerciseName: name, prs, bestE1rm, latestPRDate });
    });

    result.sort((a, b) => b.bestE1rm - a.bestE1rm);
    return result;
  }, []);

  // recent = last 14 days
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);
  const twoWeeksStr = twoWeeksAgo.toISOString().slice(0, 10);

  const recentPRCount = groups.reduce(
    (sum, g) => sum + g.prs.filter((p) => p.date >= twoWeeksStr).length,
    0
  );

  const filteredGroups = filter === "recent"
    ? groups.filter((g) => g.prs.some((p) => p.date >= twoWeeksStr)).map((g) => ({
        ...g,
        prs: g.prs.filter((p) => p.date >= twoWeeksStr),
      }))
    : groups;

  const toggle = (name: string) => {
    setExpandedExercise((prev) => (prev === name ? null : name));
  };

  if (groups.length === 0) {
    return (
      <div className="card mb-3.5 text-center py-6">
        <Trophy size={24} className="mx-auto mb-2 text-zinc-600" />
        <div className="text-sm text-zinc-500">Completá sesiones para ver tus PRs</div>
      </div>
    );
  }

  return (
    <div className="card mb-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[#FFD700] shrink-0" />
          <div className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">
            Records Personales
          </div>
        </div>
        {recentPRCount > 0 && (
          <div className="text-[0.6rem] font-bold text-[#FF9500] flex items-center gap-1">
            <Medal size={10} />
            {recentPRCount} nuevo{recentPRCount > 1 ? "s" : ""} (14d)
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-3">
        {(["all", "recent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-[0.6rem] px-2.5 py-1 rounded-full transition-colors font-medium"
            style={{
              background: filter === f ? "var(--accent)" : "var(--bg-elevated)",
              color: filter === f ? "#fff" : "var(--text-muted)",
            }}
          >
            {f === "all" ? "Todos" : "Recientes (14d)"}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-1.5">
        {filteredGroups.slice(0, expandedExercise ? undefined : 8).map((g) => {
          const isExpanded = expandedExercise === g.exerciseName;
          const hasRecent = g.prs.some((p) => p.date >= twoWeeksStr);

          return (
            <div key={g.exerciseName}>
              <button
                onClick={() => toggle(g.exerciseName)}
                className="w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {hasRecent && <span className="text-[0.5rem]">🆕</span>}
                    <div className="text-[0.7rem] font-semibold truncate">{g.exerciseName}</div>
                  </div>
                  <div className="text-[0.55rem] text-zinc-500">
                    e1RM: {Math.round(g.bestE1rm)}kg · {g.prs.length} rango{g.prs.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {g.prs.map((p) => (
                      <span
                        key={p.repRange}
                        className="text-[0.45rem] px-1 py-0.5 rounded font-mono"
                        style={{
                          background: p.date >= twoWeeksStr ? "rgba(255, 214, 0, 0.2)" : "rgba(99, 99, 102, 0.2)",
                          color: p.date >= twoWeeksStr ? "#FFD700" : "#636366",
                        }}
                      >
                        {p.repRange}
                      </span>
                    ))}
                  </div>
                  {isExpanded ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
                </div>
              </button>

              {isExpanded && (
                <div ref={prCardRef} className="mt-1 ml-2 space-y-1 p-2 rounded-xl" style={{ background: "#000" }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Trophy size={12} className="text-[#FFD700]" />
                      <span className="text-[0.65rem] font-bold text-white">{g.exerciseName}</span>
                    </div>
                    <span className="text-[0.5rem] text-zinc-500">MARK PT</span>
                  </div>
                  {g.prs.map((p) => (
                    <div
                      key={p.repRange}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[0.6rem]"
                      style={{
                        background: p.date >= twoWeeksStr
                          ? "rgba(255, 214, 0, 0.08)"
                          : "rgba(28, 28, 30, 0.5)",
                        borderLeft: p.date >= twoWeeksStr
                          ? "2px solid #FFD700"
                          : "2px solid #38383A",
                      }}
                    >
                      <div>
                        <span className="font-bold text-white">{p.repRange}</span>
                        <span className="text-zinc-500 mx-1.5">→</span>
                        <span className="font-semibold" style={{ color: "#0A84FF" }}>
                          {p.weight}kg × {p.reps}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500">
                        <span>~{Math.round(p.e1rm)}kg e1RM</span>
                        <span>{p.date.slice(5)}</span>
                        {p.date >= twoWeeksStr && <Trophy size={8} className="text-[#FFD700]" />}
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-[0.5rem] text-zinc-600 pt-1">
                    Best e1RM: {Math.round(g.bestE1rm)}kg
                  </div>
                </div>
              )}
              {isExpanded && (
                <button
                  onClick={() => sharePRCard(g.exerciseName, g.prs, g.bestE1rm)}
                  disabled={sharing}
                  className="mt-1 ml-2 flex items-center gap-1.5 text-[0.6rem] px-3 py-1.5 rounded-lg bg-transparent border-none cursor-pointer"
                  style={{ color: "var(--accent)" }}
                >
                  {sharing ? <span>Generando...</span> : <><Share2 size={12} /> Compartir PR</>}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!expandedExercise && filteredGroups.length > 8 && (
        <div className="text-center mt-2 text-[0.55rem] text-zinc-500">
          +{filteredGroups.length - 8} ejercicios más
        </div>
      )}
    </div>
  );
}
