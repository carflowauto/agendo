-- Avis en lecture seule côté client : les pros ne peuvent plus créer,
-- modifier ni supprimer d'avis. La lecture publique est conservée.
-- Plus tard, les avis passeront par une fonction security definer liée à un RDV terminé.

drop policy if exists reviews_owner_write on public.reviews;

-- Défense en profondeur : aucun droit d'écriture direct pour les rôles client.
revoke insert, update, delete, truncate on table public.reviews from anon, authenticated;
