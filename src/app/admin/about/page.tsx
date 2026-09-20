import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { AboutUsForm } from "@/components/about-us-form";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("about_body_1, about_body_2, about_photos")
    .eq("id", true)
    .single();

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">About us</p>
        <h1 className="font-heading text-3xl">Section copy</h1>
        <p className="av-section-hint">
          The story paragraphs and photo carousel shown near the bottom of the wedding site.
        </p>
      </div>

      <div className="av-section">
        <AboutUsForm
          bodyOne={siteSettings?.about_body_1 ?? null}
          bodyTwo={siteSettings?.about_body_2 ?? null}
          photos={siteSettings?.about_photos ?? []}
        />
      </div>
    </main>
  );
}
