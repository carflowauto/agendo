import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS, type BookingContext } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug) || !hasSupabaseEnv()) notFound();
  const supabase = await createClient();
  const from = new Date();
  const to = new Date(Date.now() + 21 * 24 * 3600 * 1000);
  const { data } = await supabase.rpc("get_booking_context", {
    p_slug: slug,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  const page = data as BookingContext | null;
  if (!page) notFound();
  return <Storefront page={page} slug={slug} />;
}
