-- Fixe le search_path des fonctions utilitaires (avertissement Supabase 0011).
alter function public.slugify(text) set search_path = public, extensions;
alter function public.slug_is_reserved(text) set search_path = public, extensions;
alter function public.unique_slug(text) set search_path = public, extensions;
alter function public.phone_digits(text) set search_path = public, extensions;
alter function public.paris_at(date, time) set search_path = public, extensions;
alter function public.guard_slug() set search_path = public, extensions;
