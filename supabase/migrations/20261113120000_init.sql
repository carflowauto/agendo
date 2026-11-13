-- Agendo V1
-- À coller une fois dans le SQL Editor Supabase (rôle postgres) puis Run.
-- Le script peut être relancé : les objets existants sont recréés ou laissés en place.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.slugify(input text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := lower(extensions.unaccent(coalesce(input, '')));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);
  if s = '' then
    s := 'pro';
  end if;
  return left(s, 40);
end;
$$;

create or replace function public.slug_is_reserved(s text)
returns boolean
language sql
immutable
as $$
  select s = any (array[
    'connexion', 'inscription', 'espace', 'invitation', 'ical', 'auth', 'api',
    'maquette', 'mot-de-passe-oublie', 'favicon', 'favicon.ico'
  ]);
$$;

create or replace function public.unique_slug(base text)
returns text
language plpgsql
volatile
as $$
declare
  root text;
  candidate text;
  n int := 0;
begin
  root := public.slugify(base);
  if public.slug_is_reserved(root) then
    root := root || '-pro';
  end if;
  candidate := root;
  while exists (select 1 from public.profiles where slug = candidate) and n < 50 loop
    n := n + 1;
    candidate := root || '-' || n::text;
  end loop;
  if exists (select 1 from public.profiles where slug = candidate) then
    candidate := root || '-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 5);
  end if;
  return candidate;
end;
$$;

create or replace function public.phone_digits(p text)
returns text
language sql
immutable
as $$
  select case
    when d like '0033%' and length(d) > 4 then '0' || substr(d, 5)
    when d like '33%' and length(d) = 11 then '0' || substr(d, 3)
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) s;
$$;

create or replace function public.paris_at(p_day date, p_time time)
returns timestamptz
language sql
stable
as $$
  select timezone('Europe/Paris', (p_day + p_time));
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  profession text not null default 'Prothésiste ongulaire',
  city text not null default '',
  phone text not null default '',
  slug text not null unique,
  address text,
  bio text,
  min_notice_minutes integer not null default 120 check (min_notice_minutes >= 0 and min_notice_minutes <= 10080),
  reminder_hours integer not null default 24 check (reminder_hours >= 0 and reminder_hours <= 168),
  refill_weeks integer not null default 3 check (refill_weeks >= 1 and refill_weeks <= 52),
  timezone text not null default 'Europe/Paris',
  ical_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  duration_min integer not null check (duration_min between 5 and 480),
  price_cents integer not null check (price_cents >= 0 and price_cents <= 1000000),
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  isodow integer not null check (isodow between 1 and 7),
  opens time not null default '09:30',
  closes time not null default '18:30',
  is_closed boolean not null default false,
  unique (profile_id, isodow)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'blocked')),
  source text not null default 'manual' check (source in ('manual', 'online', 'invitation', 'block')),
  notes text,
  client_name text,
  client_phone text,
  service_name text,
  duration_min integer,
  price_cents integer,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

do $$
begin
  alter table public.appointments
    add constraint appointments_no_overlap
    exclude using gist (
      profile_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    )
    where (status <> 'cancelled');
exception
  when duplicate_object then null;
end $$;

create index if not exists appointments_profile_starts_idx
  on public.appointments (profile_id, starts_at);

create index if not exists clients_profile_name_idx
  on public.clients (profile_id, full_name);

create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  service_id uuid references public.services (id) on delete set null,
  slots timestamptz[] not null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  consumed_at timestamptz,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default now(),
  check (coalesce(array_length(slots, 1), 0) between 1 and 12)
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete cascade,
  kind text not null check (kind in ('confirmation', 'reminder')),
  to_email text,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'skipped')),
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists email_outbox_pending_idx
  on public.email_outbox (scheduled_for)
  where status = 'pending';

