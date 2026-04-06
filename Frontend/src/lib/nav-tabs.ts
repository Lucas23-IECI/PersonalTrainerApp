import {
  Home,
  Dumbbell,
  Target,
  UtensilsCrossed,
  ClipboardList,
  User,
  HeartPulse,
  Moon,
  StretchHorizontal,
  Timer,
  Trophy,
  Camera,
  Calculator,
  Activity,
  CalendarRange,
  Brain,
  Gauge,
  BarChart3,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { getSettings } from "./storage";

export interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** All available tabs the user can choose from */
export const ALL_TABS: NavTab[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workout", label: "Entreno", icon: Dumbbell },
  { href: "/exercises", label: "Músculos", icon: Target },
  { href: "/nutrition", label: "Nutrición", icon: UtensilsCrossed },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/health", label: "Salud", icon: Activity },
  { href: "/sleep", label: "Sueño", icon: Moon },
  { href: "/stretching", label: "Stretching", icon: StretchHorizontal },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/photos", label: "Fotos", icon: Camera },
  { href: "/calculators", label: "Calculadoras", icon: Calculator },
  { href: "/cardio", label: "Cardio", icon: HeartPulse },
  { href: "/planning", label: "Planificación", icon: CalendarRange },
  { href: "/coach", label: "Coach IA", icon: Brain },
  { href: "/performance", label: "Performance", icon: Gauge },
  { href: "/forecast", label: "Predicciones", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/phase-review", label: "Revisión Fase", icon: ClipboardCheck },
  { href: "/readiness", label: "Preparación", icon: ShieldCheck },
];

export const DEFAULT_TAB_HREFS = ["/", "/workout", "/exercises", "/nutrition", "/log", "/profile"];

/** Get the user's currently selected nav tabs */
export function getNavTabs(): NavTab[] {
  const settings = getSettings();
  const selected = settings.customTabs || DEFAULT_TAB_HREFS;
  const tabs: NavTab[] = [];
  for (const href of selected) {
    const tab = ALL_TABS.find((t) => t.href === href);
    if (tab) tabs.push(tab);
  }
  if (tabs.length < 3) return ALL_TABS.filter((t) => DEFAULT_TAB_HREFS.includes(t.href));
  return tabs;
}

/** Get just the routes in order for swipe navigation */
export function getNavRoutes(): string[] {
  return getNavTabs().map((t) => t.href);
}
