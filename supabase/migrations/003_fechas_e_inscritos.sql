-- =====================================================================
-- 003 — Datos de la reserva por fecha + protección de inscritos
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- (se puede ejecutar más de una vez sin problema)
-- =====================================================================

-- 1) Hora de la reserva y costo de la cancha en cada fecha
alter table public.rounds add column if not exists start_time time;
alter table public.rounds add column if not exists court_cost numeric(12, 2);

do $$ begin
  alter table public.rounds add constraint rounds_court_cost_check check (court_cost is null or court_cost >= 0);
exception when duplicate_object then null; end $$;

-- Auditar también los cambios de las fechas
drop trigger if exists trg_audit_rounds on public.rounds;
create trigger trg_audit_rounds after update on public.rounds
for each row execute function public.audit_trigger();

-- 2) No se puede quitar de un torneo a un jugador que ya jugó algún partido en él
create or replace function public.protect_enrollment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Si se está borrando el torneo completo, se permite
  if not exists (select 1 from public.tournaments where id = old.tournament_id) then
    return old;
  end if;

  if exists (
    select 1
    from public.round_stats s
    join public.rounds r on r.id = s.round_id
    where r.tournament_id = old.tournament_id
      and s.player_id = old.player_id
      and s.played > 0
  ) then
    raise exception 'No se puede quitar a un jugador que ya jugó partidos en este torneo';
  end if;
  return old;
end $$;

drop trigger if exists trg_protect_enrollment on public.tournament_players;
create trigger trg_protect_enrollment before delete on public.tournament_players
for each row execute function public.protect_enrollment();
