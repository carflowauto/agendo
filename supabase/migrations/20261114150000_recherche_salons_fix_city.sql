-- Corrige search_public_salons : la variable « city » entrait en conflit avec la colonne city (erreur 42702),
-- et la catégorie Ongles reconnaît « Prothésiste ongulaire ».
-- Lecture seule, aucune donnée modifiée.

create or replace function public.search_public_salons(
  p_query text default '',
  p_city text default '',
  p_category text default '',
  p_limit integer default 12
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := replace(replace(replace(lower(btrim(coalesce(p_query, ''))), '\', '\\'), '%', '\%'), '_', '\_');
  v_city text := replace(replace(replace(lower(btrim(coalesce(p_city, ''))), '\', '\\'), '%', '\%'), '_', '\_');
  cat text := lower(btrim(coalesce(p_category, '')));
  lim integer := least(greatest(coalesce(p_limit, 12), 1), 24);
  result jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc), '[]'::jsonb)
  into result
  from (
    select
      p.slug,
      p.full_name,
      p.city,
      p.profession,
      p.created_at,
      (
        select ph.url
        from public.photos ph
        where ph.profile_id = p.id
        order by ph.sort_order, ph.created_at
        limit 1
      ) as cover_url
    from public.profiles p
    where p.slug <> ''
      and (
        q = ''
        or lower(p.full_name) like '%' || q || '%' escape '\'
        or lower(coalesce(p.profession, '')) like '%' || q || '%' escape '\'
        or lower(coalesce(p.city, '')) like '%' || q || '%' escape '\'
        or exists (
          select 1 from public.services sv
          where sv.profile_id = p.id
            and sv.active
            and lower(sv.name) like '%' || q || '%' escape '\'
        )
      )
      and (
        v_city = ''
        or lower(coalesce(p.city, '')) like '%' || v_city || '%' escape '\'
      )
      and (
        cat = ''
        or (
          cat = 'ongles' and (
            (lower(p.profession) like '%ongl%' or lower(p.profession) like '%ongul%' or lower(p.profession) like '%nail%')
            or exists (
              select 1 from public.services sv
              where sv.profile_id = p.id and sv.active and (
                lower(sv.name) like '%ongle%' or lower(sv.name) like '%manuc%'
                or lower(sv.name) like '%gel%' or lower(sv.name) like '%semi%'
                or lower(sv.name) like '%nail%'
              )
            )
          )
        )
        or (
          cat = 'coiffure' and (
            lower(p.profession) like '%coiff%'
            or exists (
              select 1 from public.services sv
              where sv.profile_id = p.id and sv.active and (
                lower(sv.name) like '%coupe%' or lower(sv.name) like '%coiff%'
                or lower(sv.name) like '%couleur%' or lower(sv.name) like '%brushing%'
              )
            )
          )
        )
        or (
          cat = 'maquillage' and (
            lower(p.profession) like '%maquill%'
            or exists (
              select 1 from public.services sv
              where sv.profile_id = p.id and sv.active and lower(sv.name) like '%maquill%'
            )
          )
        )
        or (
          cat = 'esthetique' and (
            lower(p.profession) like '%esth%' or lower(p.profession) like '%cil%'
            or exists (
              select 1 from public.services sv
              where sv.profile_id = p.id and sv.active and (
                lower(sv.name) like '%soin%' or lower(sv.name) like '%visage%'
                or lower(sv.name) like '%cil%' or lower(sv.name) like '%esth%'
              )
            )
          )
        )
        or (
          cat = 'injections' and (
            lower(p.profession) like '%inject%'
            or exists (
              select 1 from public.services sv
              where sv.profile_id = p.id and sv.active and lower(sv.name) like '%inject%'
            )
          )
        )
      )
    order by p.created_at desc
    limit lim
  ) s;

  return (
    select coalesce(jsonb_agg((item - 'created_at') order by item->>'created_at' desc), '[]'::jsonb)
    from jsonb_array_elements(result) item
  );
end;
$$;

revoke all on function public.search_public_salons(text, text, text, integer) from public;
grant execute on function public.search_public_salons(text, text, text, integer) to anon, authenticated;
