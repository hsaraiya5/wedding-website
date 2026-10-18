"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { designAssets } from "@/lib/design-assets";
import "./hotel-flip-cards.css";

export type HotelOption = {
  id: string;
  type: "hotel-block" | "other-hotel" | "transport";
  name: string;
  label: string | null;
  description: string | null;
  room_types: string | null;
  address: string | null;
  map_link: string | null;
  booking_link: string | null;
  parking_info: string | null;
  distance_from_venue: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
};

// The designer's pencil drawings, matched on the hotel's name since the art
// ships with the site rather than being uploaded per hotel. A hotel with no
// drawing still gets a front, just without the picture.
const hotelArt = [
  {
    match: /wyndham/i,
    src: designAssets.hotelWyndham,
    alt: "Pencil drawing of the Wyndham Grand Pittsburgh Downtown tower",
  },
  {
    match: /\beven\b/i,
    src: designAssets.hotelEven,
    alt: "Pencil drawing of the EVEN Hotel Pittsburgh Downtown building",
  },
];

// Plain flat cards with a click-to-flip: the front is the hotel's drawing and
// name, the back holds every detail. Like EventFlipCards, each card sizes to
// its front and grows to fit the back when flipped, so the drawing never sits
// over a void left for the longer back.
export function HotelFlipCards({ options }: { options: HotelOption[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const backRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const frontContentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const backContentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [heights, setHeights] = useState<Record<string, { front: number; back: number }>>({});

  useEffect(() => {
    const measure = () => {
      const next: Record<string, { front: number; back: number }> = {};
      for (const option of options) {
        const front = frontContentRefs.current[option.id]?.offsetHeight ?? 0;
        const back = backContentRefs.current[option.id]?.offsetHeight ?? 0;
        if (front) next[option.id] = { front, back };
      }
      setHeights(next);
    };
    measure();
    // Text rewraps at every width, so the heights are only right until the
    // next resize -- re-measure whenever either face's content changes size.
    const observer = new ResizeObserver(measure);
    for (const option of options) {
      const front = frontContentRefs.current[option.id];
      const back = backContentRefs.current[option.id];
      if (front) observer.observe(front);
      if (back) observer.observe(back);
    }
    return () => observer.disconnect();
  }, [options]);

  const openCard = (key: string) => {
    setOpenKey(key);
    window.setTimeout(() => backRefs.current[key]?.focus({ preventScroll: true }), 420);
  };

  const closeCard = (key: string, restoreFocus: boolean) => {
    setOpenKey((prev) => (prev === key ? null : prev));
    if (restoreFocus) triggerRefs.current[key]?.focus({ preventScroll: true });
  };

  const handleBackClick = (event: MouseEvent<HTMLDivElement>, key: string) => {
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    closeCard(key, true);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, key: string) => {
    if (event.key === "Escape" && openKey === key) {
      event.preventDefault();
      closeCard(key, true);
    }
  };

  return (
    <div className="hf-grid">
      {options.map((option) => {
        const isOpen = openKey === option.id;
        const backId = `hf-back-${option.id}`;
        const art = hotelArt.find((entry) => entry.match.test(option.name));
        const measured = heights[option.id];
        // Never shrink on open, and before the first measurement (server
        // render) set no height so the front sizes the card.
        const innerHeight = measured
          ? isOpen
            ? Math.max(measured.front, measured.back)
            : measured.front
          : undefined;

        return (
          <article
            key={option.id}
            className={`hf-flip ${isOpen ? "hf-flipped" : ""}`.trim()}
            onKeyDown={(e) => handleCardKeyDown(e, option.id)}
          >
            <div className="hf-inner" style={{ height: innerHeight }}>
              <div className="hf-face hf-front">
                <button
                  type="button"
                  className="hf-trigger"
                  aria-label={`Open ${option.name} details`}
                  aria-expanded={isOpen}
                  aria-controls={backId}
                  ref={(node) => {
                    triggerRefs.current[option.id] = node;
                  }}
                  onClick={() => openCard(option.id)}
                />
                <div
                  className="hf-front-content"
                  ref={(node) => {
                    frontContentRefs.current[option.id] = node;
                  }}
                >
                  {art ? (
                    <div className="hf-art">
                      <Image
                        src={art.src}
                        alt={art.alt}
                        width={1200}
                        height={800}
                        sizes="(max-width: 700px) 100vw, 560px"
                      />
                    </div>
                  ) : null}
                  <div className="hf-front-title">
                    <div className="hf-hotel-copy">
                      {option.label ? <p className="gh-eyebrow">{option.label}</p> : null}
                      <h3 className="font-heading">{option.name}</h3>
                    </div>
                    <span className="hf-flip-hint" aria-hidden="true">
                      Flip for details
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="hf-face hf-back"
                id={backId}
                aria-hidden={!isOpen}
                tabIndex={isOpen ? 0 : -1}
                aria-label={`${option.name} details. Select the card to return to the overview.`}
                ref={(node) => {
                  backRefs.current[option.id] = node;
                }}
                onClick={(e) => handleBackClick(e, option.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                    e.preventDefault();
                    closeCard(option.id, true);
                  }
                }}
              >
                <div
                  className="hf-back-content"
                  ref={(node) => {
                    backContentRefs.current[option.id] = node;
                  }}
                >
                  <div className="hf-hotel-copy">
                    {option.label ? <p className="gh-eyebrow">{option.label}</p> : null}
                    <h3 className="font-heading">{option.name}</h3>
                    {option.address ? <p className="hf-address">{option.address}</p> : null}
                    {option.description ? <p className="hf-description">{option.description}</p> : null}
                  </div>
                  <ul className="hf-facts">
                    <li>
                      <span>Room types</span>
                      <strong>{option.room_types || "Coming soon"}</strong>
                    </li>
                    <li>
                      <span>Distance from venue</span>
                      <strong>{option.distance_from_venue || "Coming soon"}</strong>
                    </li>
                    <li>
                      <span>Parking</span>
                      <strong>{option.parking_info || "Coming soon"}</strong>
                    </li>
                    <li>
                      <span>Check-in</span>
                      <strong>{option.checkin_time || "Coming soon"}</strong>
                    </li>
                    <li>
                      <span>Check-out</span>
                      <strong>{option.checkout_time || "Coming soon"}</strong>
                    </li>
                  </ul>
                  <div className="hf-links">
                    {option.booking_link ? (
                      <a className="hf-book-link" href={option.booking_link} target="_blank" rel="noopener noreferrer">
                        Book your room &#8594;
                      </a>
                    ) : (
                      <span className="hf-book-link hf-book-link-disabled">Booking link coming soon</span>
                    )}
                    {option.map_link ? (
                      <a className="hf-map-link" href={option.map_link} target="_blank" rel="noopener noreferrer">
                        View on map &#8594;
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
