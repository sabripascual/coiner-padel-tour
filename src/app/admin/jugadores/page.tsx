import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { fullName } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import Avatar from "@/components/Avatar";
import PlayerForm from "./PlayerForm";

export const dynamic = "force-dynamic";

export default async function Jugadores() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("first_name");
  const players = (data as Profile[]) ?? [];
  return (
    <div className="space-y-5">
      <Link href="/admin" className="text-sm font-semibold text-brand-700">← Admin</Link>
      <h1 className="h1">Jugadores ({players.length})</h1>
      <PlayerForm />
      <div className="card divide-y divide-gray-light">
        {players.map((p) => (
          <Link key={p.id} href={`/admin/jugadores/${p.id}`} className="flex items-center gap-3 px-4 py-3">
            <Avatar src={p.avatar_url} name={p.first_name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{fullName(p)} {p.nickname && <span className="font-normal text-gray-cool">“{p.nickname}”</span>}</div>
              <div className="text-xs text-gray-cool">@{p.username} · {p.sex === "F" ? "Mujer" : "Hombre"}</div>
            </div>
            {p.is_admin && <span className="chip bg-brand-50 text-brand-700">Admin</span>}
            {!p.active && <span className="chip bg-slate-100 text-gray-cool">Inactivo</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
