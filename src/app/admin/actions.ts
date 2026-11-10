"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { usernameToEmail } from "@/lib/utils";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

// ---------------- Jugadores ----------------

export async function createPlayer(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const username = str(f, "username").toLowerCase();
  const password = str(f, "password");
  const first_name = str(f, "first_name");
  const last_name = str(f, "last_name");
  const nickname = str(f, "nickname") || null;
  const sex = str(f, "sex");
  const is_admin = f.get("is_admin") === "on";
  const email = (str(f, "email") || usernameToEmail(username)).toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email inválido" };
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return { error: "Usuario: 3 a 30 caracteres, solo minúsculas, números, punto, guion" };
  if (password.length < 6) return { error: "La clave debe tener al menos 6 caracteres" };
  if (!first_name || !last_name) return { error: "Nombre y apellido son obligatorios" };
  if (sex !== "F" && sex !== "M") return { error: "Elige el sexo" };

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { username },
  });
  if (error || !data.user) {
    return { error: error?.message.includes("already") ? "Ese email ya está registrado" : error?.message ?? "No se pudo crear" };
  }
  const { error: pErr } = await admin.from("profiles").insert({ id: data.user.id, username, first_name, last_name, nickname, sex, is_admin });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: pErr.message };
  }
  const tournamentId = str(f, "tournament_id");
  if (tournamentId) {
    await admin.from("tournament_players").insert({ tournament_id: tournamentId, player_id: data.user.id });
    revalidatePath(`/admin/torneos/${tournamentId}`);
  }
  revalidatePath("/admin/jugadores");
  return { ok: true, message: `Jugador creado${tournamentId ? " e inscrito" : ""}. Ingresa con: ${email}` };
}

export async function updatePlayer(_: ActionState, f: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const id = str(f, "id");
  const is_admin = f.get("is_admin") === "on";
  if (id === me.id && !is_admin) return { error: "No puedes quitarte el permiso de admin a ti mismo" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    first_name: str(f, "first_name"),
    last_name: str(f, "last_name"),
    nickname: str(f, "nickname") || null,
    sex: str(f, "sex"),
    is_admin,
    active: f.get("active") === "on",
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/jugadores");
  return { ok: true, message: "Cambios guardados" };
}

export async function resetPassword(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const password = str(f, "password");
  if (password.length < 6) return { error: "La clave debe tener al menos 6 caracteres" };
  const { error } = await createServiceClient().auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { ok: true, message: "Clave reseteada. Pásasela al jugador." };
}

// ---------------- Torneos ----------------

export async function createTournament(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(f, "name");
  if (!name) return { error: "Ponle un nombre al torneo" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tournaments").insert({ name }).select("id").single();
  if (error) return { error: error.message };
  // Inscribe por defecto a todos los jugadores activos
  const { data: players } = await supabase.from("profiles").select("id").eq("active", true);
  if (players?.length) {
    await supabase.from("tournament_players").insert(players.map((p) => ({ tournament_id: data.id, player_id: p.id })));
  }
  redirect(`/admin/torneos/${data.id}`);
}

export async function renameTournament(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("tournaments").update({ name: str(f, "name") }).eq("id", str(f, "id"));
  if (error) return { error: error.message };
  revalidatePath(`/admin/torneos/${str(f, "id")}`);
  return { ok: true, message: "Nombre guardado" };
}

export async function setTournamentStatus(id: string, status: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_tournament_status", { p_tournament_id: id, p_status: status });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/torneos/${id}`);
  revalidatePath("/");
}

export async function deleteTournament(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/admin");
}

/** Inscribe (o quita) jugadores. La base de datos impide quitar a quien ya jugó en el torneo. */
export async function setEnrollment(tournamentId: string, playerIds: string[], enrolled: boolean): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = enrolled
    ? await supabase.from("tournament_players").upsert(playerIds.map((player_id) => ({ tournament_id: tournamentId, player_id })))
    : await supabase.from("tournament_players").delete().eq("tournament_id", tournamentId).in("player_id", playerIds);
  revalidatePath(`/admin/torneos/${tournamentId}`);
  if (error) return { error: error.message.includes("ya jugó") ? "No se puede quitar: ya jugó partidos en este torneo" : error.message };
  return { ok: true };
}

export async function updateRound(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const costRaw = str(f, "court_cost").replace(/[^0-9]/g, "");
  const { error } = await supabase.from("rounds").update({
    played_on: str(f, "played_on") || null,
    start_time: str(f, "start_time") || null,
    place: str(f, "place") || null,
    court_cost: costRaw ? Number(costRaw) : null,
  }).eq("id", str(f, "id"));
  if (error) return { error: error.message };
  revalidatePath(`/admin/torneos/${str(f, "tournament_id")}`);
  return { ok: true, message: "Fecha guardada" };
}
