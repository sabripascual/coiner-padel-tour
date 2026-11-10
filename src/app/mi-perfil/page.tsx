import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { getHistoricalRanking, getTournamentRanking, getTournaments, pickDefaultTournament } from "@/lib/queries";
import { displayName, formatDate, fullName, points } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import ProfileForms from "./ProfileForms";

export const dynamic = "force-dynamic";

type StatRow = { played: number; won: number; games: number; rounds: { number: number; played_on: string | null; tournament_id: string } };

export default async function MiPerfil() {
  const me = await requireUser();
  const supabase = await createClient();
  const tournaments = (await getTournaments()).filter((t) => t.status !== "borrador");
  const current = pickDefaultTournament(tournaments);

  const [ranking, historical, { data: stats }] = await Promise.all([
    current ? getTournamentRanking(current.id) : Promise.resolve([]),
    getHistoricalRanking(),
    supabase.from("round_stats").select("played, won, games, rounds!inner(number, played_on, tournament_id)").eq("player_id", me.id).gt("played", 0),
  ]);

  const rows = (stats ?? []) as unknown as StatRow[];
  const pos = ranking.findIndex((r) => r.player_id === me.id);
  const mine = ranking[pos];
  const sameSex = ranking.filter((r) => r.sex === me.sex);
  const posSex = sameSex.findIndex((r) => r.player_id === me.id);
  const hist = historical.find((r) => r.player_id === me.id);
  const titles = tournaments.filter((t) => t.champion_f === me.id || t.champion_m === me.id);
  const best = [...rows].sort((a, b) => points(b) - points(a))[0];

  const Stat = ({ v, l }: { v: string | number; l: string }) => (
    <div className="card p-3 text-center">
      <div className="text-2xl font-extrabold tabular-nums text-brand-700">{v}</div>
      <div className="text-[11px] font-medium uppercase text-gray-cool">{l}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar src={me.avatar_url} name={me.first_name} size={72} />
        <div>
          <h1 className="h1">{displayName(me)}</h1>
          <p className="text-sm text-gray-cool">{fullName(me)} · @{me.username}</p>
          {titles.length > 0 && <p className="text-sm font-semibold">{"🏆".repeat(titles.length)} {titles.length} título{titles.length > 1 ? "s" : ""}</p>}
        </div>
      </div>

      {current && mine && (
        <section className="space-y-2">
          <h2 className="h2">{current.name}</h2>
          <div className="grid grid-cols-3 gap-2">
            <Stat v={`${pos + 1}°`} l="General" />
            <Stat v={`${posSex + 1}°`} l={me.sex === "F" ? "Mujeres" : "Hombres"} />
            <Stat v={mine.points} l="Puntos" />
            <Stat v={mine.played} l="Jugados" />
            <Stat v={mine.won} l="Ganados" />
            <Stat v={mine.games} l="Games (derrotas)" />
          </div>
          <p className="text-sm text-gray-cool">
            Efectividad: <b>{mine.played ? Math.round((mine.won / mine.played) * 100) : 0}%</b> · Fechas asistidas: <b>{mine.rounds_attended}/10</b>
            {best && <> · Mejor fecha: <b>F{best.rounds.number} ({points(best)} pts)</b></>}
          </p>
        </section>
      )}

      {hist && (
        <section className="space-y-2">
          <h2 className="h2">Histórico</h2>
          <div className="grid grid-cols-4 gap-2">
            <Stat v={hist.points} l="Puntos" />
            <Stat v={hist.played} l="PJ" />
            <Stat v={hist.won} l="PG" />
            <Stat v={hist.games} l="GP" />
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="h2">Mis fechas</h2>
        {rows.length === 0 ? (
          <p className="card p-4 text-sm text-gray-cool">Todavía no jugaste ninguna fecha.</p>
        ) : (
          <div className="card divide-y divide-gray-light">
            {rows.sort((a, b) => (b.rounds.played_on ?? "").localeCompare(a.rounds.played_on ?? "") || b.rounds.number - a.rounds.number).map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <div className="font-semibold">
                    {tournaments.find((t) => t.id === r.rounds.tournament_id)?.name} · Fecha {r.rounds.number}
                  </div>
                  <div className="text-xs text-gray-cool">{formatDate(r.rounds.played_on)} · {r.played} PJ · {r.won} PG · {r.games} GP</div>
                </div>
                <div className="text-lg font-extrabold tabular-nums text-brand-700">{points(r)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ProfileForms profile={me} />
    </div>
  );
}
