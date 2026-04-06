"use client";

import { useEffect, useState } from "react";
import {
  BADGE_DEFINITIONS,
  CATEGORY_LABELS,
  TIER_COLORS,
  evaluateAchievements,
  getAchievementStats,
  type BadgeCategory,
  type BadgeDefinition,
  type UnlockedBadge,
} from "@/lib/achievements";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerList, StaggerItem, CelebrationPop } from "@/components/motion";
import { t } from "@/lib/i18n";

export default function AchievementsPage() {
  const [unlocked, setUnlocked] = useState<UnlockedBadge[]>([]);
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [stats, setStats] = useState({ unlocked: 0, total: 0, percentage: 0 });
  const [filter, setFilter] = useState<BadgeCategory | "all">("all");

  useEffect(() => {
    const result = evaluateAchievements();
    setUnlocked(result.unlocked);
    setNewBadges(result.newlyUnlocked);
    setStats(getAchievementStats());
  }, []);

  const unlockedIds = new Set(unlocked.map((b) => b.id));

  const categories: (BadgeCategory | "all")[] = [
    "all",
    "consistency",
    "sessions",
    "volume",
    "strength",
    "body",
    "exploration",
  ];

  const filtered =
    filter === "all"
      ? BADGE_DEFINITIONS
      : BADGE_DEFINITIONS.filter((b) => b.category === filter);

  const getUnlockDate = (id: string) => {
    const badge = unlocked.find((b) => b.id === id);
    if (!badge) return null;
    return new Date(badge.unlockedAt).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <PageTransition>
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/profile" style={{ color: "var(--accent)" }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          {t("achievements.title")}
        </h1>
        <span
          className="ml-auto text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          {stats.unlocked}/{stats.total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <Trophy size={20} style={{ color: "#FFD700" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {stats.percentage}{t("achievements.percentComplete")}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${stats.percentage}%`,
              background: "linear-gradient(90deg, var(--accent), #FFD700)",
            }}
          />
        </div>
      </div>

      {/* New Badges Toast */}
      {newBadges.length > 0 && (
        <div className="px-4 py-2">
          <div
            className="rounded-xl p-3 flex flex-col gap-1"
            style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(10,132,255,0.1))",
              border: "1px solid rgba(255,215,0,0.3)",
            }}
          >
            <span className="text-xs font-semibold" style={{ color: "#FFD700" }}>
              {t("achievements.newUnlocked")}
            </span>
            {newBadges.map((b) => (
              <span key={b.id} className="text-sm" style={{ color: "var(--text)" }}>
                {b.icon} {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map((cat) => {
            const active = filter === cat;
            const label = cat === "all" ? t("achievements.allFilter") : CATEGORY_LABELS[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  background: active ? "var(--accent)" : "var(--bg-card)",
                  color: active ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges Grid */}
      <StaggerList className="px-4 py-2 grid grid-cols-3 gap-3">
        {filtered.map((badge) => {
          const isUnlocked = unlockedIds.has(badge.id);
          const unlockDate = getUnlockDate(badge.id);
          return (
            <StaggerItem
              key={badge.id}
              className="rounded-xl p-3 flex flex-col items-center text-center gap-1 relative"
              style={{
                background: isUnlocked ? "var(--bg-card)" : "var(--bg-elevated)",
                border: `1px solid ${isUnlocked ? TIER_COLORS[badge.tier] + "60" : "var(--border)"}`,
                opacity: isUnlocked ? 1 : 0.5,
              }}
            >
              <div className="text-2xl mb-1">
                {isUnlocked ? badge.icon : <Lock size={20} style={{ color: "var(--text-muted)" }} />}
              </div>
              <span
                className="text-xs font-semibold leading-tight"
                style={{ color: isUnlocked ? "var(--text)" : "var(--text-muted)" }}
              >
                {badge.name}
              </span>
              <span
                className="text-[10px] leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                {badge.description}
              </span>
              {isUnlocked && unlockDate && (
                <span
                  className="text-[9px] mt-1"
                  style={{ color: TIER_COLORS[badge.tier] }}
                >
                  {unlockDate}
                </span>
              )}
              {/* Tier indicator */}
              <div
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: TIER_COLORS[badge.tier] }}
              />
            </StaggerItem>
          );
        })}
      </StaggerList>

      {/* New Badge Celebration Overlay */}
      {newBadges.length > 0 && (
        <CelebrationPop className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-7xl animate-bounce">{newBadges[0].icon}</div>
        </CelebrationPop>
      )}
    </div>
    </PageTransition>
  );
}
