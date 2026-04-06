"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home, Dumbbell, Target, UtensilsCrossed, ClipboardList, User,
  Activity, Moon, StretchHorizontal, Timer, Trophy, Camera,
  Calculator, HeartPulse, CalendarRange, Brain, Gauge, BarChart3,
  Sparkles, ClipboardCheck, ShieldCheck, CheckSquare, Scan,
  Settings, Download, CloudCog, Zap, Calendar, TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface FeatureItem {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

interface FeatureSection {
  title: string;
  items: FeatureItem[];
}

const SECTIONS: FeatureSection[] = [
  {
    title: "🏋️ Entrenamiento",
    items: [
      { href: "/workout", label: "Entreno", icon: Dumbbell, color: "#4F8CFF", description: "Plan semanal y sesiones" },
      { href: "/exercises", label: "Músculos", icon: Target, color: "#F97316", description: "Ejercicios por grupo muscular" },
      { href: "/routines", label: "Rutinas", icon: ClipboardList, color: "#8B5CF6", description: "Programas y rutinas custom" },
      { href: "/timer", label: "Timer", icon: Timer, color: "#EF4444", description: "Cronómetro de descanso" },
      { href: "/stretching", label: "Stretching", icon: StretchHorizontal, color: "#14B8A6", description: "Rutinas de flexibilidad" },
      { href: "/cardio", label: "Cardio", icon: HeartPulse, color: "#EC4899", description: "Sesiones cardiovasculares" },
    ],
  },
  {
    title: "📊 Progreso y Análisis",
    items: [
      { href: "/progress", label: "Progreso", icon: TrendingUp, color: "#22C55E", description: "Gráficos e historial" },
      { href: "/log", label: "Historial", icon: ClipboardList, color: "#6366F1", description: "Todas tus sesiones" },
      { href: "/performance", label: "Performance", icon: Gauge, color: "#F59E0B", description: "Métricas de rendimiento" },
      { href: "/forecast", label: "Predicciones", icon: BarChart3, color: "#0EA5E9", description: "Proyecciones de progreso" },
      { href: "/insights", label: "Insights", icon: Sparkles, color: "#A855F7", description: "Análisis inteligente" },
      { href: "/achievements", label: "Logros", icon: Trophy, color: "#F59E0B", description: "Badges y récords" },
    ],
  },
  {
    title: "🍎 Salud y Bienestar",
    items: [
      { href: "/nutrition", label: "Nutrición", icon: UtensilsCrossed, color: "#22C55E", description: "Comidas y macros" },
      { href: "/health", label: "Salud", icon: Activity, color: "#EF4444", description: "Dashboard de salud" },
      { href: "/sleep", label: "Sueño", icon: Moon, color: "#818CF8", description: "Registro de sueño" },
      { href: "/readiness", label: "Preparación", icon: ShieldCheck, color: "#14B8A6", description: "¿Listo para entrenar?" },
      { href: "/habits", label: "Hábitos", icon: CheckSquare, color: "#F97316", description: "Tracking de hábitos" },
      { href: "/face", label: "Face Care", icon: Scan, color: "#EC4899", description: "Rutina facial" },
    ],
  },
  {
    title: "🧠 Planificación e IA",
    items: [
      { href: "/planning", label: "Planificación", icon: CalendarRange, color: "#6366F1", description: "Calendario y planning" },
      { href: "/coach", label: "Coach IA", icon: Brain, color: "#A855F7", description: "Asistente inteligente" },
      { href: "/phase-review", label: "Revisión Fase", icon: ClipboardCheck, color: "#0EA5E9", description: "Retrospectiva de fase" },
      { href: "/calculators", label: "Calculadoras", icon: Calculator, color: "#F97316", description: "1RM, TDEE, Macros, Wilks" },
    ],
  },
  {
    title: "⚙️ Perfil y Herramientas",
    items: [
      { href: "/profile", label: "Perfil", icon: User, color: "#4F8CFF", description: "Tu perfil y mediciones" },
      { href: "/photos", label: "Fotos", icon: Camera, color: "#EC4899", description: "Galería de progreso" },
      { href: "/weekly-report", label: "Reporte Semanal", icon: Calendar, color: "#22C55E", description: "Resumen de la semana" },
      { href: "/widgets", label: "Widgets", icon: Zap, color: "#F59E0B", description: "Dashboard rápido" },
      { href: "/cloud-sync", label: "Cloud Sync", icon: CloudCog, color: "#0EA5E9", description: "Respaldo en la nube" },
      { href: "/descargar", label: "Descargar App", icon: Download, color: "#22C55E", description: "Última versión APK" },
      { href: "/settings", label: "Ajustes", icon: Settings, color: "#6B7280", description: "Configuración general" },
    ],
  },
];

export default function MorePage() {
  const router = useRouter();

  return (
    <div className="p-4 pb-28 max-w-[540px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-transparent border-none cursor-pointer"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
          Todas las Secciones
        </h1>
      </div>

      {/* Feature sections */}
      <div className="flex flex-col gap-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-[0.8rem] font-bold mb-2.5 pl-1" style={{ color: "var(--text-secondary)" }}>
              {section.title}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card flex flex-col items-center text-center py-3 px-2 no-underline hover:scale-[1.02] active:scale-95 transition-transform"
                  style={{ borderColor: item.color + "30" }}
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl mb-2"
                    style={{ background: item.color + "18" }}
                  >
                    <item.icon size={20} style={{ color: item.color }} />
                  </div>
                  <span className="text-[0.72rem] font-bold leading-tight" style={{ color: "var(--text)" }}>
                    {item.label}
                  </span>
                  <span className="text-[0.55rem] mt-0.5 leading-tight" style={{ color: "var(--text-muted)" }}>
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
