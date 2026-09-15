import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { FaqForm } from "@/components/faq-form";

export const dynamic = "force-dynamic";

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  const { data: faq } = await supabase.from("faqs").select("*").eq("id", id).single();

  if (!faq) {
    return (
      <main className="av-page items-center text-center">
        <p className="text-muted-foreground">Not found.</p>
        <Link href="/admin/faq" className="av-back-link">
          &larr; Back to FAQ
        </Link>
      </main>
    );
  }

  return (
    <main className="av-page">
      <Link href="/admin/faq" className="av-back-link self-start">
        &larr; FAQ
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Edit</p>
        <h1 className="font-heading text-3xl">{faq.question}</h1>
      </div>

      <div className="av-section">
        <FaqForm faq={faq} />
      </div>
    </main>
  );
}
