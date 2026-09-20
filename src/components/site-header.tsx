"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Share2 } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { designAssets } from "@/lib/design-assets";
import { cn } from "@/lib/utils";
import "./site-header.css";

const links = [
  { href: "#welcome", label: "Welcome" },
  { href: "#events", label: "Events" },
  { href: "#travel", label: "Travel & stay" },
  { href: "#wardrobe", label: "Wardrobe planner" },
  { href: "#guest-guide", label: "Guest guide" },
  { href: "#faq", label: "Questions" },
  { href: "#rsvp", label: "RSVP" },
  { href: "#story", label: "Our story" },
];

export function SiteHeader({
  weddingStartIso,
  rsvpSubmitted,
}: {
  weddingStartIso: string | null;
  rsvpSubmitted: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("welcome");
  const [shared, setShared] = useState(false);
  const weddingStart = weddingStartIso ? new Date(weddingStartIso) : null;

  // Scroll-spy for the nav's active state. The design marks the section
  // currently in view rather than tracking location.hash, so deep-linking
  // and free scrolling both land on the same answer.
  useEffect(() => {
    const ids = links.map((link) => link.href.slice(1));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  // Match the design's body.locked -- the overlay scrolls internally, so
  // letting the page scroll behind it fights the user's gesture.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Closing the menu and following the anchor in the same tick doesn't work:
  // the jump happens while body still has overflow:hidden from the scroll
  // lock, so it's a no-op and only the URL changes. The effect cleanup that
  // releases the lock runs after paint -- later than any rAF we could
  // schedule here -- so release it synchronously, then scroll next frame.
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();

    const target = document.getElementById(href.slice(1));
    setMenuOpen(false);
    if (!target) return;

    document.body.style.overflow = "";
    // Wait out the overlay's 240ms close transition before scrolling -- a
    // smooth scroll started while it's still animating gets cancelled.
    window.setTimeout(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      window.history.replaceState(null, "", href);
    }, 260);
  };

  // Web Share API where it's available (mobile Safari/Chrome); everywhere
  // else, copy the link and flip the button's label briefly -- same
  // micro-pattern as CalendarButton's "downloaded" state in
  // event-flip-cards.tsx.
  const handleShare = async () => {
    const shareData = { title: "Gayathri & Hrishikesh's Wedding", url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Cancelled share sheet -- nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setShared(true);
    window.setTimeout(() => setShared(false), 1800);
  };

  const artStyle = { "--sh-hero-art": `url(${designAssets.hero})` } as CSSProperties;
  const floralStyle = { "--sh-floral-art": `url(${designAssets.floral})` } as CSSProperties;

  return (
    <>
      <header className="sh-header" style={floralStyle}>
        <div className="sh-header-inner">
          <a href="#welcome" className="sh-monogram" aria-label="Return to the top">
            G&nbsp;H
          </a>
          <a href="#welcome" className="sh-title">
            Gayathri &amp; Hrishikesh
          </a>
          <div className="sh-actions">
            <a href="#rsvp" className="sh-rsvp">
              {rsvpSubmitted ? "Your RSVP" : "RSVP"}
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
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

      {/* Stays mounted so opacity/visibility can transition and the staggered
          enter animations have something to run on -- conditionally rendering
          it meant there was never a "closed" state to animate from. */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
        aria-label="Site menu"
        className={cn("sh-overlay", menuOpen && "sh-open")}
        style={{ ...artStyle, ...floralStyle }}
      >
        <div className="sh-overlay-art">
          <div className="sh-overlay-art-inner">
            <p>
              May 29-30, 2027
              <br />
              Wyndham Grand, Pittsburgh Downtown
            </p>
          </div>
        </div>
        <div className="sh-overlay-panel">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="sh-overlay-close"
            tabIndex={menuOpen ? 0 : -1}
          >
            &times;
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share this site"
            className="sh-overlay-share"
            tabIndex={menuOpen ? 0 : -1}
          >
            <Share2 aria-hidden="true" />
            <span className="sr-only">{shared ? "Copied" : "Share"}</span>
          </button>

          {/* Mobile-only mini-header -- desktop keeps the plain eyebrow
              below plus the art pane's own date/venue placard. */}
          <div className="sh-overlay-mobile-header">
            <span className="sh-monogram" aria-hidden="true">
              G&nbsp;H
            </span>
            <div>
              <p className="sh-overlay-eyebrow">Wedding weekend</p>
              <p className="sh-overlay-mobile-title">Plan your weekend</p>
              <p className="sh-overlay-mobile-subline">May 29-30, 2027 &middot; Pittsburgh</p>
            </div>
          </div>

          <p className="sh-overlay-eyebrow sh-overlay-eyebrow-desktop">Wedding weekend</p>

          <nav aria-label="Wedding website sections" className="sh-overlay-nav">
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavClick(event, link.href)}
                tabIndex={menuOpen ? 0 : -1}
                className={cn(activeId === link.href.slice(1) && "sh-active")}
              >
                <span className="sh-overlay-nav-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="sh-overlay-nav-label">
                  {link.href === "#rsvp" && rsvpSubmitted ? "Your RSVP" : link.label}
                </span>
                <span className="sh-overlay-nav-arrow" aria-hidden="true">
                  &#8594;
                </span>
              </a>
            ))}
          </nav>

          <p className="sh-overlay-venue">
            Gayathri &amp; Hrishikesh &middot; Wyndham Grand, Pittsburgh Downtown
          </p>

          {weddingStart ? (
            <div className="sh-overlay-countdown">
              <Countdown target={weddingStart} title="Until the wedding weekend" />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
