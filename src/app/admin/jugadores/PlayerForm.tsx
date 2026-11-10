"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { createPlayer } from "../actions";
import FormMessage from "@/components/FormMessage";

export default function PlayerForm({ tournamentId, label = "+ Nuevo jugador" }: { tournamentId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createPlayer, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  if (!open) return <button onClick={() => setOpen(true)} className="btn-primary w-full">{label}</button>;

  return (
    <form ref={ref} action={action} className="card space-y-3 p-4">
      <h2 className="h2">Nuevo jugador</h2>
      {tournamentId && <input type="hidden" name="tournament_id" value={tournamentId} />}
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Nombre</label><input name="first_name" className="input" required /></div>
        <div><label className="label">Apellido</label><input name="last_name" className="input" required /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Apodo</label><input name="nickname" className="input" /></div>
        <div>
          <label className="label">Sexo</label>
          <select name="sex" className="input" required defaultValue="">
            <option value="" disabled>Elegir</option>
            <option value="F">Mujer</option>
            <option value="M">Hombre</option>
          </select>
        </div>
      </div>
      <div><label className="label">Email (con el que ingresará)</label><input name="email" type="email" className="input" autoCapitalize="none" placeholder="nombre@totalcoin.com" required /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Usuario (visible)</label><input name="username" className="input" autoCapitalize="none" required placeholder="ej: jperez" /></div>
        <div><label className="label">Clave inicial</label><input name="password" className="input" required minLength={6} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_admin" className="h-4 w-4" /> Dar permiso de admin</label>
      <FormMessage state={state} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cerrar</button>
        <button className="btn-primary flex-1" disabled={pending}>{pending ? "Creando…" : "Crear jugador"}</button>
      </div>
    </form>
  );
}
