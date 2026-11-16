-- Connexion Google Agenda (synchro dans les deux sens). Dormante tant que GOOGLE_CLIENT_ID /
-- GOOGLE_CLIENT_SECRET ne sont pas posés sur le worker : rien n'est mis en file sans compte connecté.
--
-- * private.google_accounts : jeton de rafraîchissement chiffré (AES-GCM, clé GOOGLE_TOKEN_KEY côté
--   worker). Schéma private non exposé par l'API : jamais lisible par anon/authenticated.
-- * private.google_event_queue / google_event_links : Sheensy -> Google (un événement par rendez-vous),
--   alimentés par trigger, vidés par le Cron Trigger du worker (5 tentatives max).
-- * public.google_busy : créneaux occupés importés de Google (début/fin uniquement, aucun détail).
--   Ils bloquent la réservation en ligne et les invitations (trigger guard_google_busy).
-- * Les fonctions du worker sont protégées par le même secret que la file d'e-mails
--   (private.email_queue_authorized / EMAIL_QUEUE_SECRET).
-- Aucune donnée existante n'est modifiée (les colonnes supprimées étaient vides).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.google_accounts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  google_email text,
  refresh_token_enc text not null,
  scopes text,
  revoked boolean not null default false,
  connected_at timestamptz not null default now(),
  busy_synced_at timestamptz,
  busy_requested_at timestamptz,
  busy_claimed_at timestamptz,
  busy_error text
);
revoke all on private.google_accounts from public, anon, authenticated;

-- Pas de clé étrangère : la ligne doit survivre à la suppression du rendez-vous pour effacer l'événement.
create table if not exists private.google_event_links (
  appointment_id uuid primary key,
  profile_id uuid not null,
  google_event_id text not null,
  updated_at timestamptz not null default now()
);
create index if not exists google_event_links_profile_idx on private.google_event_links (profile_id);
revoke all on private.google_event_links from public, anon, authenticated;

create table if not exists private.google_event_queue (
  appointment_id uuid primary key,
  profile_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'done', 'failed')),
  version integer not null default 1,
  attempts integer not null default 0,
  scheduled_for timestamptz not null default now(),
  claimed_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
create index if not exists google_event_queue_pending_idx
  on private.google_event_queue (scheduled_for) where status = 'pending';
create index if not exists google_event_queue_profile_idx on private.google_event_queue (profile_id);
revoke all on private.google_event_queue from public, anon, authenticated;

create table if not exists public.google_busy (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (ends_at > starts_at)
);
create index if not exists google_busy_profile_starts_idx on public.google_busy (profile_id, starts_at);
alter table public.google_busy enable row level security;
revoke all on public.google_busy from public, anon, authenticated;
grant select on public.google_busy to authenticated;
drop policy if exists google_busy_own on public.google_busy;
create policy google_busy_own on public.google_busy
  for select to authenticated
  using (profile_id = auth.uid());

-- Statut visible par la pro : aucun secret, lecture seule (les écritures passent par les fonctions).
alter table public.google_calendar_connections add column if not exists google_email text;
alter table public.google_calendar_connections add column if not exists connected_at timestamptz;
alter table public.google_calendar_connections drop column if exists refresh_token;
alter table public.google_calendar_connections drop column if exists sync_token;
revoke insert, update, delete, truncate, references, trigger on public.google_calendar_connections from anon, authenticated;
revoke all on public.google_calendar_connections from anon;
drop policy if exists google_own on public.google_calendar_connections;
create policy google_own on public.google_calendar_connections
  for select to authenticated
  using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Sheensy -> Google : file d'événements
-- ---------------------------------------------------------------------------

create or replace function public.enqueue_google_event()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_profile uuid;
begin
  if tg_op = 'DELETE' then
    v_id := old.id;
    v_profile := old.profile_id;
  else
    v_id := new.id;
    v_profile := new.profile_id;
    if tg_op = 'UPDATE' and
      (new.starts_at, new.ends_at, new.status, new.client_id, new.service_id, new.client_name,
       new.client_phone, new.service_name, new.notes)
      is not distinct from
      (old.starts_at, old.ends_at, old.status, old.client_id, old.service_id, old.client_name,
       old.client_phone, old.service_name, old.notes) then
      return null;
    end if;
  end if;

  if not exists (select 1 from private.google_accounts g where g.profile_id = v_profile and not g.revoked) then
    return null;
  end if;

  insert into private.google_event_queue as q (appointment_id, profile_id)
  values (v_id, v_profile)
  on conflict (appointment_id) do update
    set status = 'pending', version = q.version + 1, attempts = 0,
        scheduled_for = now(), last_error = null, updated_at = now();
  return null;
