"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import Avatar from "./Avatar";
import Logo from "./Logo";

export function Header({ profile }: { profile: Profile | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="COINER PADEL TOUR - Inicio"><Logo /></Link>
        {profile ? (
          <Link href="/mi-perfil" className="flex items-center gap-2 text-sm">
            <span className="hidden font-semibold sm:inline">{profile.nickname || profile.first_name}</span>
            <Avatar src={profile.avatar_url} name={profile.first_name} size={32} />
          </Link>
        ) : (
          <Link href="/login" className="rounded-xl bg-accent-500 px-3 py-1.5 font-display text-sm font-bold text-white">Ingresar</Link>
        )}
      </div>
    </header>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export function BottomNav({ isAdmin, loggedIn }: { isAdmin: boolean; loggedIn: boolean }) {
  const path = usePathname();
  // Resalta al instante el botón tocado, sin esperar a que llegue la página
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [path]);

  const items = [
    { href: "/", label: "Inicio", d: "M3 11l9-8 9 8M5 10v10h14V10" },
    { href: "/ranking", label: "Ranking", d: "M8 21V11M16 21V7M12 21V3M4 21h16" },
    { href: "/galeria", label: "Galería", d: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01" },
    { href: loggedIn ? "/mi-perfil" : "/login", label: loggedIn ? "Mi perfil" : "Ingresar", d: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" }] : []),
  ];
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const current = pending ?? items.find((it) => isActive(it.href))?.href;

  return (
    <>
      {pending && <div className="nav-progress fixed inset-x-0 top-0 z-50 h-1 bg-accent-500" />}
      {/* Barra flotante: separada de los bordes y esquinas redondeadas de la pantalla */}
      <nav className="fixed bottom-[max(env(safe-area-inset-bottom),12px)] left-[max(env(safe-area-inset-left),12px)] right-[max(env(safe-area-inset-right),12px)] z-30 mx-auto max-w-md rounded-[1.75rem] bg-white shadow-[0_8px_30px_rgba(10,42,91,0.18)] ring-1 ring-slate-200 backdrop-blur">
        <ul className="flex px-1.5 py-1">
          {items.map((it) => {
            const active = current === it.href;
            return (
              <li key={it.href} className="flex-1">
                <Link
                  href={it.href}
                  prefetch
                  onClick={() => !isActive(it.href) && setPending(it.href)}
                  className={cn(
                    "relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold transition-colors duration-150 active:scale-90 motion-safe:transition-transform",
                    active ? "text-brand-700" : "text-gray-cool",
                  )}
                >
                  <span className={cn("rounded-full px-4 py-0.5 transition-colors duration-150", active && "bg-brand-50")}>
                    <Icon d={it.d} />
                  </span>
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
