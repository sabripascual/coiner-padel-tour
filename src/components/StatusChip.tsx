import type { TournamentStatus } from "@/lib/types";

/** Chips de estado según la guía de marca: En curso / Próximamente / Finalizado */
export default function StatusChip({ status }: { status: TournamentStatus }) {
  if (status === "en_curso")
    return <span className="chip gap-1.5 bg-brand-50 text-brand-700"><span className="h-2 w-2 rounded-full bg-brand-700" />En curso</span>;
  if (status === "finalizado")
    return <span className="chip gap-1.5 bg-emerald-50 text-emerald-800"><span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-600 text-[9px] text-white">✓</span>Finalizado</span>;
  return <span className="chip gap-1.5 bg-slate-200/70 text-navy"><span className="text-[11px]">🕒</span>Próximamente</span>;
}
