import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import type { Profile } from "./types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

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
