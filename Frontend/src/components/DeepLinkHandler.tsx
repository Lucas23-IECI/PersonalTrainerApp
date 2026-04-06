"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNative } from "@/lib/native";

const DEEP_LINK_MAP: Record<string, string> = {
  workout: "/workout",
  log: "/log",
  nutrition: "/nutrition",
  timer: "/timer",
  progress: "/progress",
  profile: "/profile",
  settings: "/settings",
  exercises: "/exercises",
  calculators: "/calculators",
};

export default function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isNative()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");

        // Handle URL that opened the app (cold start)
        const { url } = await App.getLaunchUrl() ?? { url: null };
        if (url) handleUrl(url);

        // Handle URL while app is running (warm start)
        const listener = await App.addListener("appUrlOpen", (data) => {
          handleUrl(data.url);
        });

        cleanup = () => listener.remove();
      } catch { /* not native */ }
    })();

    function handleUrl(url: string) {
      try {
        // markpt://workout → path = "workout"
        const parsed = new URL(url);
        const path = parsed.hostname || parsed.pathname.replace(/^\/+/, "");
        const route = DEEP_LINK_MAP[path];
        if (route) router.push(route);
      } catch { /* invalid URL */ }
    }

    return () => cleanup?.();
  }, [router]);

  return null;
}
