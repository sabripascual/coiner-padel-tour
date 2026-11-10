import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, BottomNav } from "@/components/Nav";
import { getCurrentProfile } from "@/lib/auth";
import RegisterSW from "@/components/RegisterSW";
import Footer from "@/components/Footer";
import AuthSync from "@/components/AuthSync";

// URL pública del sitio (Vercel la define sola); WhatsApp necesita links absolutos a la imagen
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "COINER PADEL TOUR", template: "%s · COINER PADEL TOUR" },
  description: "Ranking, fechas y recuerdos del torneo de pádel Coiner",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "COINER PADEL TOUR",
    title: "COINER PADEL TOUR",
    description: "Ranking, próximas fechas y recuerdos del torneo de pádel Coiner",
  },
  twitter: { card: "summary_large_image", title: "COINER PADEL TOUR" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Coiner Padel", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png?v=2", apple: "/icons/apple-touch-icon.png?v=2" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body className="flex min-h-dvh flex-col">
        <Header profile={profile} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">{children}</main>
        <Footer />
        <BottomNav isAdmin={!!profile?.is_admin} loggedIn={!!profile} />
        <RegisterSW />
        <AuthSync loggedIn={!!profile} />
      </body>
    </html>
  );
}
