import Link from "next/link";
import { signOutAdmin } from "@/app/actions/admin";
import { GhLogo } from "@/components/gh-logo";
import { AdminNav } from "@/components/admin-nav";

export function AdminHeader({ email }: { email: string | undefined }) {
  const initial = email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="border-b border-border/70 bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <GhLogo height={34} className="h-[34px] w-auto" />
            <span className="font-heading text-lg leading-none">Wedding admin</span>
          </Link>
          <AdminNav variant="inline" />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background/70 py-1 pr-3 pl-1 text-sm min-[1400px]:flex">
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
      <AdminNav variant="strip" />
    </header>
  );
}
