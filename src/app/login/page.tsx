"use client";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { usernameToEmail } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email: usernameToEmail(username), password });
    setLoading(false);
    if (error) return setError("Usuario o clave incorrectos");
    router.push("/mi-perfil");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm pt-6">
      <div className="mb-6 text-center">
        <div className="flex justify-center"><Logo size="lg" /></div>
        <h1 className="h1 mt-6">Ingresar</h1>
        <p className="text-sm text-gray-cool">Tu usuario y clave te los da el admin del torneo.</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="u">Usuario</label>
          <input id="u" className="input" autoCapitalize="none" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="p">Clave</label>
          <input id="p" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
        <p className="text-center text-xs text-gray-cool">¿Olvidaste la clave? Pídele al admin que la resetee.</p>
      </form>
    </div>
  );
}
