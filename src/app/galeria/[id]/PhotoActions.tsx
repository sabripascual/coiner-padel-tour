"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Avatar from "@/components/Avatar";

type C = { id: string; body: string; created_at: string; user_id: string; name: string; avatar: string | null; first: string };

export default function PhotoActions({ photoId, path, me, canDelete, likes, comments }: {
  photoId: string; path: string; me: { id: string; isAdmin: boolean } | null; canDelete: boolean; likes: string[]; comments: C[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [liked, setLiked] = useState(!!me && likes.includes(me.id));
  const [count, setCount] = useState(likes.length);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function toggleLike() {
    if (!me) return router.push("/login");
    const next = !liked;
    setLiked(next); setCount((c) => c + (next ? 1 : -1));
    const { error } = next
      ? await supabase.from("photo_likes").insert({ photo_id: photoId, user_id: me.id })
      : await supabase.from("photo_likes").delete().eq("photo_id", photoId).eq("user_id", me.id);
    if (error) { setLiked(!next); setCount((c) => c + (next ? -1 : 1)); }
  }

  async function comment(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !body.trim()) return;
    setSending(true);
    await supabase.from("photo_comments").insert({ photo_id: photoId, user_id: me.id, body: body.trim() });
    setBody(""); setSending(false);
    router.refresh();
  }

  async function deleteComment(id: string) {
    if (!confirm("¿Borrar comentario?")) return;
    await supabase.from("photo_comments").delete().eq("id", id);
    router.refresh();
  }

  async function deletePhoto() {
    if (!confirm("¿Borrar esta foto para siempre?")) return;
    await supabase.storage.from("photos").remove([path]);
    await supabase.from("photos").delete().eq("id", photoId);
    router.push("/galeria");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={toggleLike} className={`btn flex-1 ${liked ? "bg-red-50 text-red-600 ring-1 ring-red-200" : "bg-white ring-1 ring-slate-300"}`}>
          {liked ? "♥" : "♡"} Me gusta · {count}
        </button>
        {canDelete && <button onClick={deletePhoto} className="btn-secondary text-red-600">Borrar foto</button>}
      </div>

      <section className="card divide-y divide-gray-light">
        <h2 className="px-4 py-3 font-bold">Comentarios ({comments.length})</h2>
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3 px-4 py-3">
            <Avatar src={c.avatar} name={c.first} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-[11px] text-gray-cool">{new Date(c.created_at).toLocaleDateString("es")}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{c.body}</p>
              {me && (me.id === c.user_id || me.isAdmin) && (
                <button onClick={() => deleteComment(c.id)} className="mt-1 text-xs text-gray-cool hover:text-red-600">Borrar</button>
              )}
            </div>
          </div>
        ))}
        {me ? (
          <form onSubmit={comment} className="flex gap-2 p-3">
            <input className="input" placeholder="Escribe un comentario…" maxLength={500} value={body} onChange={(e) => setBody(e.target.value)} />
            <button className="btn-primary" disabled={sending || !body.trim()}>Enviar</button>
          </form>
        ) : (
          <Link href="/login" className="block p-3 text-center text-sm font-semibold text-brand-700">Ingresa para comentar</Link>
        )}
      </section>
    </div>
  );
}
