import type { RankingRow, TournamentStatus } from "./types";

export const LOGIN_DOMAIN = process.env.NEXT_PUBLIC_LOGIN_DOMAIN || "padelcoiner.app";

export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${LOGIN_DOMAIN}`;

export const displayName = (p: { first_name: string; last_name: string; nickname: string | null }) =>
  p.nickname?.trim() ? p.nickname : `${p.first_name} ${p.last_name.charAt(0)}.`;

export const fullName = (p: { first_name: string; last_name: string }) => `${p.first_name} ${p.last_name}`;

/** Orden del ranking: puntos > games > partidos ganados */
export const sortRanking = <T extends RankingRow>(rows: T[]) =>
  [...rows].sort((a, b) => b.points - a.points || b.games - a.games || b.won - a.won ||
    a.first_name.localeCompare(b.first_name));

export const points = (s: { won: number; games: number }) => s.games + 3 * s.won;

export const STATUS_LABEL: Record<TournamentStatus, string> = {
  borrador: "Próximamente",
  en_curso: "En curso",
  finalizado: "Finalizado",
};

export const photoUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`;

export const formatDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }) : "Sin fecha";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
