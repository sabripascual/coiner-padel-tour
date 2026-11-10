import "server-only";
import { createClient } from "./supabase-server";
import type { RankingRow, Round, Tournament } from "./types";
import { sortRanking } from "./utils";

export async function getTournaments(): Promise<Tournament[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
  return (data as Tournament[]) ?? [];
}

/** Torneo por defecto: el último en curso, o el último finalizado. */
export function pickDefaultTournament(list: Tournament[]) {
  return list.find((t) => t.status === "en_curso") ?? list.find((t) => t.status === "finalizado") ?? null;
}

export async function getTournamentRanking(tournamentId: string): Promise<RankingRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("ranking_tournament").select("*").eq("tournament_id", tournamentId);
  return sortRanking((data as RankingRow[]) ?? []);
}

export async function getHistoricalRanking(): Promise<RankingRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("ranking_historical").select("*");
  return sortRanking(((data as RankingRow[]) ?? []).filter((r) => r.played > 0));
}

export async function getRounds(tournamentId: string): Promise<Round[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("rounds").select("*").eq("tournament_id", tournamentId).order("number");
  return (data as Round[]) ?? [];
}

/** Ids de las fechas que ya tienen algún partido cargado */
export async function getPlayedRoundIds(roundIds: string[]): Promise<Set<string>> {
  if (roundIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase.from("round_stats").select("round_id").in("round_id", roundIds).gt("played", 0);
  return new Set((data ?? []).map((d) => d.round_id as string));
}
