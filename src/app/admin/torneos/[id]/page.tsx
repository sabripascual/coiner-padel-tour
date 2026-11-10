import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { getPlayedRoundIds, getRounds } from "@/lib/queries";
import { formatDate, fullName } from "@/lib/utils";
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

  const [rounds, { data: players }, { data: enrolled }] = await Promise.all([
    getRounds(id),
    supabase.from("profiles").select("*").order("first_name"),
    supabase.from("tournament_players").select("player_id").eq("tournament_id", id),
  ]);
  const played = await getPlayedRoundIds(rounds.map((r) => r.id));
  const enrolledIds = new Set((enrolled ?? []).map((e) => e.player_id as string));

  return (
    <div className="space-y-5">
      <Link href="/admin" className="text-sm font-semibold text-brand-700">← Admin</Link>
      <div className="flex items-start justify-between gap-3">
        <h1 className="h1">{t.name}</h1>
        <StatusChip status={t.status} />
      </div>

      <TournamentControls tournament={t} />

      <section className="space-y-2">
        <h2 className="h2">Fechas</h2>
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
                <div className="truncate text-xs text-gray-cool">{formatDate(r.played_on)}{r.place ? ` · ${r.place}` : ""}</div>
              </div>
              <RoundEditor round={r} />
              <Link href={`/admin/torneos/${id}/fecha/${r.number}`} className="btn-accent px-3 py-2 text-xs">Cargar</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="h2">Inscritos ({enrolledIds.size})</h2>
        <Enrollment
          tournamentId={id}
          players={((players as Profile[]) ?? []).map((p) => ({ id: p.id, name: fullName(p), active: p.active }))}
          enrolled={[...enrolledIds]}
        />
      </section>
    </div>
  );
}
