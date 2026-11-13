-- Inscription courte : le compte crée seulement la fiche pro.
-- Le slug vient du nom d'enseigne et de la ville.
-- Prestations et horaires se remplissent ensuite dans Réglages.
-- À exécuter après 20261113120000_init.sql (remplace handle_new_user).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := coalesce(nullif(trim(meta->>'full_name'), ''), split_part(coalesce(new.email, 'pro'), '@', 1));
  v_profession text := coalesce(nullif(trim(meta->>'profession'), ''), 'Prothésiste ongulaire');
  v_city text := coalesce(trim(meta->>'city'), '');
  v_phone text := coalesce(trim(meta->>'phone'), '');
  v_slug text;
begin
  v_slug := public.unique_slug(v_name || '-' || v_city);

  insert into public.profiles (id, full_name, profession, city, phone, slug)
  values (new.id, v_name, v_profession, v_city, v_phone, v_slug);

  insert into public.google_calendar_connections (profile_id, status)
  values (new.id, 'not_connected')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;
