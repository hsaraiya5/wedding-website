import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { getWeddingStart } from "@/lib/countdown";
import { SiteHeader } from "@/components/site-header";

// Depends on the session's bound household (via getGuestContext), same as
// every guest page -- never cache.
export const dynamic = "force-dynamic";

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const context = await getGuestContext(supabase);
  const weddingStart = context ? getWeddingStart(context.events) : null;

  return (
    <>
      <SiteHeader
        weddingStartIso={weddingStart?.toISOString() ?? null}
        rsvpSubmitted={context?.household.rsvp_submitted_at != null}
      />
      {children}
    </>
  );
}
