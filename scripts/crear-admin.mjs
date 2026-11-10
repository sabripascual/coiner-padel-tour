// Crea el primer admin. Uso:
//   node --env-file=.env.local scripts/crear-admin.mjs usuario clave Nombre Apellido F|M
import { createClient } from "@supabase/supabase-js";

const [username, password, first_name, last_name, sex] = process.argv.slice(2);
if (!username || !password || !first_name || !last_name || !["F", "M"].includes(sex)) {
  console.error("Uso: node --env-file=.env.local scripts/crear-admin.mjs usuario clave Nombre Apellido F|M");
  process.exit(1);
}
const domain = process.env.NEXT_PUBLIC_LOGIN_DOMAIN || "padelcoiner.app";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await sb.auth.admin.createUser({
  email: `${username.toLowerCase()}@${domain}`, password, email_confirm: true,
});
if (error) { console.error("Error creando usuario:", error.message); process.exit(1); }
const { error: e2 } = await sb.from("profiles").insert({
  id: data.user.id, username: username.toLowerCase(), first_name, last_name, sex, is_admin: true,
});
if (e2) { console.error("Error creando perfil:", e2.message); process.exit(1); }
console.log(`Admin creado: ${username}`);
