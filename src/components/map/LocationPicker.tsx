"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, CircleMarker } from "leaflet";

type Result = { display_name: string; lat: string; lon: string };
const DEFAULT: [number, number] = [-34.6037, -58.3816]; // Buenos Aires

/**
 * Mapa para marcar la ubicación del lugar: tocar el mapa, buscar una dirección
 * o usar la ubicación actual. Envía lat/lng en inputs ocultos del formulario.
 */
export default function LocationPicker({ lat, lng, place }: { lat: number | null; lng: number | null; place: string | null }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const marker = useRef<CircleMarker | null>(null);
  const [pos, setPos] = useState<[number, number] | null>(lat != null && lng != null ? [lat, lng] : null);
  const [q, setQ] = useState(place ?? "");
  const [results, setResults] = useState<Result[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current || map.current) return;
      const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView(pos ?? DEFAULT, pos ? 16 : 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(m);
      const mk = L.circleMarker(pos ?? DEFAULT, { radius: 11, color: "#fff", weight: 3, fillColor: "#F57C00", fillOpacity: 1 });
      if (pos) mk.addTo(m);
      m.on("click", (e) => place_(e.latlng.lat, e.latlng.lng, false));
      map.current = m;
      marker.current = mk;
      // El mapa vive dentro de un modal: recalcular tamaño cuando ya está visible
      setTimeout(() => m.invalidateSize(), 200);
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function place_(la: number, ln: number, fly = true) {
    const p: [number, number] = [Number(la.toFixed(6)), Number(ln.toFixed(6))];
    setPos(p);
    setResults([]);
    if (map.current && marker.current) {
      marker.current.setLatLng(p).addTo(map.current);
      if (fly) map.current.setView(p, 17);
    }
  }

  async function search() {
    if (!q.trim()) return;
    setMsg("Buscando…");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=es&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as Result[];
      setResults(data);
      setMsg(data.length ? null : "No se encontró. Prueba con calle y número, o toca el mapa.");
    } catch {
      setMsg("No se pudo buscar. Toca el mapa para marcar el lugar.");
    }
  }

  function useMine() {
    if (!navigator.geolocation) return setMsg("Tu navegador no permite obtener la ubicación.");
    setMsg("Obteniendo tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (p) => { place_(p.coords.latitude, p.coords.longitude); setMsg(null); },
      () => setMsg("No se pudo obtener tu ubicación (revisa los permisos)."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clear() {
    setPos(null);
    if (marker.current && map.current) marker.current.remove();
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="lat" value={pos ? String(pos[0]) : ""} />
      <input type="hidden" name="lng" value={pos ? String(pos[1]) : ""} />

      <div className="flex gap-2">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar dirección o club"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }} />
        <button type="button" onClick={search} className="btn-secondary shrink-0 px-3">Buscar</button>
      </div>
      {results.length > 0 && (
        <ul className="card max-h-40 divide-y divide-gray-light overflow-y-auto text-sm">
          {results.map((r) => (
            <li key={r.lat + r.lon}>
              <button type="button" onClick={() => place_(Number(r.lat), Number(r.lon))} className="w-full px-3 py-2 text-left">{r.display_name}</button>
            </li>
          ))}
        </ul>
      )}

      <div ref={box} className="relative z-0 h-56 w-full overflow-hidden rounded-xl ring-1 ring-slate-300" />

      <div className="flex items-center justify-between gap-2 text-xs">
        <button type="button" onClick={useMine} className="font-semibold text-brand-700">📍 Usar mi ubicación</button>
        {pos ? (
          <span className="flex items-center gap-2 text-gray-cool">
            Marcado ✓
            <button type="button" onClick={clear} className="font-semibold text-red-600">Quitar</button>
          </span>
        ) : (
          <span className="text-gray-cool">Toca el mapa para marcar el lugar</span>
        )}
      </div>
      {msg && <p className="text-xs text-gray-cool">{msg}</p>}
    </div>
  );
}
