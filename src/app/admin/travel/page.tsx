import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { DeleteItemButton } from "@/components/delete-item-button";
import { deleteTravelOption } from "@/app/actions/admin";
import { TravelCopyForm } from "@/components/travel-copy-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  "hotel-block": "Hotel block",
  "other-hotel": "Other hotel",
  transport: "Transport note",
};

export default async function AdminTravelPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const [{ data: travelOptions }, { data: siteSettings }] = await Promise.all([
    supabase.from("travel_options").select("*").order("sort_order").order("name"),
    supabase
      .from("site_settings")
      .select("travel_getting_here_title, travel_getting_here_body, travel_notice_title, travel_notice_body")
      .eq("id", true)
      .single(),
  ]);

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Travel & stay</p>
        <h1 className="font-heading text-3xl">Section copy</h1>
        <p className="av-section-hint">
          The "getting here" and "book ahead" notices shown above the hotel cards on the wedding
          site.
        </p>
      </div>

      <div className="av-section">
        <TravelCopyForm copy={siteSettings ?? null} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Travel & stay</p>
          <h1 className="font-heading text-3xl">Hotels</h1>
        </div>
        <Link href="/admin/travel/new" className={buttonVariants()}>
          New hotel
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {(travelOptions ?? []).length === 0 ? (
          <p className="text-muted-foreground">
            Nothing here yet -- add a hotel to show it on the wedding site.
          </p>
        ) : null}
        {(travelOptions ?? []).map((option) => (
          <div key={option.id} className="av-household-card">
            <div className="av-household-header">
              <div>
                <p className="av-section-hint">{typeLabels[option.type] ?? option.type}</p>
                <h2 className="font-heading text-xl">{option.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/travel/${option.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit
                </Link>
                <DeleteItemButton
                  deleteAction={deleteTravelOption}
                  id={option.id}
                  confirmMessage={`Delete "${option.name}"? This can't be undone.`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
