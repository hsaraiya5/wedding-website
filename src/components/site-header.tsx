"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Countdown } from "@/components/countdown";
import { designAssets } from "@/lib/design-assets";
import "./site-header.css";

const links = [
  { href: "/home", label: "Welcome" },
  { href: "/events", label: "Itinerary" },
  { href: "/rsvp", label: "RSVP" },
];

export function SiteHeader({ weddingStartIso }: { weddingStartIso: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const weddingStart = weddingStartIso ? new Date(weddingStartIso) : null;

  const artStyle = { "--sh-hero-art": `url(${designAssets.hero})` } as CSSProperties;
  const floralStyle = { "--sh-floral-art": `url(${designAssets.floral})` } as CSSProperties;

  return (
    <>
      <header className="sh-header">
        <div className="sh-header-inner">
          <Link href="/home" className="sh-monogram" aria-label="Return home">
            G&nbsp;H
          </Link>
          <Link href="/home" className="sh-title">
            Gayathri &amp; Hrishikesh
          </Link>
          <div className="sh-actions">
            <Link href="/rsvp" className="sh-rsvp">
              RSVP
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="sh-menu-button"
            >
              <span className="sh-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div role="dialog" aria-modal="true" className="sh-overlay" style={{ ...artStyle, ...floralStyle }}>
          <div className="sh-overlay-art">
            <div className="sh-overlay-art-inner">
              <p>
                May 29-30, 2027
                <br />
                Pittsburgh
              </p>
            </div>
          </div>
          <div className="sh-overlay-panel">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="sh-overlay-close"
            >
              &times;
            </button>

            <p className="sh-overlay-eyebrow">Wedding weekend</p>

            <nav aria-label="Wedding website sections" className="sh-overlay-nav">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(pathname === link.href && "sh-active")}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <p className="sh-overlay-venue">Gayathri &amp; Hrishikesh &middot; Wyndham Pittsburgh</p>

            {weddingStart ? (
              <div className="sh-overlay-countdown">
                <Countdown target={weddingStart} title="Until the wedding weekend" />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
