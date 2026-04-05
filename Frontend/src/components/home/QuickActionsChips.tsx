"use client";

import Link from "next/link";
import { Scale, Calculator, Camera, Plus } from "lucide-react";

interface Props {
  onOpenCheckin: () => void;
}

const chips = [
  { label: "Pesar", icon: Scale, action: "checkin" as const },
  { label: "Calculadoras", icon: Calculator, href: "/calculators" },
  { label: "Fotos", icon: Camera, href: "/photos" },
  { label: "Entreno vacío", icon: Plus, href: "/workout/session" },
];

export default function QuickActionsChips({ onOpenCheckin }: Props) {
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
