import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { DeleteItemButton } from "@/components/delete-item-button";
import { deleteFaq } from "@/app/actions/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: faqs } = await supabase.from("faqs").select("*").order("order_index");

  return (
    <main className="av-page">
      <Link href="/admin" className="av-back-link self-start">
        &larr; Dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">FAQ</p>
          <h1 className="font-heading text-3xl">Questions & answers</h1>
        </div>
        <Link href="/admin/faq/new" className={buttonVariants()}>
          New question
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {(faqs ?? []).length === 0 ? (
          <p className="text-muted-foreground">Nothing here yet -- add a question to show it on the FAQ section.</p>
        ) : null}
        {(faqs ?? []).map((faq) => (
          <div key={faq.id} className="av-household-card">
            <div className="av-household-header">
              <div>
                <p className="av-section-hint">Order {faq.order_index}</p>
                <h2 className="font-heading text-xl">{faq.question}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/faq/${faq.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit
                </Link>
                <DeleteItemButton
                  deleteAction={deleteFaq}
                  id={faq.id}
                  confirmMessage={`Delete "${faq.question}"? This can't be undone.`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