create table if not exists public.google_calendar_connections (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'not_connected' check (status in ('not_connected', 'pending', 'connected', 'error')),
  calendar_id text,
  sync_token text,
  refresh_token text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Slug
-- ---------------------------------------------------------------------------

create or replace function public.guard_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slugify(new.slug);
  if public.slug_is_reserved(new.slug) or new.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(new.slug) < 3 then
    raise exception 'Cette adresse de page est réservée ou invalide';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_slug on public.profiles;
create trigger profiles_guard_slug
  before insert or update of slug on public.profiles
  for each row execute function public.guard_slug();

-- ---------------------------------------------------------------------------
-- Inscription : le profil, les prestations et les horaires naissent avec le compte
-- ---------------------------------------------------------------------------

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
  svc jsonb;
  hour jsonb;
  i int := 0;
  inserted int := 0;
begin
  v_slug := public.unique_slug(v_name || '-' || v_city);

  insert into public.profiles (id, full_name, profession, city, phone, slug)
  values (new.id, v_name, v_profession, v_city, v_phone, v_slug);

  if jsonb_typeof(meta->'services') = 'array' then
    for svc in select value from jsonb_array_elements(meta->'services')
    loop
      if nullif(trim(svc->>'name'), '') is null then
        continue;
      end if;
      insert into public.services (profile_id, name, duration_min, price_cents, description, sort_order)
      values (
        new.id,
        trim(svc->>'name'),
        least(greatest(coalesce(nullif(svc->>'duration_min', '')::int, 60), 5), 480),
        least(greatest(coalesce(nullif(svc->>'price_cents', '')::int, 0), 0), 1000000),
        nullif(trim(svc->>'description'), ''),
        i
      );
      i := i + 1;
      inserted := inserted + 1;
    end loop;
  end if;

  if inserted = 0 then
    insert into public.services (profile_id, name, duration_min, price_cents, description, sort_order)
    values
      (new.id, 'Pose complète', 120, 6500, 'Gainage ou capsule, selon le modèle.', 0),
      (new.id, 'Remplissage', 75, 4500, 'Entretien de la pose.', 1),
      (new.id, 'Dépose', 30, 1500, 'Retrait soigné.', 2);
  end if;

  if jsonb_typeof(meta->'hours') = 'array' and jsonb_array_length(meta->'hours') > 0 then
    for hour in select value from jsonb_array_elements(meta->'hours')
    loop
      if coalesce(hour->>'isodow', '') !~ '^[1-7]$' then
        continue;
      end if;
      insert into public.opening_hours (profile_id, isodow, opens, closes, is_closed)
      values (
        new.id,
        (hour->>'isodow')::int,
        coalesce(nullif(hour->>'opens', '')::time, time '09:30'),
        coalesce(nullif(hour->>'closes', '')::time, time '18:30'),
        coalesce(hour->>'is_closed', 'false') in ('true', 't', '1')
      )
      on conflict (profile_id, isodow) do update
        set opens = excluded.opens,
            closes = excluded.closes,
            is_closed = excluded.is_closed;
    end loop;
  end if;

  if not exists (select 1 from public.opening_hours where profile_id = new.id) then
    insert into public.opening_hours (profile_id, isodow, opens, closes, is_closed)
    values
      (new.id, 1, '09:30', '18:30', true),
      (new.id, 2, '09:30', '18:30', false),
      (new.id, 3, '09:30', '18:30', false),
      (new.id, 4, '09:30', '18:30', false),
      (new.id, 5, '09:30', '18:30', false),
      (new.id, 6, '09:30', '16:00', false),
      (new.id, 7, '09:30', '13:00', true);
  end if;

  insert into public.google_calendar_connections (profile_id, status)
  values (new.id, 'not_connected')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- File d'e-mails (structure : rien n'est envoyé tant que le cron n'est pas branché)
-- ---------------------------------------------------------------------------

create or replace function public.enqueue_appointment_emails()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text;
  v_phone text;
  v_name text;
  v_reminder int;
  v_payload jsonb;
  v_status text;
  v_error text;
begin
  if new.status <> 'confirmed' or new.source = 'block' or new.client_id is null then
    return new;
  end if;

  select c.email, c.phone, c.full_name
    into v_email, v_phone, v_name
  from public.clients c
  where c.id = new.client_id;

  select reminder_hours into v_reminder from public.profiles where id = new.profile_id;
  v_reminder := coalesce(v_reminder, 24);

  v_payload := jsonb_build_object(
    'client_name', coalesce(v_name, new.client_name),
    'client_phone', coalesce(v_phone, new.client_phone),
    'service_name', new.service_name,
    'starts_at', new.starts_at,
    'ends_at', new.ends_at,
    'price_cents', new.price_cents
  );

  if nullif(trim(coalesce(v_email, '')), '') is null then
    v_status := 'skipped';
    v_error := 'Pas d’adresse e-mail : message conservé dans la file, non envoyé.';
    v_email := null;
  else
    v_status := 'pending';
    v_error := null;
  end if;

  insert into public.email_outbox (profile_id, appointment_id, kind, to_email, payload, scheduled_for, status, last_error)
  values
    (new.profile_id, new.id, 'confirmation', v_email, v_payload || jsonb_build_object('kind', 'confirmation'), now(), v_status, v_error),
    (new.profile_id, new.id, 'reminder', v_email, v_payload || jsonb_build_object('kind', 'reminder'), new.starts_at - make_interval(hours => v_reminder), v_status, v_error);

  return new;
end;
$$;

drop trigger if exists appointments_enqueue_emails on public.appointments;
create trigger appointments_enqueue_emails
  after insert on public.appointments
  for each row execute function public.enqueue_appointment_emails();

-- ---------------------------------------------------------------------------
-- API publique (security definer : la cliente n'a pas de compte)
-- ---------------------------------------------------------------------------

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
      select jsonb_agg(jsonb_build_object('url', ph.url, 'caption', ph.caption) order by ph.sort_order, ph.created_at)
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

create or replace function public.book_public_appointment(
  p_slug text,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_phone text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile public.profiles%rowtype;
  v_service public.services%rowtype;
  v_hour public.opening_hours%rowtype;
  v_ends timestamptz;
  v_local timestamp;
  v_end_local timestamp;
  v_dow int;
  v_client_id uuid;
  v_id uuid;
  v_phone text;
  v_name text;
begin
  v_name := trim(coalesce(p_client_name, ''));
  v_phone := public.phone_digits(p_client_phone);
  if length(v_name) < 2 then
    raise exception 'Indiquez votre nom';
  end if;
  if length(v_phone) < 8 then
    raise exception 'Indiquez un téléphone valide';
  end if;

  select * into v_profile from public.profiles where slug = p_slug;
  if not found then
    raise exception 'Page introuvable';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and profile_id = v_profile.id and active;
  if not found then
    raise exception 'Prestation introuvable';
  end if;

  if p_starts_at < now() + make_interval(mins => v_profile.min_notice_minutes) then
    raise exception 'Ce créneau est trop proche. Choisissez un horaire plus tard.';
  end if;
  if p_starts_at > now() + interval '90 days' then
    raise exception 'Ce créneau est trop éloigné.';
  end if;

  v_ends := p_starts_at + make_interval(mins => v_service.duration_min);
  v_local := timezone(v_profile.timezone, p_starts_at);
  v_end_local := timezone(v_profile.timezone, v_ends);
  v_dow := extract(isodow from v_local)::int;

  if v_local::date <> v_end_local::date then
    raise exception 'Ce créneau dépasse la fermeture.';
  end if;

  select * into v_hour from public.opening_hours
  where profile_id = v_profile.id and isodow = v_dow;
  if not found or v_hour.is_closed
     or v_local::time < v_hour.opens
     or v_end_local::time > v_hour.closes then
    raise exception 'Ce créneau est en dehors des horaires.';
  end if;

  if exists (
    select 1 from public.time_off t
    where t.profile_id = v_profile.id
      and v_local::date between t.starts_on and t.ends_on
  ) then
    raise exception 'La professionnelle est en congé à cette date.';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.profile_id = v_profile.id
      and a.status <> 'cancelled'
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_starts_at, v_ends, '[)')
  ) then
    raise exception 'Ce créneau vient d''être réservé. Choisissez-en un autre.';
  end if;

  select c.id into v_client_id
  from public.clients c
  where c.profile_id = v_profile.id
    and public.phone_digits(c.phone) = v_phone
  limit 1;

  if v_client_id is null then
    insert into public.clients (profile_id, full_name, phone)
    values (v_profile.id, v_name, trim(p_client_phone))
    returning id into v_client_id;
  else
    update public.clients
      set full_name = v_name, phone = trim(p_client_phone)
    where id = v_client_id;
  end if;

  insert into public.appointments (
    profile_id, client_id, service_id, starts_at, ends_at, status, source,
    client_name, client_phone, service_name, duration_min, price_cents
  ) values (
    v_profile.id, v_client_id, v_service.id, p_starts_at, v_ends, 'confirmed', 'online',
    v_name, trim(p_client_phone), v_service.name, v_service.duration_min, v_service.price_cents
  ) returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'starts_at', p_starts_at,
    'ends_at', v_ends,
    'service_name', v_service.name,
    'duration_min', v_service.duration_min,
    'price_cents', v_service.price_cents,
    'pro_name', v_profile.full_name,
    'address', v_profile.address,
    'city', v_profile.city
  );