end;
$$;

drop trigger if exists appointments_google_sync on public.appointments;
create trigger appointments_google_sync
  after insert or update or delete on public.appointments
  for each row execute function public.enqueue_google_event();

-- Les créneaux occupés dans Google bloquent la réservation en ligne et les invitations
-- (la pro garde la main sur ses propres rendez-vous et blocages).
create or replace function public.guard_google_busy()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.source in ('online', 'invitation') and new.status <> 'cancelled' and exists (
    select 1 from public.google_busy b
    where b.profile_id = new.profile_id
      and b.starts_at < new.ends_at
      and b.ends_at > new.starts_at
  ) then
    raise exception 'Ce créneau n''est plus libre.';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_guard_google_busy on public.appointments;
create trigger appointments_guard_google_busy
  before insert on public.appointments
  for each row execute function public.guard_google_busy();

create or replace function public.google_event_claim(p_secret text, p_limit integer default 20)
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

  -- Worker interrompu : on remet en file (l'identifiant d'événement est déterministe, pas de doublon).
  update private.google_event_queue
    set status = 'pending'
  where status = 'sending' and claimed_at < now() - interval '15 minutes';

  with picked as (
    select q.appointment_id
    from private.google_event_queue q
    join private.google_accounts g on g.profile_id = q.profile_id and not g.revoked
    where q.status = 'pending' and q.scheduled_for <= now()
    order by q.scheduled_for
    limit greatest(1, least(coalesce(p_limit, 20), 50))
    for update of q skip locked
  ),
  claimed as (
    update private.google_event_queue q
      set status = 'sending', claimed_at = now(), attempts = q.attempts + 1, updated_at = now()
    from picked
    where q.appointment_id = picked.appointment_id
    returning q.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'appointment_id', c.appointment_id,
    'profile_id', c.profile_id,
    'version', c.version,
    'refresh_token_enc', g.refresh_token_enc,
    'google_event_id', l.google_event_id,
    'timezone', p.timezone,
    'salon_name', p.full_name,
    'address', p.address,
    'appointment', case when a.id is null then null else jsonb_build_object(
      'status', a.status,
      'source', a.source,
      'starts_at', a.starts_at,
      'ends_at', a.ends_at,
      'service_name', coalesce(nullif(trim(a.service_name), ''), s.name),
      'client_name', nullif(trim(coalesce(nullif(a.client_name, ''), cl.full_name, '')), ''),
      'client_phone', nullif(trim(coalesce(nullif(a.client_phone, ''), cl.phone, '')), ''),
      'notes', nullif(trim(coalesce(a.notes, '')), '')
    ) end
  )), '[]'::jsonb)
  into result
  from claimed c
  join private.google_accounts g on g.profile_id = c.profile_id
  join public.profiles p on p.id = c.profile_id
  left join private.google_event_links l on l.appointment_id = c.appointment_id
  left join public.appointments a on a.id = c.appointment_id and a.profile_id = c.profile_id
  left join public.services s on s.id = a.service_id
  left join public.clients cl on cl.id = a.client_id;

  return result;
end;
$$;

create or replace function public.google_event_complete(
  p_secret text,
  p_appointment_id uuid,
  p_version integer,
  p_ok boolean,
  p_google_event_id text default null,
  p_error text default null,
  p_permanent boolean default false,
  p_revoked boolean default false
) returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_profile uuid;
  v_status text;
begin
  if not private.email_queue_authorized(p_secret) then
    raise exception 'Non autorisé' using errcode = '42501';
  end if;

  select profile_id into v_profile from private.google_event_queue where appointment_id = p_appointment_id;
  if not found then
    return null;
  end if;

  if p_ok then
    if p_google_event_id is null then
      delete from private.google_event_links where appointment_id = p_appointment_id;
    else
      insert into private.google_event_links (appointment_id, profile_id, google_event_id)
      values (p_appointment_id, v_profile, left(p_google_event_id, 1024))
      on conflict (appointment_id) do update
        set google_event_id = excluded.google_event_id, updated_at = now();
    end if;
    update private.google_event_queue
      set status = 'done', last_error = null, updated_at = now()
    where appointment_id = p_appointment_id and status = 'sending' and version = p_version
    returning status into v_status;
  else
    update private.google_event_queue
      set status = case when p_permanent or attempts >= 5 then 'failed' else 'pending' end,
          scheduled_for = case when p_permanent or attempts >= 5 then scheduled_for
                               else now() + make_interval(mins => 5 * attempts * attempts) end,
          last_error = left(coalesce(p_error, 'Erreur inconnue'), 500),
          updated_at = now()
    where appointment_id = p_appointment_id and status = 'sending' and version = p_version
    returning status into v_status;
    if p_revoked then
      perform private.google_mark_revoked(v_profile);
    end if;
  end if;
  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Google -> Sheensy : créneaux occupés (freeBusy)
