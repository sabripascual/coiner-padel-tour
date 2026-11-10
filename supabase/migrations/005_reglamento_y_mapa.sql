-- =====================================================================
-- 005 — Nuevo reglamento de puntos + ubicación en el mapa
--
-- Reglamento:
--   * Ganar un partido: +3 puntos por jugador (sus games NO suman).
--   * Perder 2-1: +1 punto por jugador (el game ganado).
--   * Perder 2-0: 0 puntos.
--   "games" pasa a contar solo los games ganados en partidos perdidos
--   (como máximo 1 por partido perdido).  Puntos = 3 × ganados + games.
--   Desempate: puntos > partidos ganados > games.
--
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- Se puede ejecutar más de una vez: la conversión de datos se hace una sola vez.
-- =====================================================================

-- Registro de migraciones de datos ya aplicadas
create table if not exists public.app_migrations (
  name        text primary key,
  applied_at  timestamptz not null default now()
);
alter table public.app_migrations enable row level security;

-- 1) Convertir los datos cargados con el reglamento anterior (una sola vez)
--    Antes: games = games de partidos ganados (2 c/u) + games de perdidos.
--    Ahora: games = solo los de partidos perdidos.
do $$
begin
  if not exists (select 1 from public.app_migrations where name = '005_reglamento') then
    update public.round_stats
    set games = greatest(0, least(games - 2 * won, played - won))
    where games <> greatest(0, least(games - 2 * won, played - won));

    insert into public.app_migrations (name) values ('005_reglamento');
  end if;
end $$;

-- 2) Regla en la base de datos: games ≤ partidos perdidos
do $$ begin
  alter table public.round_stats add constraint round_stats_games_rule check (games <= played - won);
exception when duplicate_object then null; end $$;

-- 3) Botones del admin con el nuevo reglamento
--    +/- Ganados también suma/resta el partido jugado (un toque por ganador).
--    +/- Jugados representa un partido perdido.
--    +/- Games solo para quien perdió y ganó un game.
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

  if p_field = 'won' then
    r.won := r.won + p_delta;
    r.played := r.played + p_delta;
  elsif p_field = 'played' then
    r.played := r.played + p_delta;
  else
    r.games := r.games + p_delta;
  end if;

  if r.played < 0 or r.won < 0 or r.games < 0 then
    raise exception 'El valor no puede quedar negativo';
  end if;
  if r.won > r.played then
    raise exception 'No puede haber más ganados que jugados: resta primero un ganado';
  end if;
  if r.games > r.played - r.won then
    if p_field = 'games' then
      raise exception 'Solo suma games quien perdió el partido (máximo 1 por partido perdido)';
    else
      raise exception 'Resta primero un game: tiene % game(s) y quedaría con % partido(s) perdido(s)',
        r.games, r.played - r.won;
    end if;
  end if;

  update public.round_stats
  set played = r.played, won = r.won, games = r.games,
      updated_at = now(), updated_by = auth.uid()
  where round_id = p_round_id and player_id = p_player_id
  returning * into r;

  return r;
end $$;

-- 4) Campeones con el nuevo desempate: puntos > ganados > games
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
        order by points desc, won desc, games desc limit 1) end,
      champion_m = case when p_status = 'finalizado' then (
        select player_id from public.ranking_tournament
        where tournament_id = p_tournament_id and sex = 'M' and played > 0
        order by points desc, won desc, games desc limit 1) end
  where id = p_tournament_id
  returning * into t;

  return t;
end $$;

-- 5) Ubicación marcada en el mapa
alter table public.rounds add column if not exists lat double precision;
alter table public.rounds add column if not exists lng double precision;
do $$ begin
  alter table public.rounds add constraint rounds_latlng_check
    check ((lat is null and lng is null) or (lat between -90 and 90 and lng between -180 and 180));
exception when duplicate_object then null; end $$;
