"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Dumbbell, Weight, UtensilsCrossed, Calculator, Cloud, BarChart3, Settings, Zap } from "lucide-react";

const ACTIONS = [
  { href: "/workout", label: "Iniciar Entreno", desc: "Empezá una sesión de entrenamiento", icon: Dumbbell, gradient: "from-[#30D158] to-[#34C759]" },
  { href: "/progress", label: "Registrar Peso", desc: "Anotá tu peso de hoy", icon: Weight, gradient: "from-[#0A84FF] to-[#2C6BED]" },
  { href: "/nutrition", label: "Nutrición", desc: "Log de comidas y macros", icon: UtensilsCrossed, gradient: "from-[#FF9500] to-[#FF6B00]" },
  { href: "/calculators", label: "Calculadoras", desc: "1RM, TDEE, Macros, Wilks", icon: Calculator, gradient: "from-[#AF52DE] to-[#5856D6]" },
  { href: "/cloud-sync", label: "Cloud Sync", desc: "Backup y restauración de datos", icon: Cloud, gradient: "from-[#64D2FF] to-[#0A84FF]" },
  { href: "/widgets", label: "Quick Stats", desc: "Resumen rápido de estadísticas", icon: BarChart3, gradient: "from-[#FF2D55] to-[#FF375F]" },
  { href: "/settings", label: "Ajustes", desc: "Configuración de la app", icon: Settings, gradient: "from-[#636366] to-[#48484A]" },
];

export default function QuickActionsPage() {
  const router = useRouter();

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-zinc-500 mb-4 bg-transparent border-none cursor-pointer p-0">
        <ChevronLeft size={16} /> Volver
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Zap size={20} style={{ color: "var(--accent)" }} />
        <h1 className="text-xl font-black tracking-tight">Acciones Rápidas</h1>
      </div>
      <p className="text-[0.7rem] text-zinc-500 mb-5">
        Accesos directos a las funciones más usadas. En Android, mantené presionado el ícono de MARK PT para ver estos atajos.
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
              <span className="font-bold text-sm block">{a.label}</span>
              <p className="text-[0.6rem] text-zinc-500 truncate">{a.desc}</p>
            </div>
            <ChevronLeft size={16} className="text-zinc-400 rotate-180 flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="card mt-5 p-4">
        <div className="text-[0.75rem] font-bold mb-2">📱 App Shortcuts (Android)</div>
        <p className="text-[0.65rem] text-zinc-500 leading-relaxed">
          Con la app instalada, mantené presionado el ícono de MARK PT en tu escritorio
          para acceder a &quot;Iniciar Entreno&quot;, &quot;Registrar Peso&quot; y &quot;Nutrición&quot; directamente
          sin abrir la app.
        </p>
      </div>
    </main>
  );
}
