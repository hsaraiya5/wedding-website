"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { designAssets } from "@/lib/design-assets";
import { useTypedText } from "@/lib/use-typed-text";
import "./welcome-home.css";

// Reveals immediately on mount (not scroll-triggered like Section --
// this is the first thing shown after the invite-entrance animation
// hands off, so there's nothing to scroll to yet).
export function WelcomeHome({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // rAF so the "ready" class addition happens after first paint,
    // letting the initial (pre-animation) styles actually apply first --
    // otherwise the browser can coalesce both states into one frame and
    // skip the transition entirely.
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const heroStyle = { "--wh-hero-art": `url(${designAssets.hero})` } as CSSProperties;
  const floralStyle = { "--wh-floral-art": `url(${designAssets.floral})` } as CSSProperties;

  return (
    <section
      id="welcome"
      className={`wh-home ${ready ? "wh-ready" : ""}`.trim()}
      style={{ ...heroStyle, ...floralStyle }}
    >
      <div className="wh-bird-flight" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="wh-flying-bird" key={index}>
            <span className="wh-bird-sprite" />
          </span>
        ))}
      </div>
      {children}
      <a href="#events" className="wh-scroll-cue" aria-label="Scroll to your itinerary">
        <ChevronDown aria-hidden="true" />
      </a>
    </section>
  );
}

export function WelcomeArt({ mapUrl, caption }: { mapUrl: string; caption: ReactNode }) {
  return (
    <div className="wh-art">
      <div className="wh-art-copy">
        <p>{caption}</p>
        <a className="wh-map-link" href={mapUrl} target="_blank" rel="noopener noreferrer">
          Open in maps
        </a>
      </div>
    </div>
  );
}

// Mobile-only compact stand-in for WelcomeArt's date/venue placard --
// CSS-hidden above 700px (see .wh-venue-row in welcome-home.css), where
// WelcomeArt's own full-bleed treatment takes over instead. Keeping both
// in the DOM and toggling via CSS avoids reshuffling WelcomeArt/WelcomePanel
// (siblings, desktop's two-column split) just for a mobile-only reflow.
export function WelcomeVenueLine({
  mapUrl,
  month,
  days,
  year,
  venueName,
}: {
  mapUrl: string;
  month: string;
  days: string;
  year: string;
  venueName: string;
}) {
  return (
    <div className="wh-venue-row">
      <div className="wh-venue-date">
        <span className="wh-venue-month">{month}</span>
        <span className="wh-venue-days">{days}</span>
        <span className="wh-venue-year">{year}</span>
      </div>
      <span className="wh-venue-divider" aria-hidden="true" />
      <div className="wh-venue-info">
        <span className="wh-venue-label">Wedding weekend</span>
        <span className="wh-venue-name">{venueName}</span>
      </div>
      <a
        className="wh-venue-arrow"
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open venue in maps"
      >
        <ArrowUpRight aria-hidden="true" />
      </a>
    </div>
  );
}

// Types the message out character by character, matching the design's
// timing. Starts on the same ~640ms delay as the message's own fade-in
// (see .wh-message's animation-delay in welcome-home.css) rather than
// waiting on scroll -- this is the first thing shown, nothing to scroll
// into view yet.
export function WelcomeMessage({ text }: { text: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(true), 640);
    return () => clearTimeout(timer);
  }, []);

  const { typed, typing } = useTypedText(text, active);

  return (
    <p className={`wh-message ${typing ? "wh-typing" : ""}`.trim()} aria-label={text}>
      <span aria-hidden="true">{typed}</span>
    </p>
  );
}

export function WelcomePanel({ children }: { children: ReactNode }) {
  return (
    <div className="wh-panel">
      <div className="wh-content">{children}</div>
    </div>
  );
}
