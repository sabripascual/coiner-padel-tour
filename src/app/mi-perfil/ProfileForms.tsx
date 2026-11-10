"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { compressImage, randomName } from "@/lib/image";
import type { Profile } from "@/lib/types";

export default function ProfileForms({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveNickname(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update({ nickname: nickname.trim() || null }).eq("id", profile.id);
    setMsg(error ? { ok: false, t: error.message } : { ok: true, t: "Apodo guardado" });
    router.refresh();
  }

  async function uploadAvatar(file: File) {
    setBusy(true);
    try {
      const { blob } = await compressImage(file, 400, 0.15);
      const path = `${profile.id}/${randomName()}`;
      const up = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
      if (error) throw error;
      setMsg({ ok: true, t: "Foto de perfil actualizada" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, t: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return setMsg({ ok: false, t: "La clave debe tener al menos 6 caracteres" });
    if (pw !== pw2) return setMsg({ ok: false, t: "Las claves no coinciden" });
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? { ok: false, t: error.message } : { ok: true, t: "Clave cambiada" });
    setPw(""); setPw2("");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <h2 className="h2">Mis datos</h2>
      {msg && <p className={`rounded-xl px-3 py-2 text-sm font-medium ${msg.ok ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"}`}>{msg.t}</p>}

      <div className="card space-y-4 p-4">
        <label className="btn-secondary w-full cursor-pointer">
          {busy ? "Subiendo…" : "📷 Cambiar foto de perfil"}
          <input type="file" accept="image/*" className="hidden" disabled={busy}
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </label>

        <form onSubmit={saveNickname} className="flex gap-2">
          <input className="input" placeholder="Apodo" value={nickname} maxLength={30} onChange={(e) => setNickname(e.target.value)} />
          <button className="btn-primary">Guardar</button>
        </form>

        <form onSubmit={changePassword} className="space-y-2">
          <p className="text-sm font-medium">Cambiar clave</p>
          <input type="password" className="input" placeholder="Nueva clave" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <input type="password" className="input" placeholder="Repetir clave" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <button className="btn-secondary w-full">Cambiar clave</button>
        </form>
      </div>

      <button onClick={logout} className="btn-secondary w-full text-red-600">Cerrar sesión</button>
    </section>
  );
}
