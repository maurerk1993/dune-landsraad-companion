-- Landsraad location popup data + image storage setup

create table if not exists public.landsraad_location_content (
  key text primary key,
  entries jsonb not null default '{}'::jsonb,
  farm_sources jsonb not null default '[]'::jsonb,
  dune_tools jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.landsraad_location_content enable row level security;

-- Authenticated users can read popup content.
drop policy if exists "landsraad_location_content_select_auth" on public.landsraad_location_content;
create policy "landsraad_location_content_select_auth"
  on public.landsraad_location_content
  for select
  to authenticated
  using (true);

-- Only maurerk1993@gmail.com can create/update/delete popup content.
drop policy if exists "landsraad_location_content_admin_insert" on public.landsraad_location_content;
create policy "landsraad_location_content_admin_insert"
  on public.landsraad_location_content
  for insert
  to authenticated
  with check (lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com');

drop policy if exists "landsraad_location_content_admin_update" on public.landsraad_location_content;
create policy "landsraad_location_content_admin_update"
  on public.landsraad_location_content
  for update
  to authenticated
  using (lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com');

drop policy if exists "landsraad_location_content_admin_delete" on public.landsraad_location_content;
create policy "landsraad_location_content_admin_delete"
  on public.landsraad_location_content
  for delete
  to authenticated
  using (lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com');

-- Storage bucket for house location images.
insert into storage.buckets (id, name, public)
values ('landsraad-location-images', 'landsraad-location-images', true)
on conflict (id) do nothing;

-- Authenticated users can view images.
drop policy if exists "landsraad_location_images_select_auth" on storage.objects;
create policy "landsraad_location_images_select_auth"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'landsraad-location-images');

-- Only maurerk1993@gmail.com can upload/update/delete images.
drop policy if exists "landsraad_location_images_admin_insert" on storage.objects;
create policy "landsraad_location_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'landsraad-location-images'
    and lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com'
  );

drop policy if exists "landsraad_location_images_admin_update" on storage.objects;
create policy "landsraad_location_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'landsraad-location-images'
    and lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com'
  )
  with check (
    bucket_id = 'landsraad-location-images'
    and lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com'
  );

drop policy if exists "landsraad_location_images_admin_delete" on storage.objects;
create policy "landsraad_location_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'landsraad-location-images'
    and lower(auth.jwt() ->> 'email') = 'maurerk1993@gmail.com'
  );
