"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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
