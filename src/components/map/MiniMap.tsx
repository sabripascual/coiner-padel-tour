"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

/** Mapa chico, sin interacción, para las próximas fechas. Tocarlo abre Google Maps. */
export default function MiniMap({ lat, lng, href }: { lat: number; lng: number; href: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let m: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current) return;
      m = L.map(box.current, {
        zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
        doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false,
      }).setView([lat, lng], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(m);
      L.circleMarker([lat, lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#F57C00", fillOpacity: 1 }).addTo(m);
    })();
    return () => { cancelled = true; m?.remove(); };
  }, [lat, lng]);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Abrir en Google Maps" className="relative block">
      <div ref={box} className="pointer-events-none relative z-0 h-28 w-full overflow-hidden rounded-xl bg-soft-blue" />
      <span className="absolute bottom-2 right-2 rounded-lg bg-accent-500 px-2.5 py-1 font-display text-xs font-bold text-white shadow">Cómo llegar ↗</span>
      <span className="absolute bottom-1 left-2 text-[9px] text-navy/60">© OpenStreetMap</span>
    </a>
  );
}