-- ---------------------------------------------------------------------------

create or replace function private.google_mark_revoked(p_profile_id uuid)
returns void
language sql
volatile
security definer
set search_path = public, extensions
as $$
  update private.google_accounts set revoked = true where profile_id = p_profile_id;
  delete from public.google_busy where profile_id = p_profile_id;
  update public.google_calendar_connections
    set status = 'error', last_error = 'Google a retiré l’accès. Reconnectez votre compte.'
  where profile_id = p_profile_id;
$$;
revoke all on function private.google_mark_revoked(uuid) from public, anon, authenticated;

-- Comptes à rafraîchir : toutes les 10 min, ou tout de suite si la pro l'a demandé.
create or replace function public.google_busy_claim(
  p_secret text,
  p_limit integer default 10,
  p_profile_id uuid default null
) returns jsonb
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

  with picked as (
    select g.profile_id
    from private.google_accounts g
    where not g.revoked
      and (g.busy_claimed_at is null or g.busy_claimed_at < now() - interval '2 minutes')
      and (
        (p_profile_id is not null and g.profile_id = p_profile_id)
        or (p_profile_id is null and (
          g.busy_synced_at is null
          or g.busy_synced_at < now() - interval '10 minutes'
          or (g.busy_requested_at is not null and g.busy_requested_at > g.busy_synced_at)
        ))
      )
    order by g.busy_synced_at nulls first
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    for update of g skip locked
  ),
  claimed as (
    update private.google_accounts g
      set busy_claimed_at = now()
    from picked
    where g.profile_id = picked.profile_id
    returning g.profile_id, g.refresh_token_enc
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'profile_id', c.profile_id,
    'refresh_token_enc', c.refresh_token_enc
  )), '[]'::jsonb)
  into result
  from claimed c;

  return result;
end;
$$;

create or replace function public.google_busy_store(
  p_secret text,
  p_profile_id uuid,
  p_busy jsonb default '[]'::jsonb,
  p_error text default null,
  p_revoked boolean default false
) returns integer
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_count integer := 0;
begin
  if not private.email_queue_authorized(p_secret) then
    raise exception 'Non autorisé' using errcode = '42501';
  end if;
  if not exists (select 1 from private.google_accounts where profile_id = p_profile_id) then
    return 0;
  end if;

  if p_error is not null then
    update private.google_accounts
      set busy_synced_at = now(), busy_claimed_at = null, busy_error = left(p_error, 500)
    where profile_id = p_profile_id;
    if p_revoked then
      perform private.google_mark_revoked(p_profile_id);
    end if;
    return 0;
  end if;

  delete from public.google_busy where profile_id = p_profile_id;
  insert into public.google_busy (profile_id, starts_at, ends_at)
  select p_profile_id, (e->>'start')::timestamptz, (e->>'end')::timestamptz
  from jsonb_array_elements(case when jsonb_typeof(p_busy) = 'array' then p_busy else '[]'::jsonb end) as e
  where (e->>'end')::timestamptz > (e->>'start')::timestamptz
  limit 3000;
  get diagnostics v_count = row_count;

  update private.google_accounts
    set busy_synced_at = now(), busy_claimed_at = null, busy_error = null
  where profile_id = p_profile_id;
  update public.google_calendar_connections
    set status = 'connected', last_synced_at = now(), last_error = null
  where profile_id = p_profile_id;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Connexion / déconnexion (appelées par les routes du worker, après vérification de la session)
-- ---------------------------------------------------------------------------

