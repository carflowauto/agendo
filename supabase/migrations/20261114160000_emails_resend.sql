-- E-mails transactionnels Sheensy (Resend).
-- * email_outbox : statuts sending/failed, tentatives, suivi d'envoi, nouveau type pro_new_booking.
-- * Trigger : confirmation + rappel pour la cliente (si e-mail), notification à la pro (réservation en ligne / invitation).
-- * Réservation publique et invitation : e-mail cliente facultatif.
-- * File : email_queue_claim / email_queue_complete, protégées par un secret (hash dans private.email_queue_config).
-- Aucune donnée existante n'est modifiée par ce script.

alter table public.email_outbox drop constraint if exists email_outbox_kind_check;
alter table public.email_outbox add constraint email_outbox_kind_check
  check (kind in ('confirmation', 'reminder', 'pro_new_booking'));
alter table public.email_outbox drop constraint if exists email_outbox_status_check;
alter table public.email_outbox add constraint email_outbox_status_check
  check (status in ('pending', 'sending', 'sent', 'skipped', 'failed'));
alter table public.email_outbox add column if not exists attempts integer not null default 0;
alter table public.email_outbox add column if not exists claimed_at timestamptz;
alter table public.email_outbox add column if not exists sent_at timestamptz;
alter table public.email_outbox add column if not exists provider_message_id text;

create unique index if not exists email_outbox_one_per_kind
  on public.email_outbox (appointment_id, kind)
  where appointment_id is not null;

-- Secret de la file : seul son hash SHA-256 est stocké, dans un schéma non exposé par l'API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.email_queue_config (
  id integer primary key default 1 check (id = 1),
  secret_hash bytea not null,
  updated_at timestamptz not null default now()
);
revoke all on private.email_queue_config from public, anon, authenticated;

