-- Adds shared farm source options to landsraad location content.
-- Run this in Supabase SQL editor before deploying v3.3.0.

alter table public.landsraad_location_content
add column if not exists farm_sources jsonb not null default '[]'::jsonb;

update public.landsraad_location_content
set farm_sources = '[]'::jsonb
where farm_sources is null;


alter table public.landsraad_location_content
add column if not exists dune_tools jsonb not null default '[]'::jsonb;

update public.landsraad_location_content
set dune_tools = '[]'::jsonb
where dune_tools is null;
