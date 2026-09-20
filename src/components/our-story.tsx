"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { designAssets } from "@/lib/design-assets";
import "./our-story.css";

// Placeholder slides using the same botanical/hero art as the rest of the
// site -- the design handoff's own dev note calls these "polished
// placeholders" to be swapped for the couple's final 4-5 photographs.
// Used whenever the admin hasn't uploaded any photos yet (see `photos` prop).
const DEFAULT_SLIDES = [
  { image: designAssets.hero, size: "cover", position: "center", caption: "From the first hello" },
  { image: designAssets.hero, size: "cover", position: "center", caption: "The adventures in between" },
  { image: designAssets.hero, size: "cover", position: "center", caption: "Our favorite kind of ordinary" },
  { image: designAssets.hero, size: "auto 118%", position: "left center", caption: "The easiest yes" },
  { image: designAssets.hero, size: "auto 118%", position: "right center", caption: "Pittsburgh is next" },
];

export const DEFAULT_BODY_1 =
  "Somewhere between long conversations, shared ambitions, and a growing collection of " +
  "inside jokes, we found the person who made everyday life feel expansive. We have built a " +
  "life around curiosity, family, and the kind of laughter that starts before the story is " +
  "finished.";

export const DEFAULT_BODY_2 =
  "This weekend is our chance to bring all those worlds together. We cannot wait to welcome " +
  "the people who have shaped us, celebrate the traditions that hold us, and begin our next " +
  "chapter surrounded by the people we love most.";

const ADVANCE_MS = 6500;

export type StoryPhoto = { url: string; caption: string | null };

export function OurStory({
  bodyOne,
  bodyTwo,
  photos,
}: {
  bodyOne?: string | null;
  bodyTwo?: string | null;
  photos?: StoryPhoto[] | null;
} = {}) {
  // Admin-uploaded photos always use the standard centered crop -- the
  // placeholder set's two asymmetric crops (slides 4/5 above) were framed
  // for that specific botanical image and don't generalize to arbitrary
  // uploads.
  const slides =
    photos && photos.length > 0
      ? photos.map((photo) => ({
          image: photo.url,
          size: "cover",
          position: "center",
          caption: photo.caption ?? "",
        }))
      : DEFAULT_SLIDES;

  const [activeIndex, setActiveIndex] = useState(0);
  // Guards against a stale index when `slides` shrinks out from under it --
  // only reachable in the admin preview, where `photos` can change live as
  // the admin adds/removes rows (the public site's slide count is fixed per
  // page load).
  const safeIndex = activeIndex < slides.length ? activeIndex : 0;
  const carouselRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timerRef = useRef<number | undefined>(undefined);

  const reduceMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scheduleAdvance = () => {
    window.clearTimeout(timerRef.current);
    if (reduceMotion()) return;
    timerRef.current = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
      scheduleAdvance();
    }, ADVANCE_MS);
  };

  useEffect(() => {
    scheduleAdvance();
    return () => window.clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scheduleAdvance is stable enough for this recurring-timer pattern
  }, []);

  const select = (index: number, moveFocus: boolean) => {
    const next = (index + slides.length) % slides.length;
    setActiveIndex(next);
    scheduleAdvance();
    if (moveFocus) dotRefs.current[next]?.focus({ preventScroll: true });
  };

  const handleDotKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = slides.length - 1;
    else return;
    event.preventDefault();
    select(next, true);
  };

  return (
    <>
      <div
        className="os-carousel"
        id="story-carousel"
        ref={carouselRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Gayathri and Hrishikesh photo story"
        onPointerEnter={() => window.clearTimeout(timerRef.current)}
        onPointerLeave={scheduleAdvance}
        onFocus={() => window.clearTimeout(timerRef.current)}
        onBlur={scheduleAdvance}
      >
        <div className="os-viewport" aria-live="polite">
          {slides.map((slide, index) => {
            const active = index === safeIndex;
            const style = {
              "--os-image": `url(${slide.image})`,
              "--os-size": slide.size,
              "--os-position": slide.position,
            } as CSSProperties;
            return (
              <figure
                key={index}
                className={`os-slide ${active ? "os-active" : ""}`}
                style={style}
                aria-hidden={!active}
              >
                <figcaption className="os-slide-label">{slide.caption}</figcaption>
              </figure>
            );
          })}
        </div>

        <div className="os-controls">
          <button
            type="button"
            className="os-arrow"
            aria-label="Previous story photo"
            title="Previous photo"
            onClick={() => select(safeIndex - 1, false)}
          >
            &#8592;
          </button>
          <div className="os-dots" role="tablist" aria-label="Choose a story photo">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                className="os-dot"
                aria-label={`Photo ${index + 1} of ${slides.length}`}
                aria-selected={index === safeIndex}
                tabIndex={index === safeIndex ? 0 : -1}
                ref={(node) => {
                  dotRefs.current[index] = node;
                }}
                onClick={() => select(index, false)}
                onKeyDown={(event) => handleDotKeyDown(event, index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="os-arrow"
            aria-label="Next story photo"
            title="Next photo"
            onClick={() => select(safeIndex + 1, false)}
          >
            &#8594;
          </button>
        </div>
      </div>
      <div className="os-copy">
        <p>{bodyOne || DEFAULT_BODY_1}</p>
        <p>{bodyTwo || DEFAULT_BODY_2}</p>
      </div>
    </>
  );
}
