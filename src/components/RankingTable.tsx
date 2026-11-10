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
            <th className="w-10 py-2 text-center" title="Games ganados">GG</th>
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
        PJ jugados · PG ganados · GG games ganados · Pts = GG + 3 × PG. Desempate: puntos, games, ganados.
      </p>
    </div>
  );
}
