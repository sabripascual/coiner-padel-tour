-- =====================================================================
-- Torneo Pádel Coiner — esquema de base de datos (Supabase / Postgres)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Jugadores (perfil asociado a la cuenta de login)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  first_name  text not null,
  last_name   text not null,
  nickname    text,
  sex         text not null check (sex in ('F', 'M')),
  avatar_url  text,
  is_admin    boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ¿El usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- Torneos, inscritos y fechas
-- ---------------------------------------------------------------------
create table public.tournaments (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  status       text not null default 'borrador'
               check (status in ('borrador', 'en_curso', 'finalizado')),
  champion_f   uuid references public.profiles (id) on delete set null,
  champion_m   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz
);

create table public.tournament_players (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  player_id     uuid not null references public.profiles (id) on delete cascade,
  primary key (tournament_id, player_id)
);

create table public.rounds (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments (id) on delete cascade,
  number         int  not null check (number between 1 and 10),
  played_on      date,
  place          text,
  unique (tournament_id, number)
);

-- Cada torneo nace con sus 10 fechas
create or replace function public.create_rounds_for_tournament()
returns trigger language plpgsql as $$
begin
  insert into public.rounds (tournament_id, number)
  select new.id, n from generate_series(1, 10) as n;
  return new;
end $$;

create trigger trg_tournament_rounds
after insert on public.tournaments
for each row execute function public.create_rounds_for_tournament();

-- ---------------------------------------------------------------------
-- Contadores por jugador y fecha (lo que carga el admin con los botones)
-- puntos = games + 3 * partidos ganados
-- ---------------------------------------------------------------------
create table public.round_stats (
  round_id    uuid not null references public.rounds (id) on delete cascade,
  player_id   uuid not null references public.profiles (id) on delete cascade,
  played      int  not null default 0 check (played >= 0),
  won         int  not null default 0 check (won >= 0),
  games       int  not null default 0 check (games >= 0),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null,
  primary key (round_id, player_id),
  check (won <= played)
);

