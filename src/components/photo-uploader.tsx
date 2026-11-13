"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnSecondary } from "@/components/ui";

export function PhotoUploader({ userId }: { userId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div>
      <label className={`${btnSecondary} cursor-pointer`}>
        {pending ? "Envoi…" : "Ajouter une photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={pending}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setPending(true);
            setError(null);
            const supabase = createClient();
            const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
            const path = `${userId}/${crypto.randomUUID()}.${ext}`;
            const upload = await supabase.storage.from("vitrine").upload(path, file, { contentType: file.type });
            if (upload.error) {
              setError(upload.error.message);
              setPending(false);
              return;
            }
            const { data } = supabase.storage.from("vitrine").getPublicUrl(path);
            const insert = await supabase.from("photos").insert({ profile_id: userId, url: data.publicUrl });
            setPending(false);
            if (insert.error) setError(insert.error.message);
            else router.refresh();
          }}
        />
      </label>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
