import { notFound } from "next/navigation";
import { InvitationForm } from "@/components/invitation-form";
import { Logo } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InvitationPayload = {
  pro_name: string;
  profession: string;
  city: string;
  address: string | null;
  expires_at: string;
  consumed_at: string | null;
  slots: string[];
  service: { id: string; name: string; duration_min: number; price_cents: number } | null;
};

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_invitation", { p_token: token });
  const invitation = data as InvitationPayload | null;
  if (!invitation) notFound();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Logo compact />
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900">{invitation.pro_name} vous propose un créneau</h1>
        <p className="mt-1 text-slate-600">
          {invitation.profession}
          {invitation.city ? ` · ${invitation.city}` : ""}
          {invitation.address ? ` · ${invitation.address}` : ""}
        </p>
        <div className="mt-6">
          <InvitationForm
            token={token}
            slots={invitation.slots ?? []}
            service={invitation.service}
            consumed={Boolean(invitation.consumed_at)}
            expired={new Date(invitation.expires_at).getTime() < Date.now()}
          />
        </div>
      </div>
    </main>
  );
}
