"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { designAssets } from "@/lib/design-assets";
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
    <div className={`wh-home ${ready ? "wh-ready" : ""}`.trim()} style={{ ...heroStyle, ...floralStyle }}>
      {children}
    </div>
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

export function WelcomePanel({ children }: { children: ReactNode }) {
  return (
    <div className="wh-panel">
      <div className="wh-content">{children}</div>
    </div>
  );
}
