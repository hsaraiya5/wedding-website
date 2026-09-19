"use client";

import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
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

// Plain flat cards (same look as the old non-flipping .tv-hotel cards),
// with a click-to-flip added on top -- unlike EventFlipCards, there's no
// paper/peel skeuomorphism or per-card accent color here.
export function HotelFlipCards({ options }: { options: HotelOption[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const backRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

        return (
          <article
            key={option.id}
            className={`hf-flip ${isOpen ? "hf-flipped" : ""}`.trim()}
            onKeyDown={(e) => handleCardKeyDown(e, option.id)}
          >
            <div className="hf-inner">
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
                <div className="hf-front-content">
                  <div className="hf-hotel-copy">
                    {option.label ? <p className="gh-eyebrow">{option.label}</p> : null}
                    <h3 className="font-heading">{option.name}</h3>
                    {option.description ? <p className="hf-description">{option.description}</p> : null}
                    <p className="hf-room-types">
                      <span>Room types</span>
                      <strong>{option.room_types || "Coming soon"}</strong>
                    </p>
                  </div>
                  <div className="hf-front-links">
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
                <span className="hf-flip-hint" aria-hidden="true">
                  Flip for details
                </span>
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
                <div className="hf-hotel-copy">
                  <p className="gh-eyebrow">Good to know</p>
                  <h3 className="font-heading">{option.name}</h3>
                  {option.address ? <p>{option.address}</p> : null}
                </div>
                <ul className="hf-facts">
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
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
