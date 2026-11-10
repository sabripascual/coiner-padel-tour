import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { mapsLink, roundDetails } from "@/lib/utils";
import type { Profile, Round, RoundStat, Tournament } from "@/lib/types";
import Counters from "./Counters";

export const dynamic = "force-dynamic";

export default async function FechaPage({ params }: { params: Promise<{ id: string; number: string }> }) {
  const { id, number } = await params;
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: t }, { data: r }] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
    supabase.from("rounds").select("*").eq("tournament_id", id).eq("number", Number(number)).maybeSingle(),
  ]);
  if (!t || !r) notFound();
  const tournament = t as Tournament;
  const round = r as Round;

  const [{ data: enrolled }, { data: stats }] = await Promise.all([
    supabase.from("tournament_players").select("profiles(*)").eq("tournament_id", id),
    supabase.from("round_stats").select("*").eq("round_id", round.id),
  ]);
  const players = ((enrolled ?? []) as unknown as { profiles: Profile }[]).map((e) => e.profiles).filter((p) => p.active);

  return (
    <div className="space-y-4">
      <Link href={`/admin/torneos/${id}`} className="text-sm font-semibold text-brand-700">← {tournament.name}</Link>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="h1">Fecha {round.number}</h1>
          <p className="text-sm text-gray-cool">{roundDetails(round)}</p>
          {mapsLink(round) && (
            <a href={mapsLink(round)!} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-700">📍 Cómo llegar</a>
          )}
        </div>
        <div className="flex gap-1">
          {round.number > 1 && <Link href={`/admin/torneos/${id}/fecha/${round.number - 1}`} className="btn-secondary px-3">‹</Link>}
          {round.number < 10 && <Link href={`/admin/torneos/${id}/fecha/${round.number + 1}`} className="btn-secondary px-3">›</Link>}
        </div>
      </div>
      <Counters
        roundId={round.id}
        courtCost={round.court_cost != null ? Number(round.court_cost) : null}
        editable={tournament.status === "en_curso"}
        players={players.map((p) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, nickname: p.nickname, avatar_url: p.avatar_url, sex: p.sex }))}
        initial={(stats as RoundStat[]) ?? []}
      />
    </div>
  );
}
