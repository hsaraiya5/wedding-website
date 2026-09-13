"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { designAssets } from "@/lib/design-assets";
import "./section.css";

// Reveals once, the first time the section scrolls into view -- matches
// the design's IntersectionObserver behavior (threshold 0.12, unobserve
// after the first trigger, so it never re-animates on scroll-back).
export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reveal = () => setInView(true);

    if (!("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const leftStyle = { backgroundImage: `url(${designAssets.floralLeft})` } as CSSProperties;
  const rightStyle = { backgroundImage: `url(${designAssets.floralRight})` } as CSSProperties;

  return (
    <section
      id={id}
      ref={ref}
      className={`sc-section ${inView ? "sc-in-view" : ""} ${className}`.trim()}
    >
      <div className="sc-rail sc-rail-left" style={leftStyle} aria-hidden="true" />
      <div className="sc-rail sc-rail-right" style={rightStyle} aria-hidden="true" />
      <div className="sc-container">{children}</div>
    </section>
  );
}

// Character-by-character typed intro line, matching the design's timing
// (18ms/char) and respecting prefers-reduced-motion (shows the full text
// immediately instead of animating).
function TypedLine({ text }: { text: string }) {
  const [typed, setTyped] = useState("");
  const startedRef = useRef(false);
  // Derived, not stored -- avoids a second setState call competing with
  // `typed` inside the same effect.
  const typing = typed.length > 0 && typed.length < text.length;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const showFullText = () => setTyped(text);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showFullText();
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className={`sc-typed-line ${typing ? "sc-typing" : ""}`.trim()} aria-label={text}>
      <span aria-hidden="true">{typed}</span>
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="sc-heading">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{eyebrow}</p>
      <h2 className="font-heading">{title}</h2>
      {intro ? <TypedLine text={intro} /> : null}
    </div>
  );
}
