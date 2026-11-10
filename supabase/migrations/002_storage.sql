-- =====================================================================
-- Almacenamiento de imágenes (buckets públicos de solo lectura)
-- Cada usuario sube dentro de una carpeta con su propio id:
--   photos/<user_id>/<archivo>.jpg     avatars/<user_id>/<archivo>.jpg
-- Ejecutar después de 001_schema.sql
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos',  'photos',  true, 2097152, array['image/jpeg', 'image/webp', 'image/png']),
  ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "subir a carpeta propia" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('photos', 'avatars')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "borrar archivo propio o admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('photos', 'avatars')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "reemplazar archivo propio o admin" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('photos', 'avatars')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
