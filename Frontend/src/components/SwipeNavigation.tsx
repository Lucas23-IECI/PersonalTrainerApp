"use client";

import { useRef, useCallback, useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getNavRoutes } from "@/lib/nav-tabs";

/**
 * Wrap page content to enable horizontal swipe navigation between main tabs.
 * Only triggers on dominant horizontal swipes > threshold px.
 */
export default function SwipeNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const startX = useRef(0);
  const startY = useRef(0);
  const THRESHOLD = 60;
  const [routes, setRoutes] = useState<string[]>([]);

  useEffect(() => {
    setRoutes(getNavRoutes());
    const onUpdate = () => setRoutes(getNavRoutes());
    window.addEventListener("nav-tabs-changed", onUpdate);
    return () => window.removeEventListener("nav-tabs-changed", onUpdate);
  }, []);

  // Only enable on main nav routes
  const currentIdx = routes.indexOf(pathname);
  const enabled = currentIdx !== -1;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Only trigger on dominant horizontal movement
      if (Math.abs(dx) < THRESHOLD || Math.abs(dy) > Math.abs(dx) * 0.7) return;

      if (dx < 0 && currentIdx < routes.length - 1) {
        router.push(routes[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        router.push(routes[currentIdx - 1]);
      }
    },
    [enabled, currentIdx, router, routes]
  );

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
