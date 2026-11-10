import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTournaments } from "@/lib/queries";
import StatusChip from "@/components/StatusChip";
import CreateTournamentForm from "./CreateTournamentForm";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const tournaments = await getTournaments();
  return (
    <div className="space-y-5">
      <h1 className="h1">Panel de admin</h1>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/jugadores" className="card p-4 font-semibold">👥 Jugadores<span className="block text-xs font-normal text-gray-cool">Crear, editar, claves y permisos</span></Link>
        <Link href="/admin/auditoria" className="card p-4 font-semibold">🧾 Auditoría<span className="block text-xs font-normal text-gray-cool">Historial de cambios</span></Link>
      </div>

      <section className="space-y-3">
        <h2 className="h2">Torneos</h2>
        <CreateTournamentForm />
        <div className="card divide-y divide-gray-light">
          {tournaments.length === 0 && <p className="p-4 text-sm text-gray-cool">Todavía no hay torneos.</p>}
          {tournaments.map((t) => (
            <Link key={t.id} href={`/admin/torneos/${t.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-semibold">{t.name}</span>
              <StatusChip status={t.status} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