-- ---------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid references public.profiles (id) on delete set null,
  table_name  text not null,
  action      text not null,         -- INSERT / UPDATE / DELETE
  record_key  jsonb,
  old_data    jsonb,
  new_data    jsonb
);

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  k jsonb;
begin
  if tg_table_name = 'round_stats' then
    k := jsonb_build_object(
      'round_id',  coalesce(new.round_id,  old.round_id),
      'player_id', coalesce(new.player_id, old.player_id));
  else
    k := jsonb_build_object('id', coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id'));
  end if;

  insert into public.audit_log (actor_id, table_name, action, record_key, old_data, new_data)
  values (
    auth.uid(), tg_table_name, tg_op, k,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger trg_audit_round_stats after insert or update or delete on public.round_stats
for each row execute function public.audit_trigger();
create trigger trg_audit_tournaments after insert or update or delete on public.tournaments
for each row execute function public.audit_trigger();
create trigger trg_audit_profiles after insert or update or delete on public.profiles
for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------
-- Botones +/- del admin. Valida permisos, estado del torneo y coherencia.
-- ---------------------------------------------------------------------
create or replace function public.adjust_stat(
  p_round_id uuid, p_player_id uuid, p_field text, p_delta int)
returns public.round_stats
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  r public.round_stats;
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede cargar resultados';
  end if;
  if p_field not in ('played', 'won', 'games') then
    raise exception 'Campo inválido: %', p_field;
  end if;
  if p_delta not in (-1, 1) then
    raise exception 'Solo se puede sumar o restar 1';
  end if;

  select t.status into v_status
  from public.rounds ro join public.tournaments t on t.id = ro.tournament_id
  where ro.id = p_round_id;

  if v_status is null then raise exception 'Fecha inexistente'; end if;
  if v_status <> 'en_curso' then
    raise exception 'El torneo no está en curso (estado: %)', v_status;
  end if;

  insert into public.round_stats (round_id, player_id)
  values (p_round_id, p_player_id)
  on conflict do nothing;

  select * into r from public.round_stats
  where round_id = p_round_id and player_id = p_player_id
  for update;

  if p_field = 'played' then r.played := r.played + p_delta;
  elsif p_field = 'won' then r.won := r.won + p_delta;
  else r.games := r.games + p_delta;
  end if;

  if r.played < 0 or r.won < 0 or r.games < 0 then
    raise exception 'El valor no puede quedar negativo';
  end if;
  -- Sumar un ganado sin haber jugado: se suma también el jugado
  if r.won > r.played then
    if p_field = 'won' then r.played := r.won;
    else raise exception 'No puede haber más ganados que jugados';
    end if;
  end if;

  update public.round_stats
  set played = r.played, won = r.won, games = r.games,
      updated_at = now(), updated_by = auth.uid()
  where round_id = p_round_id and player_id = p_player_id
  returning * into r;

  return r;
end $$;

-- ---------------------------------------------------------------------
-- Rankings (vistas)
-- ---------------------------------------------------------------------
create or replace view public.ranking_tournament
with (security_invoker = true) as
select
  ro.tournament_id,
  p.id as player_id,
  p.first_name, p.last_name, p.nickname, p.sex, p.avatar_url,
  coalesce(sum(s.played), 0)::int                as played,
  coalesce(sum(s.won), 0)::int                   as won,
  coalesce(sum(s.games), 0)::int                 as games,
  coalesce(sum(s.games + 3 * s.won), 0)::int     as points,
  count(*) filter (where s.played > 0)::int      as rounds_attended
from public.tournament_players tp
join public.profiles p on p.id = tp.player_id
join public.rounds ro on ro.tournament_id = tp.tournament_id
left join public.round_stats s on s.round_id = ro.id and s.player_id = p.id
group by ro.tournament_id, p.id;

create or replace view public.ranking_historical
with (security_invoker = true) as
select
  p.id as player_id,
  p.first_name, p.last_name, p.nickname, p.sex, p.avatar_url,
  coalesce(sum(s.played), 0)::int                as played,
  coalesce(sum(s.won), 0)::int                   as won,
  coalesce(sum(s.games), 0)::int                 as games,
  coalesce(sum(s.games + 3 * s.won), 0)::int     as points,
  count(distinct ro.tournament_id) filter (where s.played > 0)::int as tournaments_played,
  (select count(*) from public.tournaments t
    where t.champion_f = p.id or t.champion_m = p.id)::int        as titles
from public.profiles p
left join public.round_stats s on s.player_id = p.id
left join public.rounds ro on ro.id = s.round_id
group by p.id;

-- ---------------------------------------------------------------------
-- Cambio de estado del torneo (al finalizar se declaran campeones)
-- Desempate: puntos > games > partidos ganados
-- ---------------------------------------------------------------------
create or replace function public.set_tournament_status(p_tournament_id uuid, p_status text)
returns public.tournaments
language plpgsql security definer set search_path = public as $$
declare
  t public.tournaments;
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede cambiar el estado del torneo';
  end if;
  if p_status not in ('borrador', 'en_curso', 'finalizado') then
    raise exception 'Estado inválido';
  end if;

  update public.tournaments
  set status = p_status,
      finished_at = case when p_status = 'finalizado' then now() else null end,
      champion_f = case when p_status = 'finalizado' then (
        select player_id from public.ranking_tournament
        where tournament_id = p_tournament_id and sex = 'F' and played > 0
        order by points desc, games desc, won desc limit 1) end,
      champion_m = case when p_status = 'finalizado' then (
        select player_id from public.ranking_tournament
        where tournament_id = p_tournament_id and sex = 'M' and played > 0
        order by points desc, games desc, won desc limit 1) end
  where id = p_tournament_id
  returning * into t;

  return t;
end $$;

-- ---------------------------------------------------------------------
-- Galería: fotos, me gusta y comentarios
-- ---------------------------------------------------------------------
create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  uploader_id  uuid not null references public.profiles (id) on delete cascade,
  round_id     uuid references public.rounds (id) on delete set null,
  path         text not null,           -- ruta dentro del bucket "photos"
  caption      text,
  width        int,
  height       int,
  created_at   timestamptz not null default now()
);

create table public.photo_likes (
  photo_id    uuid not null references public.photos (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (photo_id, user_id)
);

create table public.photo_comments (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references public.photos (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now()
);

create index on public.photos (created_at desc);
create index on public.photos (round_id);
create index on public.photo_comments (photo_id, created_at);
create index on public.round_stats (player_id);

-- ---------------------------------------------------------------------
-- Seguridad (Row Level Security)
-- Lectura pública: ranking, torneos, fechas, jugadores, fotos.
-- Escritura: admin, salvo fotos / likes / comentarios / perfil propio.
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.tournaments        enable row level security;
alter table public.tournament_players enable row level security;
alter table public.rounds             enable row level security;
alter table public.round_stats        enable row level security;
alter table public.audit_log          enable row level security;
alter table public.photos             enable row level security;
alter table public.photo_likes        enable row level security;
alter table public.photo_comments     enable row level security;

create policy "lectura publica" on public.profiles           for select using (true);
create policy "lectura publica" on public.tournaments        for select using (true);
create policy "lectura publica" on public.tournament_players for select using (true);
create policy "lectura publica" on public.rounds             for select using (true);
create policy "lectura publica" on public.round_stats        for select using (true);
create policy "lectura publica" on public.photos             for select using (true);
create policy "lectura publica" on public.photo_likes        for select using (true);
create policy "lectura publica" on public.photo_comments     for select using (true);

create policy "admin gestiona" on public.profiles           for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona" on public.tournaments        for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona" on public.tournament_players for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona" on public.rounds             for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona" on public.round_stats        for all using (public.is_admin()) with check (public.is_admin());
create policy "admin lee"      on public.audit_log          for select using (public.is_admin());

-- El jugador edita su propio perfil (apodo, foto). El trigger impide
-- que se cambie a sí mismo los campos sensibles.
create policy "editar perfil propio" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    if new.is_admin   is distinct from old.is_admin
    or new.username   is distinct from old.username
    or new.sex        is distinct from old.sex
    or new.active     is distinct from old.active then
      raise exception 'Solo un admin puede cambiar esos datos';
    end if;
  end if;
  return new;
end $$;

create trigger trg_protect_profile before update on public.profiles
for each row execute function public.protect_profile_fields();

create policy "subir fotos propias" on public.photos
  for insert to authenticated with check (uploader_id = auth.uid());
create policy "borrar foto propia o admin" on public.photos
  for delete using (uploader_id = auth.uid() or public.is_admin());
create policy "editar foto propia o admin" on public.photos
  for update using (uploader_id = auth.uid() or public.is_admin());

create policy "dar me gusta" on public.photo_likes
  for insert to authenticated with check (user_id = auth.uid());
create policy "quitar me gusta" on public.photo_likes
  for delete using (user_id = auth.uid());

create policy "comentar" on public.photo_comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "borrar comentario propio o admin" on public.photo_comments
  for delete using (user_id = auth.uid() or public.is_admin());

grant select on public.ranking_tournament, public.ranking_historical to anon, authenticated;
grant execute on function public.adjust_stat(uuid, uuid, text, int) to authenticated;
grant execute on function public.set_tournament_status(uuid, text) to authenticated;