exception
  when exclusion_violation then
    raise exception 'Ce créneau vient d''être réservé. Choisissez-en un autre.';
end;
$$;

create or replace function public.get_invitation(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_inv public.invitations%rowtype;
  v_profile public.profiles%rowtype;
  v_service public.services%rowtype;
begin
  if coalesce(trim(p_token), '') = '' then
    return null;
  end if;

  select * into v_inv from public.invitations where token = p_token;
  if not found then
    return null;
  end if;

  select * into v_profile from public.profiles where id = v_inv.profile_id;
  select * into v_service from public.services where id = v_inv.service_id;

  return jsonb_build_object(
    'token', v_inv.token,
    'expires_at', v_inv.expires_at,
    'consumed_at', v_inv.consumed_at,
    'slots', to_jsonb(v_inv.slots),
    'pro_name', v_profile.full_name,
    'profession', v_profile.profession,
    'city', v_profile.city,
    'address', v_profile.address,
    'service', case when v_service.id is null then null else jsonb_build_object(
      'id', v_service.id,
      'name', v_service.name,
      'duration_min', v_service.duration_min,
      'price_cents', v_service.price_cents
    ) end
  );
end;
$$;

create or replace function public.accept_invitation(
  p_token text,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_phone text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv public.invitations%rowtype;
  v_profile public.profiles%rowtype;
  v_service public.services%rowtype;
  v_name text;
  v_phone text;
  v_ends timestamptz;
  v_client_id uuid;
  v_id uuid;
  v_duration int;
  v_price int;
  v_service_name text;
begin
  v_name := trim(coalesce(p_client_name, ''));
  v_phone := public.phone_digits(p_client_phone);
  if length(v_name) < 2 then
    raise exception 'Indiquez votre nom';
  end if;
  if length(v_phone) < 8 then
    raise exception 'Indiquez un téléphone valide';
  end if;

  select * into v_inv from public.invitations where token = p_token for update;
  if not found then
    raise exception 'Invitation introuvable';
  end if;
  if v_inv.consumed_at is not null then
    raise exception 'Cette invitation a déjà été utilisée.';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'Cette invitation a expiré.';
  end if;
  if p_starts_at < now() - interval '1 minute' then
    raise exception 'Ce créneau est passé.';
  end if;
  if not exists (
    select 1 from unnest(v_inv.slots) s
    where abs(extract(epoch from (s - p_starts_at))) < 60
  ) then
    raise exception 'Ce créneau ne fait pas partie de l''invitation.';
  end if;

  select * into v_profile from public.profiles where id = v_inv.profile_id;
  select * into v_service from public.services where id = v_inv.service_id;
  v_duration := coalesce(v_service.duration_min, 60);
  v_price := coalesce(v_service.price_cents, 0);
  v_service_name := coalesce(v_service.name, 'Rendez-vous');
  v_ends := p_starts_at + make_interval(mins => v_duration);

  if exists (
    select 1 from public.appointments a
    where a.profile_id = v_profile.id
      and a.status <> 'cancelled'
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_starts_at, v_ends, '[)')
  ) then
    raise exception 'Ce créneau n''est plus libre.';
  end if;

  select c.id into v_client_id
  from public.clients c
  where c.profile_id = v_profile.id and public.phone_digits(c.phone) = v_phone
  limit 1;

  if v_client_id is null then
    insert into public.clients (profile_id, full_name, phone)
    values (v_profile.id, v_name, trim(p_client_phone))
    returning id into v_client_id;
  else
    update public.clients set full_name = v_name, phone = trim(p_client_phone) where id = v_client_id;
  end if;

  insert into public.appointments (
    profile_id, client_id, service_id, starts_at, ends_at, status, source,
    client_name, client_phone, service_name, duration_min, price_cents
  ) values (
    v_profile.id, v_client_id, v_service.id, p_starts_at, v_ends, 'confirmed', 'invitation',
    v_name, trim(p_client_phone), v_service_name, v_duration, v_price
  ) returning id into v_id;

  update public.invitations
    set consumed_at = now(), appointment_id = v_id
  where id = v_inv.id;

  return jsonb_build_object(
    'id', v_id,
    'starts_at', p_starts_at,
    'ends_at', v_ends,
    'service_name', v_service_name,
    'duration_min', v_duration,
    'price_cents', v_price,
    'pro_name', v_profile.full_name,
    'address', v_profile.address,
    'city', v_profile.city
  );
exception
  when exclusion_violation then
    raise exception 'Ce créneau n''est plus libre.';
end;
$$;

create or replace function public.get_ical_events(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if coalesce(trim(p_token), '') = '' then
    return null;
  end if;
  select * into v_profile from public.profiles where ical_token = p_token;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'full_name', v_profile.full_name,
    'timezone', v_profile.timezone,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'uid', a.id,
        'starts_at', a.starts_at,
        'ends_at', a.ends_at,
        'summary', case
          when a.status = 'blocked' then coalesce(nullif(a.service_name, ''), nullif(a.notes, ''), 'Indisponible')
          else trim(both ' ·' from concat_ws(' · ', a.client_name, a.service_name))
        end,
        'description', concat_ws(E'\n', a.client_phone, a.notes)
      ) order by a.starts_at)
      from public.appointments a
      where a.profile_id = v_profile.id
        and a.status <> 'cancelled'
        and a.starts_at > now() - interval '30 days'
        and a.starts_at < now() + interval '180 days'
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Données de démonstration
-- ---------------------------------------------------------------------------

