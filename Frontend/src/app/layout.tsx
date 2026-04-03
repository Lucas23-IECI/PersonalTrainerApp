import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import OnboardingGate from "@/components/OnboardingGate";
import PWAManager from "@/components/PWAManager";

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
  themeColor: "#0A84FF",
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
        <OnboardingGate />
        <PWAManager />
        <div className="pb-[70px]">
          {children}
        </div>
        <Navigation />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var t = localStorage.getItem('mark-pt-theme');
                if (t === 'dark') document.documentElement.setAttribute('data-theme','dark');
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
