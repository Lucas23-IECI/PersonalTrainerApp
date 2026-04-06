"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Dumbbell, ListChecks, Zap, StretchHorizontal, HeartPulse, Trophy, Settings, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { exerciseLibrary } from "@/data/exercises";
import { getCustomExercises } from "@/lib/custom-exercises";
import { getRoutines } from "@/lib/routines-storage";
import { PROGRAM_LIBRARY } from "@/data/program-library";
import { STRETCHES, STRETCH_ROUTINES } from "@/data/stretches";
import { CARDIO_TEMPLATES } from "@/data/cardio-templates";
import { BADGE_DEFINITIONS } from "@/lib/achievements";
import { mealPlan } from "@/data/nutrition";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import type { LucideIcon } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: LucideIcon;
  href: string;
}

const SETTING_ITEMS: { label: string; desc: string; href: string }[] = [
  { label: "Tema oscuro", desc: "Apariencia", href: "/settings" },
  { label: "Unidades", desc: "kg / lbs", href: "/settings" },
  { label: "Idioma", desc: "Español / English", href: "/settings" },
  { label: "Notificaciones", desc: "Recordatorio diario", href: "/settings" },
  { label: "Google Fit", desc: "Integración salud", href: "/settings" },
  { label: "Backup", desc: "Exportar / Importar datos", href: "/settings" },
  { label: "Meta de sueño", desc: "Horas objetivo", href: "/settings" },
];

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Exercises (library)
  for (const ex of exerciseLibrary) {
    results.push({
      id: `ex-${ex.id}`,
      title: ex.name,
      subtitle: `${ex.category} · ${ex.primaryMuscles.join(", ")}`,
      category: t("common.exercises") || "Ejercicios",
      icon: Dumbbell,
      href: `/exercises/${ex.id}`,
    });
  }

  // Custom exercises
  for (const ex of getCustomExercises()) {
    results.push({
      id: `cex-${ex.id}`,
      title: ex.name,
      subtitle: `Custom · ${ex.primaryMuscles.join(", ")}`,
      category: t("common.exercises") || "Ejercicios",
      icon: Dumbbell,
      href: `/exercises/${ex.id}`,
    });
  }

  // Routines
  for (const r of getRoutines()) {
    results.push({
      id: `rt-${r.id}`,
      title: r.name,
      subtitle: r.description || `${r.daysPerWeek} ${t("common.days") || "días"}/sem`,
      category: "Rutinas",
      icon: ListChecks,
      href: `/routines/${r.id}`,
    });
  }

  // Programs
  for (const p of PROGRAM_LIBRARY) {
    results.push({
      id: `pg-${p.id}`,
      title: p.name,
      subtitle: `${p.category} · ${p.level} · ${p.daysPerWeek}d/sem`,
      category: "Programas",
      icon: Zap,
      href: `/programs/${p.id}`,
    });
  }

  // Stretches
  for (const s of STRETCHES) {
    results.push({
      id: `st-${s.id}`,
      title: s.name,
      subtitle: s.muscles.join(", "),
      category: "Stretching",
      icon: StretchHorizontal,
      href: "/stretching",
    });
  }

  // Stretch routines
  for (const sr of STRETCH_ROUTINES) {
    results.push({
      id: `sr-${sr.id}`,
      title: sr.name,
      subtitle: sr.description || `${sr.durationMin} min`,
      category: "Stretching",
      icon: StretchHorizontal,
      href: "/stretching",
    });
  }

  // Cardio
  for (const c of CARDIO_TEMPLATES) {
    results.push({
      id: `cd-${c.id}`,
      title: c.name,
      subtitle: c.description || `${c.type} · ${c.durationMin} min`,
      category: "Cardio",
      icon: HeartPulse,
      href: "/cardio",
    });
  }

  // Meals
  for (const slot of mealPlan) {
    for (const meal of slot.options) {
      results.push({
        id: `meal-${slot.slot}-${meal.name}`,
        title: meal.name,
        subtitle: `${meal.calories} kcal · ${meal.protein}g prot`,
        category: "Nutrición",
        icon: UtensilsCrossed,
        href: "/nutrition",
      });
    }
  }

  // Badges
  for (const b of BADGE_DEFINITIONS) {
    results.push({
      id: `badge-${b.id}`,
      title: b.name,
      subtitle: b.description,
      category: "Logros",
      icon: Trophy,
      href: "/achievements",
    });
  }

  // Settings
  for (const s of SETTING_ITEMS) {
    results.push({
      id: `set-${s.label}`,
      title: s.label,
      subtitle: s.desc,
      category: "Config",
      icon: Settings,
      href: s.href,
    });
  }

  return results;
}

const MAX_RESULTS = 30;

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const index = useMemo(() => buildIndex(), []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    const words = q.split(/\s+/);
    const filtered = index.filter((item) => {
      const text = normalize(`${item.title} ${item.subtitle} ${item.category}`);
      return words.every((w) => text.includes(w));
    });
    return filtered.slice(0, MAX_RESULTS);
  }, [query, index]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const arr = map.get(r.category) || [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return map;
  }, [results]);

  return (
    <PageTransition>
      <main className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Search bar */}
        <div className="sticky top-0 z-20 px-4 pt-3 pb-2" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 border-none bg-transparent cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="w-full py-2.5 pl-9 pr-9 rounded-xl text-[0.82rem]"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          {/* Empty state */}
          {query.length < 2 && (
            <div className="text-center mt-16">
              <Search size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
              <p className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                {t("search.hint")}
              </p>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && results.length === 0 && (
            <div className="text-center mt-16">
              <p className="text-[0.8rem] font-semibold" style={{ color: "var(--text-secondary)" }}>
                {t("search.noResults")}
              </p>
              <p className="text-[0.7rem] mt-1" style={{ color: "var(--text-muted)" }}>
                {t("search.tryAnother")}
              </p>
            </div>
          )}

          {/* Results grouped */}
          {[...grouped.entries()].map(([category, items]) => (
            <div key={category} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.6rem] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
                  {category}
                </span>
                <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  {items.length}
                </span>
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl mb-1.5 text-left border-none cursor-pointer transition-colors"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-soft)" }}>
                      <Icon size={15} style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.78rem] font-semibold truncate" style={{ color: "var(--text)" }}>
                        {item.title}
                      </div>
                      <div className="text-[0.62rem] truncate" style={{ color: "var(--text-muted)" }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>
    </PageTransition>
  );
}
