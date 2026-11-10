import type { RankingRow } from "@/lib/types";
import { displayName, fullName, cn } from "@/lib/utils";
import Avatar from "./Avatar";

const medal = ["🥇", "🥈", "🥉"];

export default function RankingTable({ rows, highlightId, extra }: {
  rows: RankingRow[];
  highlightId?: string;
  extra?: "titles";
}) {
  if (rows.length === 0) {
    return <p className="card p-6 text-center text-sm text-gray-cool">Todavía no hay jugadores en este ranking.</p>;
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-soft-blue text-xs uppercase tracking-wide text-gray-cool">
          <tr>
            <th className="w-8 py-2 pl-3 text-left">#</th>
            <th className="py-2 text-left">Jugador</th>
            <th className="w-10 py-2 text-center" title="Partidos jugados">PJ</th>
            <th className="w-10 py-2 text-center" title="Partidos ganados">PG</th>
            <th className="w-10 py-2 text-center" title="Games ganados en partidos perdidos">GP</th>
            {extra === "titles" && <th className="w-8 py-2 text-center" title="Títulos">🏆</th>}
            <th className="w-12 py-2 pr-3 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.player_id} className={cn("border-t border-gray-light", r.player_id === highlightId && "bg-accent-50")}>
              <td className="py-2.5 pl-3 font-semibold text-gray-cool">{i < 3 && r.played > 0 ? medal[i] : i + 1}</td>
              <td className="py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar src={r.avatar_url} name={r.first_name} size={30} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{displayName(r)}</div>
                    <div className="truncate text-xs text-gray-cool">{fullName(r)} · {r.sex === "F" ? "♀" : "♂"}</div>
                  </div>
                </div>
              </td>
              <td className="text-center tabular-nums">{r.played}</td>
              <td className="text-center tabular-nums">{r.won}</td>
              <td className="text-center tabular-nums">{r.games}</td>
              {extra === "titles" && <td className="text-center tabular-nums">{r.titles || ""}</td>}
              <td className="pr-3 text-right text-base font-extrabold tabular-nums text-brand-700">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-gray-light px-3 py-2 text-[11px] text-gray-cool">
        PJ jugados · PG ganados · GP games ganados en partidos perdidos
      </p>
    </div>
  );
}

/** Reglamento de puntos, visible debajo de los rankings */
export function ScoringRules() {
  const row = "flex items-center justify-between gap-3 px-4 py-2.5";
  return (
    <section className="card overflow-hidden text-sm" aria-label="Reglamento de puntos">
      <h3 className="bg-soft-blue px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-brand-700">¿Cómo se suman los puntos?</h3>
      <div className="divide-y divide-gray-light">
        <div className={row}><span>🏆 <b>Ganar el partido</b> (2-0 o 2-1)</span><span className="chip bg-brand-700 text-white">+3 pts</span></div>
        <div className={row}><span>💪 <b>Perder 2-1</b> (ganaste 1 game)</span><span className="chip bg-accent-500 text-white">+1 pt</span></div>
        <div className={row}><span>Perder 2-0</span><span className="chip bg-slate-200 text-navy">0 pts</span></div>
      </div>
      <p className="border-t border-gray-light px-4 py-2 text-xs text-gray-cool">
        Los puntos son por jugador. El ganador no suma sus games: solo los 3 puntos del partido.
        Desempate: puntos → partidos ganados → games.
      </p>
    </section>
  );
}
