-- =====================================================================
-- 004 — Duración del turno y ubicación (Google Maps) por fecha
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- (se puede ejecutar más de una vez sin problema)
-- =====================================================================

-- Duración en horas, en pasos de media hora (1; 1,5; 2; 2,5; 3 …)
alter table public.rounds add column if not exists duration_hours numeric(3, 1);
do $$ begin
  alter table public.rounds add constraint rounds_duration_check
    check (duration_hours is null or (duration_hours between 0.5 and 6 and duration_hours * 2 = floor(duration_hours * 2)));
exception when duplicate_object then null; end $$;

-- Link de Google Maps del lugar (opcional; si falta se busca por el nombre del lugar)
alter table public.rounds add column if not exists maps_url text;
do $$ begin
  alter table public.rounds add constraint rounds_maps_url_check
    check (maps_url is null or maps_url ~* '^https://');
exception when duplicate_object then null; end $$;
