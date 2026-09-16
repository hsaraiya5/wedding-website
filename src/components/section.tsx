"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { designAssets } from "@/lib/design-assets";
import { useTypedText } from "@/lib/use-typed-text";
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
// (18ms/char). Waits for its own scroll-into-view (same observer shape as
// Section above) instead of starting at mount -- every section renders up
// front on this single-page layout, so starting on mount meant the typing
// always finished off-screen before a guest ever scrolled down to see it.
function TypedLine({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const activate = () => setActive(true);

    if (!("IntersectionObserver" in window)) {
      activate();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activate();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { typed, typing } = useTypedText(text, active);

  return (
    <p ref={ref} className={`sc-typed-line ${typing ? "sc-typing" : ""}`.trim()} aria-label={text}>
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
      <p className="gh-eyebrow">{eyebrow}</p>
      <h2 className="font-heading">{title}</h2>
      {intro ? <TypedLine text={intro} /> : null}
    </div>
  );
}
