"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/guest-list", label: "Guest list" },
  { href: "/admin/notes", label: "Guest notes" },
  { href: "/admin/travel", label: "Travel" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/rsvp-dates", label: "RSVP dates" },
  { href: "/admin/about", label: "About us" },
  { href: "/admin/activity", label: "Activity" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

// Two layouts of the same links: inline in the header from 1280px, and below
// that a swipeable row of pills under it (nine links never fit across a phone
// or a small laptop header), scrolled so the current page is in view.
export function AdminNav({ variant }: { variant: "inline" | "strip" }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (variant === "strip") activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname, variant]);

  if (variant === "inline") {
    return (
      <nav className="hidden items-center gap-4 text-sm font-medium whitespace-nowrap text-muted-foreground xl:flex" aria-label="Admin">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(pathname, link.href) ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-foreground",
              isActive(pathname, link.href) && "text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className="flex gap-2 overflow-x-auto border-t border-border/70 px-4 py-2.5 text-sm font-medium [scrollbar-width:none] sm:px-8 xl:hidden"
      aria-label="Admin"
    >
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            ref={active ? activeRef : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 whitespace-nowrap transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/70 text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
