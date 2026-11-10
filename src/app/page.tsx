import Link from "next/link";
import Logo from "@/components/Logo";
import StatusChip from "@/components/StatusChip";
import UpcomingRounds, { upcomingRounds } from "@/components/UpcomingRounds";
import InstallPrompt from "@/components/InstallPrompt";
import Carousel from "@/components/Carousel";
import RankingTable, { ScoringRules } from "@/components/RankingTable";
import { createClient } from "@/lib/supabase-server";
import { getPlayedRoundIds, getRounds, getTournamentRanking, getTournaments, pickDefaultTournament } from "@/lib/queries";
import { formatDate, photoUrl, roundDetails } from "@/lib/utils";
import type { Photo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: photos }, tournaments] = await Promise.all([
    supabase.from("photos").select("*, rounds(number, played_on)").order("created_at", { ascending: false }).limit(20),
    getTournaments(),
  ]);
  const current = pickDefaultTournament(tournaments);
  const [ranking, rounds] = current
    ? await Promise.all([getTournamentRanking(current.id), getRounds(current.id)])
    : [[], []];
  const played = await getPlayedRoundIds(rounds.map((r) => r.id));
  const next = rounds.find((r) => !played.has(r.id));

  const slides = ((photos ?? []) as (Photo & { rounds: { number: number; played_on: string | null } | null })[]).map((p) => ({
    id: p.id,
    src: photoUrl(p.path),
    caption: p.caption || (p.rounds ? `Fecha ${p.rounds.number} · ${formatDate(p.rounds.played_on)}` : "Recuerdo"),
  }));

  return (
    <div className="space-y-6">
      <InstallPrompt />
      <Carousel slides={slides} />

      {current ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <StatusChip status={current.status} />
              <h1 className="h1">{current.name}</h1>
            </div>
            <Link href="/ranking" className="btn-primary shrink-0 px-3 py-2 text-xs">Ver ranking →</Link>
          </div>

          <div className="card p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold">Fechas jugadas</span>
              <span className="tabular-nums text-gray-cool">{played.size} / 10</span>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {rounds.map((r) => (
                <span key={r.id} title={`Fecha ${r.number}`} className={`h-2 rounded-full ${played.has(r.id) ? "bg-brand-500" : "bg-slate-200"}`} />
              ))}
            </div>
            {current.status === "en_curso" && next && (
              <p className="mt-3 text-sm text-gray-cool">
                Próxima: <b>Fecha {next.number}</b>{next.played_on || next.start_time || next.place ? ` · ${roundDetails(next)}` : ""}
              </p>
            )}
          </div>

          <h2 className="h2 pt-2">Top 5</h2>
          <RankingTable rows={ranking.slice(0, 5)} />
          <ScoringRules />

          {current.status === "en_curso" && (
            <>
              <h2 className="h2 pt-2">Próximas fechas</h2>
              <UpcomingRounds rounds={upcomingRounds(rounds, played)} />
            </>
          )}
        </section>
      ) : (
        <section className="card p-6 text-center">
          <div className="flex justify-center"><Logo size="lg" /></div>
          <p className="mt-4 text-gray-cool">Todavía no hay un torneo en curso. ¡Muy pronto!</p>
        </section>
      )}
    </div>
  );
}
