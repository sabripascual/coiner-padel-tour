import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, BottomNav } from "@/components/Nav";
import { getCurrentProfile } from "@/lib/auth";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: { default: "COINER PADEL TOUR", template: "%s · COINER PADEL TOUR" },
  description: "Ranking, fechas y recuerdos del torneo de pádel Coiner",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Coiner Padel", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B4EA2",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-dvh pb-24">
        <Header profile={profile} />
        <main className="mx-auto w-full max-w-3xl px-4 py-4">{children}</main>
        <BottomNav isAdmin={!!profile?.is_admin} loggedIn={!!profile} />
        <RegisterSW />
      </body>
    </html>
  );
}