create or replace function public.seed_demo_for_profile(p_profile uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_today date := (timezone('Europe/Paris', now()))::date;
  v_refill int;
  v_pose uuid;
  v_fill uuid;
  v_remove uuid;
  v_camille uuid;
  v_lea uuid;
  v_ines uuid;
  v_chloe uuid;
  v_nadia uuid;
begin
  if not exists (select 1 from public.profiles where id = p_profile) then
    raise exception 'Profil introuvable';
  end if;

  select refill_weeks into v_refill from public.profiles where id = p_profile;

  delete from public.appointments
  where profile_id = p_profile and notes = 'Créneau de démonstration';
  delete from public.clients
  where profile_id = p_profile and notes = 'Fiche de démonstration';

  select id into v_pose from public.services
  where profile_id = p_profile and name = 'Pose complète' order by created_at limit 1;
  if v_pose is null then
    insert into public.services (profile_id, name, duration_min, price_cents, description, sort_order)
    values (p_profile, 'Pose complète', 120, 6500, 'Gainage ou capsule, selon le modèle.', 0)
    returning id into v_pose;
  end if;

  select id into v_fill from public.services
  where profile_id = p_profile and name = 'Remplissage' order by created_at limit 1;
  if v_fill is null then
    insert into public.services (profile_id, name, duration_min, price_cents, description, sort_order)
    values (p_profile, 'Remplissage', 75, 4500, 'Entretien de la pose.', 1)
    returning id into v_fill;
  end if;

  select id into v_remove from public.services
  where profile_id = p_profile and name = 'Dépose' order by created_at limit 1;
  if v_remove is null then
    insert into public.services (profile_id, name, duration_min, price_cents, description, sort_order)
    values (p_profile, 'Dépose', 30, 1500, 'Retrait soigné.', 2)
    returning id into v_remove;
  end if;

  insert into public.clients (profile_id, full_name, phone, notes)
  values (p_profile, 'Camille Durand', '06 12 34 56 78', 'Fiche de démonstration')
  returning id into v_camille;
  insert into public.clients (profile_id, full_name, phone, notes)
  values (p_profile, 'Léa Martin', '06 45 98 12 33', 'Fiche de démonstration')
  returning id into v_lea;
  insert into public.clients (profile_id, full_name, phone, notes)
  values (p_profile, 'Inès Robert', '07 66 30 21 84', 'Fiche de démonstration')
  returning id into v_ines;
  insert into public.clients (profile_id, full_name, phone, notes)
  values (p_profile, 'Chloé Petit', '06 30 77 85 02', 'Fiche de démonstration')
  returning id into v_chloe;
  insert into public.clients (profile_id, full_name, phone, notes)
  values (p_profile, 'Nadia Benali', '06 72 14 63 90', 'Fiche de démonstration')
  returning id into v_nadia;

  insert into public.appointments (
    profile_id, client_id, service_id, starts_at, ends_at, status, source,
    client_name, client_phone, service_name, duration_min, price_cents, notes
  ) values
    (p_profile, v_camille, v_pose,
      public.paris_at(v_today, time '09:30'), public.paris_at(v_today, time '11:30'),
      'confirmed', 'manual', 'Camille Durand', '06 12 34 56 78', 'Pose complète', 120, 6500,
      'Créneau de démonstration'),
    (p_profile, null, null,
      public.paris_at(v_today, time '12:30'), public.paris_at(v_today, time '13:30'),
      'blocked', 'block', null, null, 'Pause déjeuner', 60, 0,
      'Créneau de démonstration'),
    (p_profile, v_lea, v_fill,
      public.paris_at(v_today, time '14:00'), public.paris_at(v_today, time '15:15'),
      'confirmed', 'online', 'Léa Martin', '06 45 98 12 33', 'Remplissage', 75, 4500,
      'Créneau de démonstration'),
    (p_profile, v_ines, v_remove,
      public.paris_at(v_today, time '16:30'), public.paris_at(v_today, time '17:00'),
      'confirmed', 'manual', 'Inès Robert', '07 66 30 21 84', 'Dépose', 30, 1500,
      'Créneau de démonstration'),
    (p_profile, v_chloe, v_pose,
      public.paris_at(v_today - (v_refill * 7), time '11:00'),
      public.paris_at(v_today - (v_refill * 7), time '13:00'),
      'confirmed', 'manual', 'Chloé Petit', '06 30 77 85 02', 'Pose complète', 120, 6500,
      'Créneau de démonstration'),
    (p_profile, v_nadia, v_fill,
      public.paris_at(v_today + 1, time '10:00'), public.paris_at(v_today + 1, time '11:15'),
      'confirmed', 'invitation', 'Nadia Benali', '06 72 14 63 90', 'Remplissage', 75, 4500,
      'Créneau de démonstration');
end;
$$;

create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Connectez-vous pour charger l''exemple.';
  end if;
  perform public.seed_demo_for_profile(auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.opening_hours enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.time_off enable row level security;
alter table public.invitations enable row level security;
alter table public.photos enable row level security;
alter table public.email_outbox enable row level security;
alter table public.google_calendar_connections enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists services_own on public.services;
create policy services_own on public.services
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists hours_own on public.opening_hours;
create policy hours_own on public.opening_hours
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists clients_own on public.clients;
create policy clients_own on public.clients
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists appointments_own on public.appointments;
create policy appointments_own on public.appointments
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists time_off_own on public.time_off;
create policy time_off_own on public.time_off
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists invitations_own on public.invitations;
create policy invitations_own on public.invitations
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists photos_own on public.photos;
create policy photos_own on public.photos
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists email_outbox_own on public.email_outbox;
create policy email_outbox_own on public.email_outbox
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists google_own on public.google_calendar_connections;
create policy google_own on public.google_calendar_connections
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Droits des fonctions (PostgREST expose le schéma public)
-- ---------------------------------------------------------------------------

revoke all on function public.slugify(text) from public, anon, authenticated;
revoke all on function public.slug_is_reserved(text) from public, anon, authenticated;
revoke all on function public.unique_slug(text) from public, anon, authenticated;
revoke all on function public.phone_digits(text) from public, anon, authenticated;
revoke all on function public.paris_at(date, time) from public, anon, authenticated;
revoke all on function public.guard_slug() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.enqueue_appointment_emails() from public, anon, authenticated;
revoke all on function public.seed_demo_for_profile(uuid) from public, anon, authenticated;

revoke all on function public.get_booking_context(text, timestamptz, timestamptz) from public;
grant execute on function public.get_booking_context(text, timestamptz, timestamptz) to anon, authenticated;

revoke all on function public.book_public_appointment(text, uuid, timestamptz, text, text) from public;
grant execute on function public.book_public_appointment(text, uuid, timestamptz, text, text) to anon, authenticated;

revoke all on function public.get_invitation(text) from public;
grant execute on function public.get_invitation(text) to anon, authenticated;

revoke all on function public.accept_invitation(text, timestamptz, text, text) from public;
grant execute on function public.accept_invitation(text, timestamptz, text, text) to anon, authenticated;

revoke all on function public.get_ical_events(text) from public;
grant execute on function public.get_ical_events(text) to anon, authenticated;

revoke all on function public.seed_demo_data() from public, anon;
grant execute on function public.seed_demo_data() to authenticated;

grant execute on function public.seed_demo_for_profile(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Photos : bucket public vitrine/<user-id>/fichier
-- ---------------------------------------------------------------------------

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'vitrine',
    'vitrine',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  on conflict (id) do nothing;

  drop policy if exists vitrine_public_read on storage.objects;
  create policy vitrine_public_read on storage.objects
    for select to public
    using (bucket_id = 'vitrine');

  drop policy if exists vitrine_owner_insert on storage.objects;
  create policy vitrine_owner_insert on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'vitrine'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  drop policy if exists vitrine_owner_delete on storage.objects;
  create policy vitrine_owner_delete on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'vitrine'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception
  when others then
    raise notice 'Stockage photos non configuré (%) — vous pouvez quand même coller des URLs d''images.', sqlerrm;
end $$;