create or replace function private.email_queue_authorized(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = private, extensions
as $$
  select exists (
    select 1 from private.email_queue_config c
    where c.id = 1
      and coalesce(p_secret, '') <> ''
      and c.secret_hash = extensions.digest(p_secret, 'sha256')
  );
$$;
revoke all on function private.email_queue_authorized(text) from public, anon, authenticated;

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
  v_pro_email text;
  v_payload jsonb;
  v_reminder_at timestamptz;
begin
  if new.status <> 'confirmed' or new.source = 'block' then
    return new;
  end if;

  if new.client_id is not null then
    select c.email, c.phone, c.full_name into v_email, v_phone, v_name
    from public.clients c where c.id = new.client_id;
  end if;

  select reminder_hours into v_reminder from public.profiles where id = new.profile_id;
  v_reminder := coalesce(v_reminder, 24);
  v_reminder_at := new.starts_at - make_interval(hours => v_reminder);

  v_payload := jsonb_build_object(
    'client_name', coalesce(v_name, new.client_name),
    'client_phone', coalesce(v_phone, new.client_phone),
    'service_name', new.service_name,
    'starts_at', new.starts_at,
    'ends_at', new.ends_at,
    'price_cents', new.price_cents,
    'source', new.source
  );
  v_email := nullif(trim(coalesce(v_email, '')), '');

  if new.client_id is not null then
    insert into public.email_outbox (profile_id, appointment_id, kind, to_email, payload, scheduled_for, status, last_error)
    values (
      new.profile_id, new.id, 'confirmation', v_email, v_payload || jsonb_build_object('kind', 'confirmation'), now(),
      case when v_email is null then 'skipped' else 'pending' end,
      case when v_email is null then 'Pas d’adresse e-mail cliente.' end
    )
    on conflict do nothing;

    insert into public.email_outbox (profile_id, appointment_id, kind, to_email, payload, scheduled_for, status, last_error)
    values (
      new.profile_id, new.id, 'reminder', v_email, v_payload || jsonb_build_object('kind', 'reminder'), v_reminder_at,
      case when v_email is null or v_reminder_at <= now() + interval '30 minutes' then 'skipped' else 'pending' end,
      case
        when v_email is null then 'Pas d’adresse e-mail cliente.'
        when v_reminder_at <= now() + interval '30 minutes' then 'Rendez-vous trop proche pour un rappel.'
      end
    )
    on conflict do nothing;
  end if;

  -- Notification à la pro pour chaque réservation faite par une cliente.
  if new.source in ('online', 'invitation') then
    select u.email into v_pro_email from auth.users u where u.id = new.profile_id;
    v_pro_email := nullif(trim(coalesce(v_pro_email, '')), '');
    insert into public.email_outbox (profile_id, appointment_id, kind, to_email, payload, scheduled_for, status, last_error)
    values (
      new.profile_id, new.id, 'pro_new_booking', v_pro_email, v_payload || jsonb_build_object('kind', 'pro_new_booking'), now(),
      case when v_pro_email is null then 'skipped' else 'pending' end,
      case when v_pro_email is null then 'Pas d’adresse e-mail pro.' end
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop function if exists public.book_public_appointment(text, uuid, timestamptz, text, text);
drop function if exists public.accept_invitation(text, timestamptz, text, text);

create or replace function public.book_public_appointment(
  p_slug text,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_phone text,
  p_client_email text default null
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
  v_email text;
begin
  v_name := trim(coalesce(p_client_name, ''));
  v_phone := public.phone_digits(p_client_phone);
  if length(v_name) < 2 then
    raise exception 'Indiquez votre nom';
  end if;
  if length(v_phone) < 8 then
    raise exception 'Indiquez un téléphone valide';
  end if;
  v_email := nullif(lower(trim(coalesce(p_client_email, ''))), '');
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Adresse e-mail invalide';
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
    insert into public.clients (profile_id, full_name, phone, email)
    values (v_profile.id, v_name, trim(p_client_phone), v_email)
    returning id into v_client_id;
  else
    update public.clients
      set full_name = v_name, phone = trim(p_client_phone), email = coalesce(v_email, email)
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

create or replace function public.accept_invitation(
  p_token text,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_phone text,
  p_client_email text default null
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
  v_email text;
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
  v_email := nullif(lower(trim(coalesce(p_client_email, ''))), '');
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Adresse e-mail invalide';
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
    insert into public.clients (profile_id, full_name, phone, email)
    values (v_profile.id, v_name, trim(p_client_phone), v_email)
    returning id into v_client_id;
  else
    update public.clients set full_name = v_name, phone = trim(p_client_phone), email = coalesce(v_email, email) where id = v_client_id;
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

revoke all on function public.book_public_appointment(text, uuid, timestamptz, text, text, text) from public;
grant execute on function public.book_public_appointment(text, uuid, timestamptz, text, text, text) to anon, authenticated;
revoke all on function public.accept_invitation(text, timestamptz, text, text, text) from public;
grant execute on function public.accept_invitation(text, timestamptz, text, text, text) to anon, authenticated;

-- Réserve les messages à envoyer (au plus 50), en les passant en "sending".
create or replace function public.email_queue_claim(p_secret text, p_limit integer default 20)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
begin
  if not private.email_queue_authorized(p_secret) then
    raise exception 'Non autorisé' using errcode = '42501';
  end if;

  -- Lignes restées en "sending" (worker interrompu) : on les remet en file.
  -- L'Idempotency-Key envoyée à Resend empêche un double envoi.
  update public.email_outbox
    set status = 'pending'
  where status = 'sending' and claimed_at < now() - interval '15 minutes';

  -- Rendez-vous annulé, ou rappel d'un rendez-vous déjà commencé : on n'envoie pas.
  update public.email_outbox o
    set status = 'skipped', last_error = 'Rendez-vous annulé ou passé.'
  from public.appointments a
  where o.appointment_id = a.id
    and o.status = 'pending'
    and o.scheduled_for <= now()
    and (a.status <> 'confirmed' or (o.kind = 'reminder' and a.starts_at <= now()));

  -- Rendez-vous déplacé plus tard : on recale le rappel.
  update public.email_outbox o
    set scheduled_for = a.starts_at - make_interval(hours => p.reminder_hours)
  from public.appointments a
  join public.profiles p on p.id = a.profile_id
  where o.appointment_id = a.id
    and o.kind = 'reminder'
    and o.status = 'pending'
    and o.scheduled_for <= now()
    and a.starts_at - make_interval(hours => p.reminder_hours) > now() + interval '5 minutes';

  with picked as (
    select o.id
    from public.email_outbox o
    where o.status = 'pending'
      and o.scheduled_for <= now()
      and o.to_email is not null
      and o.attempts < 5
    order by o.scheduled_for
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
    for update skip locked
  ), claimed as (
    update public.email_outbox o
      set status = 'sending', claimed_at = now(), attempts = o.attempts + 1
    from picked
    where o.id = picked.id
    returning o.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'kind', c.kind,
    'to_email', c.to_email,
    'attempts', c.attempts,
    'salon_name', p.full_name,
    'slug', p.slug,
    'profession', p.profession,
    'address', p.address,
    'city', p.city,
    'pro_phone', p.phone,
    'timezone', p.timezone,
    'pro_email', (select u.email from auth.users u where u.id = p.id),
    'client_name', coalesce(a.client_name, c.payload->>'client_name'),
    'client_phone', coalesce(a.client_phone, c.payload->>'client_phone'),
    'client_email', (select cl.email from public.clients cl where cl.id = a.client_id),
    'service_name', coalesce(a.service_name, c.payload->>'service_name'),
    'starts_at', coalesce(a.starts_at, (c.payload->>'starts_at')::timestamptz),
    'ends_at', coalesce(a.ends_at, (c.payload->>'ends_at')::timestamptz),
    'price_cents', coalesce(a.price_cents, (c.payload->>'price_cents')::integer),
    'source', coalesce(a.source, c.payload->>'source')
  )), '[]'::jsonb)
  into result
  from claimed c
  join public.profiles p on p.id = c.profile_id
  left join public.appointments a on a.id = c.appointment_id;

  return result;
end;
$$;

-- Marque un message envoyé, ou le remet en file avec un délai (5 tentatives max).
create or replace function public.email_queue_complete(
  p_secret text,
  p_id uuid,
  p_ok boolean,
  p_error text default null,
  p_message_id text default null,
  p_permanent boolean default false
) returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_status text;
begin
  if not private.email_queue_authorized(p_secret) then
    raise exception 'Non autorisé' using errcode = '42501';
  end if;

  if p_ok then
    update public.email_outbox
      set status = 'sent', sent_at = now(), provider_message_id = p_message_id, last_error = null
    where id = p_id and status = 'sending'
    returning status into v_status;
  else
    update public.email_outbox
      set status = case when p_permanent or attempts >= 5 then 'failed' else 'pending' end,
          scheduled_for = case when p_permanent or attempts >= 5 then scheduled_for
                               else now() + make_interval(mins => 5 * attempts * attempts) end,
          last_error = left(coalesce(p_error, 'Erreur inconnue'), 500)
    where id = p_id and status = 'sending'
    returning status into v_status;
  end if;

  return v_status;
end;
$$;

revoke all on function public.email_queue_claim(text, integer) from public;
grant execute on function public.email_queue_claim(text, integer) to anon, authenticated;
revoke all on function public.email_queue_complete(text, uuid, boolean, text, text, boolean) from public;
grant execute on function public.email_queue_complete(text, uuid, boolean, text, text, boolean) to anon, authenticated;
