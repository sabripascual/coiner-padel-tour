"use client";
import { useActionState } from "react";
import { resetPassword, updatePlayer } from "../../actions";
import FormMessage from "@/components/FormMessage";
import type { Profile } from "@/lib/types";

export default function EditPlayer({ player: p, isSelf }: { player: Profile; isSelf: boolean }) {
  const [s1, a1, pend1] = useActionState(updatePlayer, null);
  const [s2, a2, pend2] = useActionState(resetPassword, null);
  return (
    <div className="space-y-4">
      <form action={a1} className="card space-y-3 p-4">
        <input type="hidden" name="id" value={p.id} />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Nombre</label><input name="first_name" defaultValue={p.first_name} className="input" required /></div>
          <div><label className="label">Apellido</label><input name="last_name" defaultValue={p.last_name} className="input" required /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Apodo</label><input name="nickname" defaultValue={p.nickname ?? ""} className="input" /></div>
          <div>
            <label className="label">Sexo</label>
            <select name="sex" defaultValue={p.sex} className="input"><option value="F">Mujer</option><option value="M">Hombre</option></select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_admin" defaultChecked={p.is_admin} disabled={isSelf} className="h-4 w-4" /> Es admin {isSelf && "(no puedes quitártelo)"}</label>
        {isSelf && <input type="hidden" name="is_admin" value="on" />}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.active} className="h-4 w-4" /> Activo (puede ingresar)</label>
        <FormMessage state={s1} />
        <button className="btn-primary w-full" disabled={pend1}>Guardar cambios</button>
      </form>

      <form action={a2} className="card space-y-3 p-4">
        <input type="hidden" name="id" value={p.id} />
        <h2 className="h2">Resetear clave</h2>
        <input name="password" className="input" placeholder="Nueva clave (mín. 6)" minLength={6} required />
        <FormMessage state={s2} />
        <button className="btn-secondary w-full" disabled={pend2}>Resetear clave</button>
      </form>
    </div>
  );
}
