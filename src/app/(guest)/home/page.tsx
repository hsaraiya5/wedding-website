import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestContext } from "@/lib/guest-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

// Depends on the session's bound household -- never cache.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const context = await getGuestContext(supabase);
  if (!context) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {context.household.display_name}!</CardTitle>
          <CardDescription>
            This page is a placeholder until the real design/content is ready -- for now, here&apos;s
            where you can go.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Link href="/events" className={buttonVariants()}>
            See your events
          </Link>
          <Link href="/rsvp" className={buttonVariants({ variant: "outline" })}>
            RSVP
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
