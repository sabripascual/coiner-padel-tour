import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";
import { fullName } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import EditPlayer from "./EditPlayer";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Profile;
  return (
    <div className="space-y-5">
      <Link href="/admin/jugadores" className="text-sm font-semibold text-brand-700">← Jugadores</Link>
      <div className="flex items-center gap-3">
        <Avatar src={p.avatar_url} name={p.first_name} size={56} />
        <div><h1 className="h1">{fullName(p)}</h1><p className="text-sm text-gray-cool">@{p.username}</p></div>
      </div>
      <EditPlayer player={p} isSelf={p.id === me.id} />
    </div>
  );
}
