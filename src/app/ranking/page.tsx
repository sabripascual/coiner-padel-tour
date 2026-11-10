import Link from "next/link";
import RankingTable, { ScoringRules } from "@/components/RankingTable";
import { getCurrentProfile } from "@/lib/auth";
import { getHistoricalRanking, getTournamentRanking, getTournaments, pickDefaultTournament } from "@/lib/queries";
import { createClient } from "@/lib/supabase-server";
import { cn, displayName } from "@/lib/utils";
import StatusChip from "@/components/StatusChip";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ t?: string; sexo?: string }> }) {
  const sp = await searchParams;
  const [tournaments, me] = await Promise.all([getTournaments(), getCurrentProfile()]);
  const visible = tournaments.filter((t) => t.status !== "borrador");
  const historical = sp.t === "historico";
  const tournament = historical ? null : visible.find((t) => t.id === sp.t) ?? pickDefaultTournament(visible);
  const sexo = sp.sexo === "F" || sp.sexo === "M" ? sp.sexo : null;

  let rows = historical || !tournament ? await getHistoricalRanking() : await getTournamentRanking(tournament.id);
  if (sexo) rows = rows.filter((r) => r.sex === sexo);

  let champions: { f?: Profile; m?: Profile } = {};
  if (tournament?.status === "finalizado") {
    const supabase = await createClient();
    const ids = [tournament.champion_f, tournament.champion_m].filter(Boolean) as string[];
    const { data } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    const list = (data as Profile[]) ?? [];
    champions = { f: list.find((p) => p.id === tournament.champion_f), m: list.find((p) => p.id === tournament.champion_m) };
  }

  const tParam = historical ? "historico" : tournament?.id;
  const href = (o: { t?: string; sexo?: string | null }) => {
    const q = new URLSearchParams();
    const t = o.t ?? tParam;
    const s = o.sexo === undefined ? sexo : o.sexo;
    if (t) q.set("t", t);
    if (s) q.set("sexo", s);
    return `/ranking?${q}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="h1">Ranking</h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {visible.map((t) => (
          <Link key={t.id} href={href({ t: t.id })} className={cn("chip shrink-0 px-3 py-1.5 text-sm", t.id === tournament?.id ? "bg-brand-700 text-white" : "bg-white text-navy ring-1 ring-slate-300")}>
            {t.name}{t.status === "en_curso" ? " ●" : ""}
          </Link>
        ))}
        <Link href={href({ t: "historico" })} className={cn("chip shrink-0 px-3 py-1.5 text-sm", historical || !tournament ? "bg-brand-700 text-white" : "bg-white text-navy ring-1 ring-slate-300")}>
          Histórico
        </Link>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-200 p-1 text-sm font-semibold">
        {[{ k: null, l: "Todos" }, { k: "F", l: "Mujeres" }, { k: "M", l: "Hombres" }].map((o) => (
          <Link key={o.l} href={href({ sexo: o.k })} className={cn("flex-1 rounded-lg py-1.5 text-center", sexo === o.k ? "bg-white shadow" : "text-gray-cool")}>
            {o.l}
          </Link>
        ))}
      </div>

      {tournament && (
        <p className="flex items-center gap-2 text-sm text-gray-cool">{tournament.name} · <StatusChip status={tournament.status} /></p>
      )}

      {tournament?.status === "finalizado" && (champions.f || champions.m) && (
        <div className="grid grid-cols-2 gap-3">
          {[{ p: champions.f, l: "Campeona" }, { p: champions.m, l: "Campeón" }].map(({ p, l }) => p && (
            <div key={l} className="card bg-gradient-to-br from-accent-400 to-accent-600 p-4 text-center text-white">
              <div className="text-3xl">🏆</div>
              <div className="text-xs font-bold uppercase text-white/90">{l}</div>
              <div className="font-extrabold">{displayName(p)}</div>
            </div>
          ))}
        </div>
      )}

      <RankingTable rows={rows} highlightId={me?.id} extra={historical || !tournament ? "titles" : undefined} />
      <ScoringRules />
    </div>
  );
}
