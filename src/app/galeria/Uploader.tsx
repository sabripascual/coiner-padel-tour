"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { compressImage, randomName } from "@/lib/image";
import { formatDate } from "@/lib/utils";

type Opt = { tournament: string; rounds: { id: string; number: number; played_on: string | null }[] };

export default function Uploader({ userId, options }: { userId: string; options: Opt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roundId, setRoundId] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    const supabase = createClient();
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`Comprimiendo y subiendo ${i + 1} de ${files.length}…`);
        const { blob, width, height } = await compressImage(files[i]);
        const path = `${userId}/${randomName()}`;
        const up = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        const { error } = await supabase.from("photos").insert({
          uploader_id: userId, round_id: roundId || null, path, caption: caption.trim() || null, width, height,
        });
        if (error) throw error;
      }
      setFiles([]); setCaption(""); setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn-accent w-full">📸 Subir fotos</button>;

  return (
    <form onSubmit={upload} className="card space-y-3 p-4">
      <div>
        <label className="label">¿De qué fecha son?</label>
        <select className="input" value={roundId} onChange={(e) => setRoundId(e.target.value)}>
          <option value="">Sin fecha específica</option>
          {options.map((o) => (
            <optgroup key={o.tournament} label={o.tournament}>
              {o.rounds.map((r) => <option key={r.id} value={r.id}>Fecha {r.number}{r.played_on ? ` · ${formatDate(r.played_on)}` : ""}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Descripción (opcional)</label>
        <input className="input" maxLength={120} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ej: ¡Final épica!" />
      </div>
      <label className="btn-secondary w-full cursor-pointer">
        {files.length ? `${files.length} foto(s) seleccionada(s)` : "Elegir fotos"}
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      </label>
      {progress && <p className="text-sm text-brand-700">{progress}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={!!progress}>Cancelar</button>
        <button className="btn-accent flex-1" disabled={!files.length || !!progress}>Subir</button>
      </div>
    </form>
  );
}
