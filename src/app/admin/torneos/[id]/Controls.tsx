"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { deleteTournament, renameTournament, setEnrollment, setTournamentStatus, updateRound } from "../../actions";
import FormMessage from "@/components/FormMessage";
import type { Round, Tournament } from "@/lib/types";
import { DURATIONS, formatDuration } from "@/lib/utils";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-xl bg-slate-200" />,
});

export function TournamentControls({ tournament: t }: { tournament: Tournament }) {
  const [state, action] = useActionState(renameTournament, null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const change = (status: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setErr(null);
    start(async () => {
      try { await setTournamentStatus(t.id, status); } catch (e) { setErr((e as Error).message); }
    });
  };

  return (
    <div className="card space-y-3 p-4">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={t.id} />
        <input name="name" defaultValue={t.name} className="input" required />
        <button className="btn-secondary shrink-0">Renombrar</button>
      </form>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        {t.status === "borrador" && <button disabled={pending} onClick={() => change("en_curso")} className="btn-primary flex-1">▶ Iniciar torneo</button>}
        {t.status === "en_curso" && (
          <>
            <button disabled={pending} onClick={() => change("finalizado", "¿Finalizar el torneo? Se declararán campeona y campeón según el ranking actual.")} className="btn-accent flex-1">🏆 Finalizar y declarar campeones</button>
            <button disabled={pending} onClick={() => change("borrador")} className="btn-secondary">Volver a Próximamente</button>
          </>
        )}
        {t.status === "finalizado" && <button disabled={pending} onClick={() => change("en_curso", "¿Reabrir el torneo? Se quitarán los campeones hasta volver a finalizarlo.")} className="btn-secondary flex-1">Reabrir torneo</button>}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {t.status === "borrador" && (
        <button onClick={() => confirm("¿Borrar el torneo y todos sus datos?") && start(() => deleteTournament(t.id))} className="text-xs text-red-600">Borrar torneo</button>
      )}
    </div>
  );
}

export function RoundEditor({ round }: { round: Round }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateRound, null);
  useEffect(() => { if (state?.ok) setOpen(false); }, [state]);
  if (!open) return <button onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-700">Editar</button>;
  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/40 sm:place-items-center" onClick={() => setOpen(false)}>
      <form action={action} onClick={(e) => e.stopPropagation()} className="max-h-[90dvh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-2xl">
        <h3 className="h2">Fecha {round.number}</h3>
        <input type="hidden" name="id" value={round.id} />
        <input type="hidden" name="tournament_id" value={round.tournament_id} />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Día</label><input type="date" name="played_on" defaultValue={round.played_on ?? ""} className="input" /></div>
          <div><label className="label">Hora reserva</label><input type="time" name="start_time" defaultValue={round.start_time?.slice(0, 5) ?? ""} className="input" /></div>
        </div>
        <div>
          <label className="label">Duración del turno</label>
          <select name="duration_hours" defaultValue={round.duration_hours != null ? String(Number(round.duration_hours)) : ""} className="input">
            <option value="">Sin definir</option>
            {DURATIONS.map((d) => <option key={d} value={String(d)}>{formatDuration(d)}</option>)}
          </select>
        </div>
        <div><label className="label">Lugar / cancha</label><input name="place" defaultValue={round.place ?? ""} placeholder="Ej: Club Norte · Cancha 3" className="input" /></div>
        <div>
          <label className="label">Ubicación en el mapa</label>
          <LocationPicker lat={round.lat} lng={round.lng} place={round.place} />
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer font-semibold text-gray-cool">O pegar un link de Google Maps</summary>
            <input name="maps_url" type="url" inputMode="url" defaultValue={round.maps_url ?? ""} placeholder="https://maps.app.goo.gl/…" className="input mt-2" />
            <p className="mt-1 text-gray-cool">Se usa solo si no hay un punto marcado en el mapa.</p>
          </details>
        </div>
        <div>
          <label className="label">Costo de la reserva ($)</label>
          <input name="court_cost" inputMode="numeric" defaultValue={round.court_cost != null ? String(Math.round(round.court_cost)) : ""} placeholder="Ej: 48000" className="input" />
        </div>
        <FormMessage state={state} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cerrar</button>
          <button className="btn-primary flex-1" disabled={pending}>Guardar</button>
        </div>
      </form>
    </div>
  );
}

type Enrolled = { id: string; name: string; played: number };

export function Enrollment({ tournamentId, enrolled, available }: { tournamentId: string; enrolled: Enrolled[]; available: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (key: string, ids: string[], on: boolean) => {
    setError(null);
    setBusy(key);
    start(async () => {
      const res = await setEnrollment(tournamentId, ids, on);
      if (res?.error) setError(res.error);
      setBusy(null);
    });
  };

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      <div className="card divide-y divide-gray-light">
        {enrolled.length === 0 && <p className="p-4 text-sm text-gray-cool">Todavía no hay jugadores inscritos.</p>}
        {enrolled.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
            {p.played > 0 ? (
              <span className="chip bg-brand-50 text-brand-700" title="Ya jugó partidos: no se puede quitar">🔒 {p.played} PJ</span>
            ) : (
              <button disabled={pending} onClick={() => confirm(`¿Quitar a ${p.name} del torneo?`) && run(p.id, [p.id], false)}
                className="text-xs font-semibold text-red-600 disabled:opacity-40">
                {busy === p.id ? "Quitando…" : "Quitar"}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-cool">🔒 Los jugadores que ya jugaron algún partido en este torneo no se pueden quitar.</p>

      {available.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold">Agregar jugadores ({available.length})</h3>
            {available.length > 1 && (
              <button disabled={pending} onClick={() => run("all", available.map((a) => a.id), true)} className="text-xs font-semibold text-brand-700">
                {busy === "all" ? "Agregando…" : "Agregar todos"}
              </button>
            )}
          </div>
          <div className="card divide-y divide-gray-light">
            {available.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <button disabled={pending} onClick={() => run(p.id, [p.id], true)} className="btn-primary px-3 py-1.5 text-xs">
                  {busy === p.id ? "…" : "+ Agregar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
