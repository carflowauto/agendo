export function dbError(error: { message?: string; code?: string } | null) {
  if (!error) return "Une erreur est survenue.";
  if (error.code === "23P01") return "Ce créneau en chevauche un autre.";
  const message = error.message ?? "Une erreur est survenue.";
  if (
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    /could not find the function/i.test(message) ||
    /schema cache/i.test(message) ||
    /relation .* does not exist/i.test(message)
  ) {
    return "La base n’est pas prête. Appliquez la migration SQL dans Supabase, puis réessayez.";
  }
  return message.replace(/^ERROR:\s*/i, "");
}
