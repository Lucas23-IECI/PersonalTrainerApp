"use client";

import { useRef, useState, useEffect } from "react";
import type { WorkoutDay } from "@/data/workouts";
import DayCard from "./DayCard";

interface CarouselViewProps {
  plan: WorkoutDay[];
  todayIndex: number; // index within the plan array
  onStart: (dayId: string) => void;
}

export default function CarouselView({ plan, todayIndex, onStart }: CarouselViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(todayIndex >= 0 ? todayIndex : 0);
  const [expanded, setExpanded] = useState<string | null>(
    plan[todayIndex >= 0 ? todayIndex : 0]?.id || null
  );

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current && todayIndex >= 0) {
      const el = scrollRef.current;
      const slideWidth = el.offsetWidth;
      el.scrollTo({ left: slideWidth * todayIndex, behavior: "instant" });
    }
  }, [todayIndex]);

  // Track active index on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          if (el) {
            const idx = Math.round(el.scrollLeft / el.offsetWidth);
            setActiveIndex(idx);
          }
          ticking = false;
        });
      }
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToIndex(i: number) {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.offsetWidth * i, behavior: "smooth" });
    }
    setActiveIndex(i);
    setExpanded(plan[i]?.id || null);
  }

  return (
    <div>
      {/* Day tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide">
        {plan.map((w, i) => {
          const isToday = i === todayIndex;
          const isActive = i === activeIndex;
          return (
            <button
              key={w.id}
              onClick={() => scrollToIndex(i)}
              className="shrink-0 px-2.5 py-1.5 rounded-lg text-[0.62rem] font-bold border-none cursor-pointer transition-all"
              style={{
                background: isActive ? w.color : "var(--bg-elevated)",
                color: isActive ? "#fff" : "var(--text-muted)",
                boxShadow: isToday && !isActive ? `inset 0 -2px 0 ${w.color}` : undefined,
              }}
            >
              {w.day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Snap-scroll carousel */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {plan.map((w, i) => (
          <div key={w.id} className="snap-center shrink-0 w-full" style={{ scrollSnapAlign: "center" }}>
            <DayCard
              workout={w}
              isToday={i === todayIndex}
              isExpanded={expanded === w.id}
              onToggle={() => setExpanded(expanded === w.id ? null : w.id)}
              onStart={onStart}
            />
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {plan.map((w, i) => (
          <div
            key={w.id}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: i === activeIndex ? w.color : "var(--border)",
              transform: i === activeIndex ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
