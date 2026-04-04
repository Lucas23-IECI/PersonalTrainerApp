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
        background: "var(--nav-bg, rgba(255, 255, 255, 0.96))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--nav-border, rgba(0, 0, 0, 0.06))",
        padding: "4px 0 max(8px, env(safe-area-inset-bottom))",
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
              fontSize: "0.56rem",
              fontWeight: active ? 600 : 400,
              letterSpacing: "0.02em",
              minWidth: 44,
              transition: "color 0.15s ease",
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
