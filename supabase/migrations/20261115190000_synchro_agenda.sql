-- Synchro agenda téléphone : flux iCal privé par pro (iPhone, Google Agenda, Outlook).
--
-- * Le jeton reste dans profiles.ical_token (lisible uniquement par la pro via la RLS profiles_own).
--   Les nouveaux jetons font 32 octets aléatoires, encodés en base64 url-safe.
--   Les jetons existants (16 octets) restent valides pour ne casser aucun abonnement en cours ;
--   « Réinitialiser le lien » les remplace par un jeton de 32 octets.
-- * get_calendar_feed(token) : appelé par /api/agenda/<token>.ics (anon), renvoie le strict nécessaire
--   et note la date du dernier passage du calendrier (ical_last_fetched_at).
-- * mark_calendar_connected() / reset_calendar_token() : réservés à la pro connectée.

create or replace function public.new_calendar_token()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select translate(rtrim(encode(gen_random_bytes(32), 'base64'), '='), '+/', '-_');
$$;

alter table public.profiles
  alter column ical_token set default public.new_calendar_token();

alter table public.profiles
  add column if not exists ical_connected_at timestamptz,
  add column if not exists ical_last_fetched_at timestamptz;

create or replace function public.get_calendar_feed(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{24,128}$' then
    return null;
  end if;

  select * into v_profile from public.profiles where ical_token = p_token;
  if not found then
    return null;
  end if;

  -- Une écriture au plus par minute, même si le calendrier interroge souvent.
  if v_profile.ical_last_fetched_at is null or v_profile.ical_last_fetched_at < now() - interval '1 minute' then
    update public.profiles set ical_last_fetched_at = now() where id = v_profile.id;
  end if;

  return jsonb_build_object(
    'salon_name', v_profile.full_name,
    'timezone', v_profile.timezone,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'starts_at', a.starts_at,
        'ends_at', a.ends_at,
        'status', a.status,
        'service_name', coalesce(nullif(trim(a.service_name), ''), s.name),
        'client_first_name', nullif(split_part(trim(coalesce(nullif(a.client_name, ''), c.full_name, '')), ' ', 1), ''),
        'client_phone', nullif(trim(coalesce(nullif(a.client_phone, ''), c.phone, '')), ''),
        'notes', nullif(trim(coalesce(a.notes, '')), '')
      ) order by a.starts_at)
      from public.appointments a
      left join public.services s on s.id = a.service_id
      left join public.clients c on c.id = a.client_id
      where a.profile_id = v_profile.id
        and a.status <> 'cancelled'
        and a.starts_at >= now() - interval '30 days'
        and a.starts_at < now() + interval '12 months'
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.mark_calendar_connected()
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Connexion requise.';
  end if;
  update public.profiles
     set ical_connected_at = coalesce(ical_connected_at, now())
   where id = auth.uid();
end;
$$;

create or replace function public.reset_calendar_token()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_token text := public.new_calendar_token();
begin
  if auth.uid() is null then
    raise exception 'Connexion requise.';
  end if;
  update public.profiles
     set ical_token = v_token,
         ical_connected_at = null,
         ical_last_fetched_at = null
   where id = auth.uid();
  if not found then
    raise exception 'Profil introuvable.';
  end if;
  return v_token;
end;
$$;

revoke all on function public.new_calendar_token() from public, anon, authenticated;

revoke all on function public.get_calendar_feed(text) from public;
grant execute on function public.get_calendar_feed(text) to anon, authenticated;

revoke all on function public.mark_calendar_connected() from public, anon;
grant execute on function public.mark_calendar_connected() to authenticated;

revoke all on function public.reset_calendar_token() from public, anon;
grant execute on function public.reset_calendar_token() to authenticated;
