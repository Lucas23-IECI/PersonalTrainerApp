"use client";

import Link from "next/link";
import { Scale, Calculator, Camera, Plus, Moon, Timer, StretchHorizontal, HeartPulse } from "lucide-react";

interface Props {
  onOpenCheckin: () => void;
  onOpenSleep: () => void;
}

const chips = [
  { label: "Pesar", icon: Scale, action: "checkin" as const },
  { label: "Sueño", icon: Moon, action: "sleep" as const },
  { label: "Timer", icon: Timer, href: "/timer" },
  { label: "Stretching", icon: StretchHorizontal, href: "/stretching" },
  { label: "Cardio", icon: HeartPulse, href: "/cardio" },
  { label: "Calculadoras", icon: Calculator, href: "/calculators" },
  { label: "Fotos", icon: Camera, href: "/photos" },
  { label: "Entreno vacío", icon: Plus, href: "/workout/session" },
];

export default function QuickActionsChips({ onOpenCheckin, onOpenSleep }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1 scrollbar-hide">
      {chips.map((chip) => {
        const Icon = chip.icon;
        if (chip.action === "checkin") {
          return (
            <button
              key={chip.label}
              onClick={onOpenCheckin}
              className="quick-chip"
            >
              <Icon size={14} />
              <span>{chip.label}</span>
            </button>
          );
        }
        if (chip.action === "sleep") {
          return (
            <button
              key={chip.label}
              onClick={onOpenSleep}
              className="quick-chip"
            >
              <Icon size={14} />
              <span>{chip.label}</span>
            </button>
          );
        }
        return (
          <Link key={chip.label} href={chip.href!} className="quick-chip no-underline">
            <Icon size={14} />
            <span>{chip.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
