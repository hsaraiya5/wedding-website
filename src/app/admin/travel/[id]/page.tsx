import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { TravelOptionForm } from "@/components/travel-option-form";

export const dynamic = "force-dynamic";

export default async function EditTravelOptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: travelOption } = await supabase.from("travel_options").select("*").eq("id", id).single();

  if (!travelOption) {
    return (
      <main className="av-page items-center text-center">
        <p className="text-muted-foreground">Not found.</p>
        <Link href="/admin/travel" className="av-back-link">
          &larr; Back to Travel & stay
        </Link>
      </main>
    );
  }

  return (
    <main className="av-page">
      <Link href="/admin/travel" className="av-back-link self-start">
        &larr; Travel & stay
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Edit</p>
        <h1 className="font-heading text-3xl">{travelOption.name}</h1>
      </div>

      <div className="av-section">
        <TravelOptionForm travelOption={travelOption} />
      </div>
    </main>
  );
}
