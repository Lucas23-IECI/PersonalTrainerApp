"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavTabs, type NavTab } from "@/lib/nav-tabs";

export default function Navigation() {
  const pathname = usePathname();
  const [tabs, setTabs] = useState<NavTab[]>([]);

  useEffect(() => {
    setTabs(getNavTabs());
    const onStorage = () => setTabs(getNavTabs());
    window.addEventListener("storage", onStorage);
    window.addEventListener("nav-tabs-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nav-tabs-changed", onStorage);
    };
  }, []);

  // Hide nav on onboarding and workout session
  if (pathname === "/onboarding" || pathname === "/workout/session") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid var(--nav-border)",
        padding: "6px 8px max(10px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex justify-around items-center max-w-[540px] mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-[3px] no-underline relative"
              style={{
                color: active ? "var(--accent)" : "var(--text-muted)",
                fontSize: "0.55rem",
                fontWeight: active ? 600 : 500,
                letterSpacing: "0.01em",
                minWidth: 48,
                transition: "color 0.2s ease",
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  width: 36,
                  height: 28,
                  background: active ? "var(--accent-soft)" : "transparent",
                }}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
