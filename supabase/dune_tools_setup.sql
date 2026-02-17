-- Add shared Dune Tools content storage to landsraad_location_content

alter table public.landsraad_location_content
add column if not exists dune_tools jsonb not null default '[]'::jsonb;

update public.landsraad_location_content
set dune_tools = '[]'::jsonb
where dune_tools is null;
