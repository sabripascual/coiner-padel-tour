/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { getTournaments } from "@/lib/queries";
import { photoUrl } from "@/lib/utils";
import type { Round } from "@/lib/types";
import Uploader from "./Uploader";

export const dynamic = "force-dynamic";

type Row = { id: string; path: string; caption: string | null; round_id: string | null; photo_likes: { count: number }[]; photo_comments: { count: number }[] };

export default async function Galeria({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha } = await searchParams;
  const supabase = await createClient();
  const [me, tournaments, { data: rounds }] = await Promise.all([
    getCurrentProfile(),
    getTournaments(),
    supabase.from("rounds").select("*").order("number"),
  ]);
  const visibleT = tournaments.filter((t) => t.status !== "borrador");
  const allRounds = ((rounds as Round[]) ?? []).filter((r) => visibleT.some((t) => t.id === r.tournament_id));

  let q = supabase.from("photos").select("id, path, caption, round_id, photo_likes(count), photo_comments(count)").order("created_at", { ascending: false }).limit(200);
  if (fecha) q = q.eq("round_id", fecha);
  const { data } = await q;
  const photos = (data as Row[]) ?? [];

  const options = visibleT.map((t) => ({
    tournament: t.name,
    rounds: allRounds.filter((r) => r.tournament_id === t.id).map((r) => ({ id: r.id, number: r.number, played_on: r.played_on })),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1">Galería</h1>
        <span className="text-sm text-gray-cool">{photos.length} fotos</span>
      </div>

      {me ? <Uploader userId={me.id} options={options} /> : (
        <Link href="/login" className="card block p-4 text-center text-sm font-semibold text-brand-700">Ingresa para subir tus fotos 📸</Link>
      )}

      <form className="flex gap-2">
        <select name="fecha" defaultValue={fecha ?? ""} className="input">
          <option value="">Todas las fechas</option>
          {options.map((o) => (
            <optgroup key={o.tournament} label={o.tournament}>
              {o.rounds.map((r) => <option key={r.id} value={r.id}>Fecha {r.number}</option>)}
            </optgroup>
          ))}
        </select>
        <button className="btn-secondary">Filtrar</button>
      </form>

      {photos.length === 0 ? (
        <p className="card p-6 text-center text-sm text-gray-cool">No hay fotos todavía.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {photos.map((p) => (
            <Link key={p.id} href={`/galeria/${p.id}`} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-200">
              <img src={photoUrl(p.path)} alt={p.caption ?? "Foto"} loading="lazy" className="h-full w-full object-cover transition group-active:scale-95" />
              {(p.photo_likes[0]?.count > 0 || p.photo_comments[0]?.count > 0) && (
                <span className="absolute bottom-1 left-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {p.photo_likes[0]?.count > 0 && `♥ ${p.photo_likes[0].count} `}
                  {p.photo_comments[0]?.count > 0 && `💬 ${p.photo_comments[0].count}`}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
