import type { RankingRow, TournamentStatus } from "./types";

export const LOGIN_DOMAIN = process.env.NEXT_PUBLIC_LOGIN_DOMAIN || "padelcoiner.app";

/** Acepta el email completo o solo el usuario (se le agrega el dominio por defecto). */
export const usernameToEmail = (input: string) => {
  const v = input.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${LOGIN_DOMAIN}`;
};

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

/** "19:30:00" -> "19:30 h" */
export const formatTime = (t: string | null) => (t ? `${t.slice(0, 5)} h` : null);

export const formatMoney = (n: number | null) =>
  n == null ? null : `$${Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

/** Día · hora · lugar · costo, sin los datos que falten */
export const roundDetails = (
  r: { played_on: string | null; start_time: string | null; place: string | null; court_cost?: number | null },
  withCost = false,
) =>
  [formatDate(r.played_on), formatTime(r.start_time), r.place, withCost ? formatMoney(r.court_cost ?? null) : null]
    .filter(Boolean)
    .join(" · ");
