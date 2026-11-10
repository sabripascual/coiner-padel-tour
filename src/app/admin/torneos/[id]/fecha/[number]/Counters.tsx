"use client";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { cn, displayName, formatMoney, points } from "@/lib/utils";
import type { RoundStat, Sex } from "@/lib/types";
import Avatar from "@/components/Avatar";

type P = { id: string; first_name: string; last_name: string; nickname: string | null; avatar_url: string | null; sex: Sex };
type S = { played: number; won: number; games: number };
type Field = "played" | "won" | "games";

const EMPTY: S = { played: 0, won: 0, games: 0 };


export default function Counters({ roundId, players, initial, editable, courtCost }: { roundId: string; players: P[]; initial: RoundStat[]; editable: boolean; courtCost: number | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Record<string, S>>(() =>
    Object.fromEntries(initial.map((s) => [s.player_id, { played: s.played, won: s.won, games: s.games }])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<"name" | "played" | "points">("name");
  const [q, setQ] = useState("");

  async function adjust(playerId: string, field: Field, delta: 1 | -1) {
    if (!editable || busy) return;
    setBusy(playerId + field);
    setError(null);
    const { data, error } = await supabase.rpc("adjust_stat", { p_round_id: roundId, p_player_id: playerId, p_field: field, p_delta: delta });
    setBusy(null);
    if (error) return setError(error.message);
    const r = data as RoundStat;
    setStats((s) => ({ ...s, [playerId]: { played: r.played, won: r.won, games: r.games } }));
  }

  const list = players
    .filter((p) => !q || `${p.first_name} ${p.last_name} ${p.nickname ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const sa = stats[a.id] ?? EMPTY, sb = stats[b.id] ?? EMPTY;
      if (order === "played") return sa.played - sb.played || a.first_name.localeCompare(b.first_name);
      if (order === "points") return points(sb) - points(sa) || a.first_name.localeCompare(b.first_name);
      return a.first_name.localeCompare(b.first_name);
    });

  const totals = Object.values(stats).reduce((acc, s) => ({ played: acc.played + s.played, won: acc.won + s.won }), { played: 0, won: 0 });
  const attendees = Object.values(stats).filter((s) => s.played > 0).length;

  return (
    <div className="space-y-3">
      {!editable && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">El torneo no está en curso: solo lectura.</p>}
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {courtCost != null && (
        <div className="card flex items-center justify-between p-3 text-sm">
          <span>Cancha: <b>{formatMoney(courtCost)}</b></span>
          <span className="text-right">
            {attendees > 0
              ? <>Por jugador: <b className="text-brand-700">{formatMoney(Math.ceil(courtCost / attendees))}</b> <span className="text-xs text-gray-cool">({attendees} con PJ)</span></>
              : <span className="text-xs text-gray-cool">Se divide entre quienes jueguen</span>}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <input className="input" placeholder="Buscar jugador…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
          <option value="name">A-Z</option>
          <option value="played">Menos jugados</option>
          <option value="points">Puntos</option>
        </select>
      </div>
      <div className="card space-y-1 p-3 text-xs">
        <p className="font-display font-bold text-navy">Después de cada partido:</p>
        <p>🏆 <b>Ganadores:</b> +1 en <b>Ganados</b> (suma el jugado solo) → +3 pts</p>
        <p>💪 <b>Perdedores:</b> +1 en <b>Jugados</b>, y si ganaron un game, +1 en <b>Games</b> → +1 pt</p>
        <p className="text-gray-cool">Partidos cargados: ~{Math.round(totals.played / 4)} · Ordena por “Menos jugados” para equilibrar quién entra.</p>
      </div>

      <div className="space-y-2">
        {list.map((p) => {
          const s = stats[p.id] ?? EMPTY;
          return (
            <div key={p.id} className="card p-3">
              <div className="mb-2 flex items-center gap-2">
                <Avatar src={p.avatar_url} name={p.first_name} size={32} />
                <div className="min-w-0 flex-1 truncate font-semibold">{displayName(p)}</div>
                <div className="text-right">
                  <span className="text-xl font-extrabold tabular-nums text-brand-700">{points(s)}</span>
                  <span className="ml-1 text-xs text-gray-cool">pts</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([["won", "Ganados"], ["played", "Jugados"], ["games", "Games"]] as [Field, string][]).map(([f, label]) => (
                  <div key={f} className="rounded-xl bg-soft-blue p-1.5 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700">{label}</div>
                    <div className="flex items-center justify-between">
                      <button aria-label={`Restar ${label}`} disabled={!editable || s[f] === 0 || !!busy} onClick={() => adjust(p.id, f, -1)}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-white text-lg font-bold text-navy shadow-sm disabled:opacity-30">−</button>
                      <span className={cn("text-lg font-extrabold tabular-nums", busy === p.id + f && "opacity-40")}>{s[f]}</span>
                      <button aria-label={`Sumar ${label}`} disabled={!editable || !!busy || (f === "games" && s.games >= s.played - s.won)} onClick={() => adjust(p.id, f, 1)}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-lg font-bold text-white shadow-sm disabled:opacity-30">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-cool">
                {s.won} ganado(s) · {s.played - s.won} perdido(s){s.played - s.won > 0 ? ` · games en derrotas: ${s.games}/${s.played - s.won}` : ""}
              </p>
            </div>
          );
        })}
      </div>
      {players.length === 0 && <p className="card p-4 text-sm text-gray-cool">No hay jugadores inscritos en este torneo.</p>}
    </div>
  );
}
