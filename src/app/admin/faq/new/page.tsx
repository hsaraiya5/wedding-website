import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin-guard";
import { NotAuthorized } from "@/components/not-authorized";
import { FaqForm } from "@/components/faq-form";

export default async function NewFaqPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await requireAdminUser(supabase);

  if (!isAdmin) {
    return <NotAuthorized email={user.email} />;
  }

  return (
    <main className="av-page">
      <Link href="/admin/faq" className="av-back-link self-start">
        &larr; FAQ
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">New</p>
        <h1 className="font-heading text-3xl">Add a question</h1>
      </div>

      <div className="av-section">
        <FaqForm faq={null} />
      </div>
    </main>
  );
}