create or replace function public.google_account_save(
  p_secret text,
  p_profile_id uuid,
  p_email text,
  p_refresh_token_enc text,
  p_scopes text
) returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not private.email_queue_authorized(p_secret) then
    raise exception 'Non autorisé' using errcode = '42501';
  end if;
  if coalesce(p_refresh_token_enc, '') = '' then
    raise exception 'Jeton Google manquant.';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile_id) then
    raise exception 'Profil introuvable.';
  end if;

  insert into private.google_accounts as g (profile_id, google_email, refresh_token_enc, scopes, busy_requested_at)
  values (p_profile_id, nullif(trim(p_email), ''), p_refresh_token_enc, p_scopes, now())
  on conflict (profile_id) do update
    set google_email = excluded.google_email,
        refresh_token_enc = excluded.refresh_token_enc,
        scopes = excluded.scopes,
        revoked = false,
        connected_at = now(),
        busy_synced_at = null,
        busy_claimed_at = null,
        busy_requested_at = now(),
        busy_error = null;

  insert into public.google_calendar_connections as c (profile_id, status, calendar_id, google_email, connected_at)
  values (p_profile_id, 'connected', 'primary', nullif(trim(p_email), ''), now())
  on conflict (profile_id) do update
    set status = 'connected', calendar_id = 'primary', google_email = excluded.google_email,
        connected_at = now(), last_error = null;

  -- Rendez-vous à venir : envoyés dans Google au prochain passage du cron.
  insert into private.google_event_queue as q (appointment_id, profile_id)
  select a.id, a.profile_id
  from public.appointments a
  where a.profile_id = p_profile_id
    and a.status = 'confirmed'
    and a.ends_at > now() - interval '1 day'
    and a.starts_at < now() + interval '12 months'
  on conflict (appointment_id) do update
    set status = 'pending', version = q.version + 1, attempts = 0,
        scheduled_for = now(), last_error = null, updated_at = now();
end;
$$;

-- Supprime toutes les données Google de la pro et renvoie le jeton chiffré (pour la révocation).
create or replace function public.google_account_delete(p_secret text, p_profile_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  if not private.email_queue_authorized(p_secret) then
    raise exception 'Non autorisé' using errcode = '42501';
  end if;

  delete from private.google_accounts where profile_id = p_profile_id returning refresh_token_enc into v_token;
  delete from private.google_event_queue where profile_id = p_profile_id;
  delete from private.google_event_links where profile_id = p_profile_id;
  delete from public.google_busy where profile_id = p_profile_id;
  update public.google_calendar_connections
    set status = 'not_connected', google_email = null, connected_at = null, calendar_id = null,
        last_synced_at = null, last_error = null
  where profile_id = p_profile_id;
  return v_token;
end;
$$;

-- La pro demande une actualisation de ses absences Google.
create or replace function public.google_request_busy_sync()
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
  update private.google_accounts set busy_requested_at = now() where profile_id = auth.uid();
end;
$$;

-- Créneaux occupés Google d'une vitrine (début/fin uniquement), pour la grille de réservation.
create or replace function public.get_google_busy(p_slug text, p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_profile uuid;
begin
  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > interval '62 days' then
    return '[]'::jsonb;
  end if;
  select id into v_profile from public.profiles where slug = p_slug;
  if not found then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('starts_at', b.starts_at, 'ends_at', b.ends_at) order by b.starts_at)
    from public.google_busy b
    where b.profile_id = v_profile and b.starts_at < p_to and b.ends_at > p_from
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.enqueue_google_event() from public, anon, authenticated;
revoke all on function public.guard_google_busy() from public, anon, authenticated;

revoke all on function public.google_event_claim(text, integer) from public;
grant execute on function public.google_event_claim(text, integer) to anon, authenticated;
revoke all on function public.google_event_complete(text, uuid, integer, boolean, text, text, boolean, boolean) from public;
grant execute on function public.google_event_complete(text, uuid, integer, boolean, text, text, boolean, boolean) to anon, authenticated;
revoke all on function public.google_busy_claim(text, integer, uuid) from public;
grant execute on function public.google_busy_claim(text, integer, uuid) to anon, authenticated;
revoke all on function public.google_busy_store(text, uuid, jsonb, text, boolean) from public;
grant execute on function public.google_busy_store(text, uuid, jsonb, text, boolean) to anon, authenticated;
revoke all on function public.google_account_save(text, uuid, text, text, text) from public;
grant execute on function public.google_account_save(text, uuid, text, text, text) to anon, authenticated;
revoke all on function public.google_account_delete(text, uuid) from public;
grant execute on function public.google_account_delete(text, uuid) to anon, authenticated;

revoke all on function public.google_request_busy_sync() from public, anon;
grant execute on function public.google_request_busy_sync() to authenticated;

revoke all on function public.get_google_busy(text, timestamptz, timestamptz) from public;
grant execute on function public.get_google_busy(text, timestamptz, timestamptz) to anon, authenticated;
