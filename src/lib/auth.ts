import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import type { Profile } from "./types";

/** Una sola consulta por request aunque la llamen el layout y la página. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (profile as Profile) ?? null;
});

export async function requireUser(): Promise<Profile> {
  const p = await getCurrentProfile();
  if (!p || !p.active) redirect("/login");
  return p;
}

export async function requireAdmin(): Promise<Profile> {
  const p = await requireUser();
  if (!p.is_admin) redirect("/mi-perfil");
  return p;
}
