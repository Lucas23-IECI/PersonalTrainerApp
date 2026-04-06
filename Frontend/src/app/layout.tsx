import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import OnboardingGate from "@/components/OnboardingGate";
import PWAManager from "@/components/PWAManager";
import ActiveWorkoutBar from "@/components/ActiveWorkoutBar";
import UpdateChecker from "@/components/UpdateChecker";
import SplashScreen from "@/components/SplashScreen";
import AutoBackup from "@/components/AutoBackup";
import ErrorBoundary from "@/components/ErrorBoundary";
import SwipeNavigation from "@/components/SwipeNavigation";
import DeepLinkHandler from "@/components/DeepLinkHandler";

export const metadata: Metadata = {
  title: "MARK PT - Personal Trainer",
  description: "Tu Personal Trainer AI de élite",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MARK PT",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F8CFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icon-512.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <SplashScreen />
        <AutoBackup />
        <DeepLinkHandler />
        <OnboardingGate />
        <PWAManager />
        <UpdateChecker />
        <ErrorBoundary>
          <SwipeNavigation>
            <div className="pb-[70px]">
              {children}
            </div>
          </SwipeNavigation>
        </ErrorBoundary>
        <ActiveWorkoutBar />
        <Navigation />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var t = localStorage.getItem('mark-pt-theme');
                if (t === 'dark') document.documentElement.setAttribute('data-theme','dark');
                try {
                  var s = JSON.parse(localStorage.getItem('mark-pt-settings') || '{}');
                  if (s.accentColor && s.accentColor !== 'blue') document.documentElement.setAttribute('data-accent', s.accentColor);
                  if (s.layoutDensity && s.layoutDensity !== 'default') document.documentElement.setAttribute('data-density', s.layoutDensity);
                  if (s.fontScale && s.fontScale !== 1) document.documentElement.setAttribute('data-font-scale', String(s.fontScale));
                } catch(e){}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
