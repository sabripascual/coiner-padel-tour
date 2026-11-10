"use client";
import { useActionState } from "react";
import { createTournament } from "./actions";
import FormMessage from "@/components/FormMessage";

export default function CreateTournamentForm() {
  const [state, action, pending] = useActionState(createTournament, null);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="name" className="input" placeholder="Nombre del nuevo torneo" required />
        <button className="btn-primary shrink-0" disabled={pending}>Crear torneo →</button>
      </div>
      <p className="text-xs text-gray-cool">Se crea con 10 fechas y todos los jugadores activos inscritos.</p>
      <FormMessage state={state} />
    </form>
  );
}
