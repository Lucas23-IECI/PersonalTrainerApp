"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || pathname === "/onboarding") return;
    checked.current = true;
    const done = localStorage.getItem("mark-pt-onboarding-done");
    if (!done) router.replace("/onboarding");
  }, [pathname, router]);

  return null;
}
