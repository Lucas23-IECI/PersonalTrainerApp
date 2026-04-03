"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  UtensilsCrossed,
  ClipboardList,
  TrendingUp,
  Home,
  Target,
  User,
} from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workout", label: "Entreno", icon: Dumbbell },
  { href: "/exercises", label: "Músculos", icon: Target },
  { href: "/nutrition", label: "Nutrición", icon: UtensilsCrossed },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/profile", label: "Perfil", icon: User },
];

export default function Navigation() {
  const pathname = usePathname();

  // Hide nav on onboarding and workout session
  if (pathname === "/onboarding" || pathname === "/workout/session") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around"
      style={{
        background: "var(--nav-bg, rgba(255, 255, 255, 0.94))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--nav-border, rgba(0, 0, 0, 0.08))",
        padding: "6px 0 max(10px, env(safe-area-inset-bottom))",
      }}
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 no-underline"
            style={{
              color: active ? "var(--accent)" : "var(--text-muted)",
              fontSize: "0.58rem",
              fontWeight: active ? 700 : 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              minWidth: 48,
              transition: "color 0.2s ease",
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl transition-all"
              style={{
                width: 36,
                height: 28,
                background: active ? "var(--ring)" : "transparent",
              }}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 1.5} />
            </div>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
