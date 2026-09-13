import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function NotAuthorized({ email }: { email: string | undefined }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="av-card flex max-w-sm flex-col items-center gap-3 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent font-heading text-lg text-accent-foreground">
          ?
        </span>
        <h1 className="font-heading text-xl">No admin access</h1>
        <p className="text-sm text-muted-foreground">
          {email ? <>Signed in as {email}, but this</> : "This"} account isn&apos;t on the admin
          allowlist. If you think that&apos;s a mistake, reach out to the couple.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-1 rounded-full" })}>
          Back to the site
        </Link>
      </div>
    </main>
  );
}
