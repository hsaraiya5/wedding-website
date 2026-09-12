"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Countdown } from "@/components/countdown";

const links = [
  { href: "/home", label: "Welcome" },
  { href: "/events", label: "Itinerary" },
  { href: "/rsvp", label: "RSVP" },
];

export function SiteHeader({ weddingStartIso }: { weddingStartIso: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const weddingStart = weddingStartIso ? new Date(weddingStartIso) : null;

  return (
    <>
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <Link href="/home" className="font-heading text-lg" aria-label="Return home">
            G&nbsp;H
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/rsvp"
              className="hidden rounded border border-primary bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent-foreground sm:inline-flex"
            >
              RSVP
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex flex-col gap-1.5 rounded p-2 hover:bg-muted"
            >
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background p-8"
        >
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="absolute right-4 top-4 rounded p-2 text-2xl leading-none hover:bg-muted"
          >
            &times;
          </button>

          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Wedding weekend
          </p>

          <nav aria-label="Wedding website sections" className="flex flex-col items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "font-heading text-3xl transition-colors hover:text-primary",
                  pathname === link.href && "text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-sm text-muted-foreground">
            Gayathri &amp; Hrishikesh &middot; Wyndham Pittsburgh
          </p>

          {weddingStart ? (
            <Countdown target={weddingStart} title="Until the wedding weekend" />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
