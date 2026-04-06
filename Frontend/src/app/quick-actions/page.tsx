"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Dumbbell, Weight, UtensilsCrossed, Calculator, Cloud, BarChart3, Settings, Zap } from "lucide-react";

import { PageTransition } from "@/components/motion";
import { t } from "@/lib/i18n";
const ACTIONS = [
  { href: "/workout", labelKey: "quickActions.startWorkout", descKey: "quickActions.startWorkoutDesc", icon: Dumbbell, gradient: "from-[#30D158] to-[#34C759]" },
  { href: "/progress", labelKey: "quickActions.logWeight", descKey: "quickActions.logWeightDesc", icon: Weight, gradient: "from-[var(--accent)] to-[var(--accent)]" },
  { href: "/nutrition", labelKey: "nav.nutrition", descKey: "quickActions.nutritionDesc", icon: UtensilsCrossed, gradient: "from-[#FF9500] to-[#FF6B00]" },
  { href: "/calculators", labelKey: "quickActions.calculators", descKey: "quickActions.calculatorsDesc", icon: Calculator, gradient: "from-[#AF52DE] to-[#5856D6]" },
  { href: "/cloud-sync", labelKey: "cloudSync.title", descKey: "quickActions.cloudSyncDesc", icon: Cloud, gradient: "from-[#64D2FF] to-[var(--accent)]" },
  { href: "/widgets", labelKey: "widgets.title", descKey: "quickActions.statsDesc", icon: BarChart3, gradient: "from-[#FF2D55] to-[#FF375F]" },
  { href: "/settings", labelKey: "settings.title", descKey: "quickActions.settingsDesc", icon: Settings, gradient: "from-[#636366] to-[#48484A]" },
];

export default function QuickActionsPage() {
  const router = useRouter();

  return (
    <PageTransition>
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={16} /> {t("common.back")}
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Zap size={20} style={{ color: "var(--accent)" }} />
        <h1 className="text-xl font-black tracking-tight">{t("quickActions.title")}</h1>
      </div>
      <p className="text-[0.7rem] mb-5" style={{ color: "var(--text-muted)" }}>
        {t("quickActions.description")}
      </p>

      <div className="space-y-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="card flex items-center gap-3 px-4 py-3.5 group hover:scale-[1.01] active:scale-[0.98] transition-transform no-underline"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0`}>
              <a.icon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block">{t(a.labelKey)}</span>
              <p className="text-[0.6rem] truncate" style={{ color: "var(--text-muted)" }}>{t(a.descKey)}</p>
            </div>
            <ChevronLeft size={16} className="rotate-180 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          </Link>
        ))}
      </div>

      <div className="card mt-5 p-4">
        <div className="text-[0.75rem] font-bold mb-2">{t("quickActions.appShortcuts")}</div>
        <p className="text-[0.65rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("quickActions.shortcutsHint")}
        </p>
      </div>
    </main>
    </PageTransition>
  );
}
