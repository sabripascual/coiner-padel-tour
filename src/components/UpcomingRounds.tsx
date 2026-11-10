import type { Round } from "@/lib/types";
import { formatDuration, formatMoney, formatTimeRange, mapsLink } from "@/lib/utils";

const TZ = "America/Argentina/Buenos_Aires";

/** Fechas con día definido, de hoy en adelante, que todavía no se jugaron. */
export function upcomingRounds(rounds: Round[], played: Set<string>) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ }); // AAAA-MM-DD
  return rounds
    .filter((r) => r.played_on && r.played_on >= today && !played.has(r.id))
    .sort((a, b) => a.played_on!.localeCompare(b.played_on!) || a.number - b.number);
}

export default function UpcomingRounds({ rounds }: { rounds: Round[] }) {
  if (rounds.length === 0) {
    return <p className="card p-4 text-sm text-gray-cool">Todavía no hay próximas fechas con día definido.</p>;
  }
  return (
    <div className="space-y-2">
      {rounds.map((r) => {
        const d = new Date(r.played_on + "T12:00:00");
        const time = r.start_time ? formatTimeRange(r.start_time, r.duration_hours) : null;
        const link = mapsLink(r);
        return (
          <article key={r.id} className="card flex gap-3 p-3">
            <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-700 py-2 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                {d.toLocaleDateString("es", { weekday: "short" }).replace(".", "")}
              </span>
              <span className="font-display text-2xl font-black leading-none">{d.getDate()}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                {d.toLocaleDateString("es", { month: "short" }).replace(".", "")}
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <h3 className="font-display font-bold">Fecha {r.number}</h3>
              {(time || r.duration_hours != null) && (
                <p className="text-sm">
                  🕒 {time ?? "Horario a definir"}
                  {r.duration_hours != null && <span className="text-gray-cool"> · {formatDuration(r.duration_hours)}</span>}
                </p>
              )}
              {r.place && <p className="truncate text-sm">📍 {r.place}</p>}
              {r.court_cost != null && <p className="text-xs text-gray-cool">Cancha: {formatMoney(r.court_cost)}</p>}
              {link && (
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-accent-500 px-3 py-1.5 font-display text-xs font-bold text-white active:scale-95">
                  Cómo llegar ↗
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
