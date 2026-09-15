import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { TravelOptionForm } from "@/components/travel-option-form";

export default async function NewTravelOptionPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  return (
    <main className="av-page">
      <Link href="/admin/travel" className="av-back-link self-start">
        &larr; Travel & stay
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">New</p>
        <h1 className="font-heading text-3xl">Add a travel option</h1>
      </div>

      <div className="av-section">
        <TravelOptionForm travelOption={null} />
      </div>
    </main>
  );
}
