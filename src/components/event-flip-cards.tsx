"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { formatEventDayFull, formatEventTime, formatIcsDateTime } from "@/lib/format";
import { designAssets } from "@/lib/design-assets";
import "./event-flip-cards.css";

type TraditionItem = { label: string; text: string };

type ItineraryContent = {
  subtitle?: string;
  tradition_intro?: string;
  tradition_list?: TraditionItem[];
};

type Event = {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  meal_info: string | null;
  room: string | null;
  description: string | null;
  extra_content: { itinerary?: ItineraryContent } | Record<string, unknown>;
};

// Ported from the design handoff's paper "event-flip" cards: a front face
// (overview) that peels its corner then turns in place to reveal the back
// (tradition details + calendar download). Cycled by position, same
// reasoning as the old EventsTimeline's accentColors -- generalizes
// regardless of what the admin actually calls each event.
const accents = [
  { color: "#b88420", wash: "#f4e3b9" },
  { color: "#7b3546", wash: "#eadbd8" },
  { color: "#a13f3d", wash: "#f1ddd8" },
  { color: "#5f7452", wash: "#dfe6d9" },
];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ef-calendar-icon">
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
      <path d="M12 14v4M10 16h4" />
    </svg>
  );
}

function CalendarButton({ event }: { event: Event }) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (!event.event_date || !event.start_time || !event.end_time) return;

    const start = formatIcsDateTime(event.event_date, event.start_time);
    const end = formatIcsDateTime(event.event_date, event.end_time);
    const description = event.description ?? "";
    const escape = (value: string) =>
      value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Gayathri and Hrishikesh//Wedding Weekend//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${start}-${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@gayathri-hrishikesh-wedding`,
      `DTSTAMP:${formatIcsDateTime(new Date().toISOString().slice(0, 10), "00:00")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escape(event.name)}`,
      `DESCRIPTION:${escape(description)}`,
      `LOCATION:${escape("Wyndham Grand Pittsburgh Downtown, Pittsburgh, PA")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const file = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  };

  return (
    <button
      type="button"
      className="ef-calendar-button"
      onClick={handleDownload}
      aria-label={`Add ${event.name} to calendar`}
    >
      <CalendarIcon />
      <span>{downloaded ? "Calendar ready" : "Add to calendar"}</span>
    </button>
  );
}

export function EventFlipCards({ events, startIndex = 0 }: { events: Event[]; startIndex?: number }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [peelingKey, setPeelingKey] = useState<string | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const backRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const openCard = (key: string) => {
    if (peelingKey === key || openKey === key) return;
    setOpenKey(null);
    setPeelingKey(key);
    const peelTimer = window.setTimeout(() => {
      setPeelingKey(null);
      setOpenKey(key);
      const focusTimer = window.setTimeout(() => {
        backRefs.current[key]?.focus({ preventScroll: true });
      }, 620);
      timers.current.push(focusTimer);
    }, 160);
    timers.current.push(peelTimer);
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

  const floralStyle = { "--ef-floral-art": `url(${designAssets.floral})` } as CSSProperties;

  return (
    <div className={`ef-grid ${openKey ? "ef-has-open" : ""}`.trim()} style={floralStyle}>
      {events.map((event, index) => {
        const position = startIndex + index;
        const accent = accents[position % accents.length];
        const motifPosition = position % 2 === 0 ? "left bottom" : "right bottom";
        const itinerary = (event.extra_content as { itinerary?: ItineraryContent })?.itinerary;
        const isOpen = openKey === event.id;
        const isPeeling = peelingKey === event.id;
        const backId = `ef-back-${event.id}`;

        const style = {
          "--ef-color": accent.color,
          "--ef-wash": accent.wash,
          "--ef-motif-position": motifPosition,
        } as CSSProperties;

        return (
          <article
            key={event.id}
            className={`ef-flip ${isPeeling ? "ef-peeling" : ""} ${isOpen ? "ef-flipped" : ""}`.trim()}
            style={style}
            onKeyDown={(e) => handleCardKeyDown(e, event.id)}
          >
            <div className="ef-inner">
              <div className="ef-face ef-front">
                <button
                  type="button"
                  className="ef-trigger"
                  aria-label={`Open ${event.name} details`}
                  aria-expanded={isOpen}
                  aria-controls={backId}
                  ref={(node) => {
                    triggerRefs.current[event.id] = node;
                  }}
                  onClick={() => openCard(event.id)}
                >
                  <span className="ef-heading">
                    <h3 className="font-heading">{event.name}</h3>
                    {itinerary?.subtitle ? <span className="ef-subtitle">{itinerary.subtitle}</span> : null}
                    <span className="ef-date">{formatEventDayFull(event.event_date)}</span>
                  </span>
                  <span className="ef-meta">
                    <span className="ef-meta-item">
                      <span className="ef-meta-label">Time</span>
                      <strong>
                        {formatEventTime(event.start_time)}
                        {event.end_time ? ` to ${formatEventTime(event.end_time)}` : ""}
                      </strong>
                    </span>
                    <span className="ef-meta-item">
                      <span className="ef-meta-label">Room</span>
                      <strong>{event.room || "Coming soon"}</strong>
                    </span>
                  </span>
                  <span className="ef-peel" aria-hidden="true" />
                </button>
              </div>

              <div
                className="ef-face ef-back"
                id={backId}
                aria-hidden={!isOpen}
                tabIndex={isOpen ? 0 : -1}
                aria-label={`${event.name} details. Select the card to return to the overview.`}
                ref={(node) => {
                  backRefs.current[event.id] = node;
                }}
                onClick={(e) => handleBackClick(e, event.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                    e.preventDefault();
                    closeCard(event.id, true);
                  }
                }}
              >
                <div className="ef-back-content">
                  <div className="ef-back-top">
                    <p className="gh-eyebrow" style={{ color: "var(--ef-color)" } as CSSProperties}>
                      What to expect
                    </p>
                  </div>
                  <div className="ef-back-heading">
                    <h3 className="font-heading">{event.name}</h3>
                    {itinerary?.subtitle ? <p className="ef-cultural-heading">{itinerary.subtitle}</p> : null}
                  </div>
                  <div className="ef-tradition-copy">
                    {itinerary?.tradition_intro ? <p>{itinerary.tradition_intro}</p> : null}
                    {itinerary?.tradition_list && itinerary.tradition_list.length > 0 ? (
                      <ul className="ef-tradition-list">
                        {itinerary.tradition_list.map((item) => (
                          <li key={item.label}>
                            <strong>{item.label}:</strong> {item.text}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="ef-meal">
                    <span>Time</span>
                    <strong>
                      {formatEventTime(event.start_time)}
                      {event.end_time ? ` to ${formatEventTime(event.end_time)}` : ""}
                    </strong>
                  </div>
                  <div className="ef-meal">
                    <span>Meal</span>
                    <strong>{event.meal_info || "Coming soon"}</strong>
                  </div>
                  <div className="ef-back-footer">
                    <CalendarButton event={event} />
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
