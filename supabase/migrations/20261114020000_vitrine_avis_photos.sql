-- Vitrine : avis, bucket photos public, description déjà portée par profiles.bio
-- et services.description. Pas de catégorie.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select to anon, authenticated
  using (true);

drop policy if exists reviews_owner_write on public.reviews;
create policy reviews_owner_write on public.reviews
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create or replace function public.get_booking_context(
  p_slug text,
  p_from timestamptz,
  p_to timestamptz
) returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_profile public.profiles%rowtype;
  result jsonb;
begin
  select * into v_profile from public.profiles where slug = p_slug;
  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'full_name', v_profile.full_name,
    'profession', v_profile.profession,
    'city', v_profile.city,
    'phone', v_profile.phone,
    'slug', v_profile.slug,
    'address', v_profile.address,
    'bio', v_profile.bio,
    'min_notice_minutes', v_profile.min_notice_minutes,
    'timezone', v_profile.timezone,
    'review_count', coalesce((select count(*) from public.reviews r where r.profile_id = v_profile.id), 0),
    'rating_avg', (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.profile_id = v_profile.id),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'author_name', r.author_name,
        'rating', r.rating,
        'body', r.body,
        'created_at', r.created_at
      ) order by r.created_at desc)
      from public.reviews r
      where r.profile_id = v_profile.id
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'duration_min', s.duration_min,
        'price_cents', s.price_cents,
        'description', s.description
      ) order by s.sort_order, s.name)
      from public.services s
      where s.profile_id = v_profile.id and s.active
    ), '[]'::jsonb),
    'hours', coalesce((
      select jsonb_agg(jsonb_build_object(
        'isodow', h.isodow,
        'opens', to_char(h.opens, 'HH24:MI'),
        'closes', to_char(h.closes, 'HH24:MI'),
        'is_closed', h.is_closed
      ) order by h.isodow)
      from public.opening_hours h
      where h.profile_id = v_profile.id
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('id', ph.id, 'url', ph.url, 'caption', ph.caption) order by ph.sort_order, ph.created_at)
      from public.photos ph
      where ph.profile_id = v_profile.id
    ), '[]'::jsonb),
    'time_off', coalesce((
      select jsonb_agg(jsonb_build_object('starts_on', t.starts_on, 'ends_on', t.ends_on))
      from public.time_off t
      where t.profile_id = v_profile.id
        and t.ends_on >= (timezone(v_profile.timezone, p_from))::date
        and t.starts_on <= (timezone(v_profile.timezone, p_to))::date
    ), '[]'::jsonb),
    'busy', coalesce((
      select jsonb_agg(jsonb_build_object('starts_at', a.starts_at, 'ends_at', a.ends_at))
      from public.appointments a
      where a.profile_id = v_profile.id
        and a.status <> 'cancelled'
        and a.starts_at < p_to
        and a.ends_at > p_from
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_booking_context(text, timestamptz, timestamptz) from public;
grant execute on function public.get_booking_context(text, timestamptz, timestamptz) to anon, authenticated;

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'boutique-photos',
    'boutique-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  on conflict (id) do nothing;

  drop policy if exists boutique_photos_public_read on storage.objects;
  create policy boutique_photos_public_read on storage.objects
    for select to public
    using (bucket_id = 'boutique-photos');

  drop policy if exists boutique_photos_owner_insert on storage.objects;
  create policy boutique_photos_owner_insert on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'boutique-photos'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists boutique_photos_owner_update on storage.objects;
  create policy boutique_photos_owner_update on storage.objects
    for update to authenticated
    using (
      bucket_id = 'boutique-photos'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists boutique_photos_owner_delete on storage.objects;
  create policy boutique_photos_owner_delete on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'boutique-photos'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception
  when others then
    raise notice 'Bucket boutique-photos non configuré (%) — les URLs restent utilisables.', sqlerrm;
end $$;
