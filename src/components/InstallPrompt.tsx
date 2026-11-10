"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "install-dismissed";

/**
 * Aviso para instalar la app en el celular.
 * Android/Chrome: botón que abre el instalador del sistema.
 * iPhone/Safari: instrucciones (Apple no permite un botón directo).
 * No se muestra si la app ya está instalada o si el usuario lo cerró.
 */
export default function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [evt, setEvt] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === "1"; } catch {}
    if (standalone || dismissed) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    if (isIOS) setMode("ios");

    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setMode("android"); };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setMode(null);
  };

  return (
    <div className="card relative flex items-center gap-3 border-l-4 border-accent-500 p-3 pr-9">
      <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-slate-200" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-display font-bold">Instala la app en tu celular</p>
        {mode === "android" ? (
          <p className="text-xs text-gray-cool">Ábrela desde un ícono, como cualquier app.</p>
        ) : (
          <p className="text-xs text-gray-cool">
            En Safari toca <b>Compartir</b> <span aria-hidden>⬆️</span> y luego <b>“Agregar a inicio”</b>.
          </p>
        )}
      </div>
      {mode === "android" && evt && (
        <button
          onClick={async () => { await evt.prompt(); await evt.userChoice; setEvt(null); setMode(null); }}
          className="btn-accent shrink-0 px-3 py-2 text-xs"
        >
          Instalar
        </button>
      )}
      <button onClick={dismiss} aria-label="Cerrar" className="absolute right-2 top-2 p-1 text-lg leading-none text-gray-cool">×</button>
    </div>
  );
}
