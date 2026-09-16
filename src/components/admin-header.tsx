import Link from "next/link";
import { signOutAdmin } from "@/app/actions/admin";

export function AdminHeader({ email }: { email: string | undefined }) {
  const initial = email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="border-b border-border/70 bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full border border-primary/40 font-heading text-sm text-primary">
              G&nbsp;H
            </span>
            <span className="font-heading text-lg leading-none">Wedding admin</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/admin/events" className="transition-colors hover:text-foreground">
              Events
            </Link>
            <Link href="/admin/travel" className="transition-colors hover:text-foreground">
              Travel
            </Link>
            <Link href="/admin/faq" className="transition-colors hover:text-foreground">
              FAQ
            </Link>
            <Link href="/admin/rsvp-dates" className="transition-colors hover:text-foreground">
              RSVP dates
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background/70 py-1 pr-3 pl-1 text-sm sm:flex">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent font-heading text-xs text-accent-foreground">
              {initial}
            </span>
            <span className="text-muted-foreground">{email}</span>
          </div>
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
