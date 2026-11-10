/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { displayName, formatDate, photoUrl } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import PhotoActions from "./PhotoActions";

export const dynamic = "force-dynamic";

type P = { first_name: string; last_name: string; nickname: string | null; avatar_url: string | null };

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const { data: photo } = await supabase
    .from("photos")
    .select("*, uploader:profiles!photos_uploader_id_fkey(first_name,last_name,nickname,avatar_url), rounds(number, played_on, tournaments(name))")
    .eq("id", id)
    .maybeSingle();
  if (!photo) notFound();

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("photo_likes").select("user_id").eq("photo_id", id),
    supabase.from("photo_comments").select("id, body, created_at, user_id, profiles(first_name,last_name,nickname,avatar_url)").eq("photo_id", id).order("created_at"),
  ]);

  const uploader = photo.uploader as P;
  const round = photo.rounds as { number: number; played_on: string | null; tournaments: { name: string } } | null;

  return (
    <div className="space-y-4">
      <Link href="/galeria" className="text-sm font-semibold text-brand-700">← Galería</Link>
      <figure className="card overflow-hidden">
        <img src={photoUrl(photo.path)} alt={photo.caption ?? "Foto"} className="max-h-[75vh] w-full bg-slate-900 object-contain" />
        <figcaption className="space-y-1 p-4">
          {photo.caption && <p className="font-semibold">{photo.caption}</p>}
          <div className="flex items-center gap-2 text-sm text-gray-cool">
            <Avatar src={uploader.avatar_url} name={uploader.first_name} size={24} />
            <span>{displayName(uploader)}</span>
            <span>·</span>
            <span>{round ? `${round.tournaments.name} · Fecha ${round.number}` : formatDate(photo.created_at)}</span>
          </div>
        </figcaption>
      </figure>

      <PhotoActions
        photoId={id}
        path={photo.path}
        me={me ? { id: me.id, isAdmin: me.is_admin } : null}
        canDelete={!!me && (me.id === photo.uploader_id || me.is_admin)}
        likes={(likes ?? []).map((l) => l.user_id as string)}
        comments={((comments ?? []) as unknown as { id: string; body: string; created_at: string; user_id: string; profiles: P }[]).map((c) => ({
          id: c.id, body: c.body, created_at: c.created_at, user_id: c.user_id,
          name: displayName(c.profiles), avatar: c.profiles.avatar_url, first: c.profiles.first_name,
        }))}
      />
    </div>
  );
}
