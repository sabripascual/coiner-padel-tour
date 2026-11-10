import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { getPlayedRoundIds, getRounds, getTournamentRanking } from "@/lib/queries";
import { formatMoney, fullName, roundDetails } from "@/lib/utils";
import PlayerForm from "../../jugadores/PlayerForm";
import type { Profile, Tournament } from "@/lib/types";
import StatusChip from "@/components/StatusChip";
import { TournamentControls, Enrollment, RoundEditor } from "./Controls";

export const dynamic = "force-dynamic";

export default async function TournamentAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const t = data as Tournament;

  const [rounds, { data: players }, ranking] = await Promise.all([
    getRounds(id),
    supabase.from("profiles").select("*").order("first_name"),
    getTournamentRanking(id),
  ]);
  const played = await getPlayedRoundIds(rounds.map((r) => r.id));
  const all = (players as Profile[]) ?? [];
  const playedBy = new Map(ranking.map((r) => [r.player_id, r.played]));
  const enrolled = all.filter((p) => playedBy.has(p.id)).map((p) => ({ id: p.id, name: fullName(p), played: playedBy.get(p.id) ?? 0 }));
  const available = all.filter((p) => p.active && !playedBy.has(p.id)).map((p) => ({ id: p.id, name: fullName(p) }));
  const totalCost = rounds.reduce((acc, r) => acc + (r.court_cost ? Number(r.court_cost) : 0), 0);

  return (
    <div className="space-y-5">
      <Link href="/admin" className="text-sm font-semibold text-brand-700">← Admin</Link>
      <div className="flex items-start justify-between gap-3">
        <h1 className="h1">{t.name}</h1>
        <StatusChip status={t.status} />
      </div>

      <TournamentControls tournament={t} />

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="h2">Fechas</h2>
          {totalCost > 0 && <span className="text-xs text-gray-cool">Canchas: <b className="text-navy">{formatMoney(totalCost)}</b></span>}
        </div>
        {t.status !== "en_curso" && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
            Para cargar resultados, el torneo tiene que estar <b>En curso</b>.
          </p>
        )}
        <div className="card divide-y divide-gray-light">
          {rounds.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${played.has(r.id) ? "bg-brand-700 text-white" : "bg-soft-blue text-brand-700"}`}>{r.number}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Fecha {r.number}</div>
                <div className="truncate text-xs text-gray-cool">{roundDetails({ ...r, place: null }, true)}</div>
                {r.place && <div className="truncate text-xs text-gray-cool">📍 {r.place}</div>}
              </div>
              <RoundEditor round={r} />
              <Link href={`/admin/torneos/${id}/fecha/${r.number}`} className="btn-accent px-3 py-2 text-xs">Cargar</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="h2">Jugadores del torneo ({enrolled.length})</h2>
        <Enrollment tournamentId={id} enrolled={enrolled} available={available} />
        <PlayerForm tournamentId={id} label="+ Crear jugador nuevo e inscribirlo" />
      </section>
    </div>
  );
}
