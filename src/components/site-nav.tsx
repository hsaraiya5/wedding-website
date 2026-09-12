"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/home", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/rsvp", label: "RSVP" },
];

// Persistent nav so every page is reachable from a menu (US-G3). Travel,
// Wardrobe, and FAQ will join this list once those pages exist -- home,
// events, and RSVP are the only real pages right now.
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-2xl items-center gap-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
              pathname === link.href && "bg-muted"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
