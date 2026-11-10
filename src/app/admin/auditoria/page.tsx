import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { displayName } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type Log = { id: number; at: string; actor_id: string | null; table_name: string; action: string; record_key: Record<string, string>; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null };

const FIELDS: Record<string, string> = { played: "PJ", won: "PG", games: "GG", status: "estado", name: "nombre", is_admin: "admin", active: "activo", nickname: "apodo", first_name: "nombre", last_name: "apellido", sex: "sexo", avatar_url: "foto" };

function diff(l: Log) {
  if (l.action !== "UPDATE" || !l.old_data || !l.new_data) return null;
  return Object.keys(FIELDS)
    .filter((k) => k in l.new_data! && JSON.stringify(l.old_data![k]) !== JSON.stringify(l.new_data![k]))
    .map((k) => `${FIELDS[k]}: ${String(l.old_data![k] ?? "—")} → ${String(l.new_data![k] ?? "—")}`)
    .join(" · ");
}

export default async function Auditoria() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: logs }, { data: profiles }, { data: rounds }] = await Promise.all([
    supabase.from("audit_log").select("*").order("at", { ascending: false }).limit(300),
    supabase.from("profiles").select("*"),
    supabase.from("rounds").select("id, number, tournaments(name)"),
  ]);
  const people = new Map(((profiles as Profile[]) ?? []).map((p) => [p.id, displayName(p)]));
  const rmap = new Map(((rounds ?? []) as unknown as { id: string; number: number; tournaments: { name: string } }[]).map((r) => [r.id, `${r.tournaments.name} · F${r.number}`]));

  const rows = ((logs as Log[]) ?? [])
    .filter((l) => !(l.table_name === "round_stats" && l.action === "INSERT")) // filas vacías creadas al primer clic
    .map((l) => {
      let what = "";
      if (l.table_name === "round_stats") what = `${people.get(l.record_key.player_id) ?? "?"} · ${rmap.get(l.record_key.round_id) ?? "fecha borrada"}`;
      else if (l.table_name === "tournaments") what = `Torneo ${String((l.new_data ?? l.old_data)?.name ?? "")}`;
      else what = `Jugador ${people.get(l.record_key.id) ?? String((l.new_data ?? l.old_data)?.username ?? "")}`;
      const verb = l.action === "INSERT" ? "creó" : l.action === "DELETE" ? "borró" : "cambió";
      return { ...l, what, verb, detail: diff(l) };
    });

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm font-semibold text-brand-700">← Admin</Link>
      <h1 className="h1">Auditoría</h1>
      <p className="text-sm text-gray-cool">Últimos 300 cambios. El ranking se recalcula automáticamente con cada cambio.</p>
      <div className="card divide-y divide-gray-light">
        {rows.length === 0 && <p className="p-4 text-sm text-gray-cool">Sin cambios registrados.</p>}
        {rows.map((l) => (
          <div key={l.id} className="px-4 py-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <span><b>{l.actor_id ? people.get(l.actor_id) ?? "?" : "Sistema"}</b> {l.verb} <span className="text-navy">{l.what}</span></span>
              <span className="shrink-0 text-[11px] text-gray-cool">{new Date(l.at).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
            {l.detail && <div className="text-xs text-gray-cool">{l.detail}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
