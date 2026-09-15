"use client";

import { useState, type CSSProperties } from "react";
import { formatEventTime } from "@/lib/format";
import "./wardrobe-planner.css";

export type WardrobeContent = {
  title?: string;
  description?: string;
  good_to_know?: string;
  palette?: { name: string; hex: string }[];
};

type Event = {
  id: string;
  name: string;
  start_time: string | null;
  extra_content: { wardrobe?: WardrobeContent } | Record<string, unknown>;
};

// Cycled by position, same reasoning as EventsTimeline's accentColors --
// generalizes regardless of what the admin actually calls each event.
const accentColors = [
  "var(--color-event-haldi)",
  "var(--color-event-sangeet)",
  "var(--color-event-ceremony)",
  "var(--color-event-reception)",
];

// Four line-art sketches ported from the handoff (one per garment pairing:
// Haldi/Sangeet/Ceremony/Reception), cycled by position rather than tied to
// a specific event name for the same reason as accentColors above. These
// are generic decorative line art, not per-couple content, so they aren't
// admin-editable -- building an SVG picker in the admin UI would be a lot
// of surface area for something nobody needs to change.
const garmentSketches = [
  // Haldi: lehenga + kurta
  <svg key="haldi" viewBox="0 0 360 250" role="img" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={92} cy={30} r={12} /><path d="M66 65 Q92 48 118 65 L111 104 H73 Z" /><path d="M75 70 Q57 86 52 112 M109 70 Q127 86 132 112" /><path d="M72 104 Q54 143 44 224 H140 Q130 143 112 104" /><path d="M63 139 Q92 154 121 139 M55 176 Q92 192 129 176" /><circle cx={92} cy={163} r={5} /><circle cx={92} cy={199} r={5} /><circle cx={250} cy={30} r={12} /><path d="M220 64 Q250 47 280 64 L289 179 H211 Z" /><path d="M220 68 Q202 91 198 123 M280 68 Q298 91 302 123" /><path d="M228 179 L220 226 M272 179 L280 226" /><path d="M242 63 L250 77 L258 63 M250 78 V145" /><circle cx={250} cy={101} r={2} /><circle cx={250} cy={119} r={2} /><path d="M222 100 Q250 116 286 94" />
  </svg>,
  // Sangeet: dancing lehenga + embroidered kurta
  <svg key="sangeet" viewBox="0 0 360 250" role="img" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={94} cy={29} r={12} /><path d="M67 64 Q94 47 121 64 L114 101 H74 Z" /><path d="M72 101 Q53 143 33 222 Q93 240 155 219 Q133 142 115 101" /><path d="M47 185 Q94 204 141 184 M58 151 Q94 168 129 151" /><path d="M75 68 Q52 83 39 111 M116 68 Q143 79 153 105" /><path d="M35 116 Q92 128 148 109" /><circle cx={76} cy={181} r={4} /><circle cx={113} cy={190} r={4} /><circle cx={250} cy={29} r={12} /><path d="M217 62 Q250 45 283 62 L295 181 H205 Z" /><path d="M217 68 L193 115 M283 68 L307 115" /><path d="M225 181 L219 225 M275 181 L282 225" /><path d="M240 61 L250 76 L260 61 M250 76 V151" /><path d="M224 92 Q250 109 289 86 M218 123 Q250 140 292 116" /><circle cx={250} cy={98} r={3} /><circle cx={250} cy={128} r={3} />
  </svg>,
  // Ceremony: sari + sherwani
  <svg key="ceremony" viewBox="0 0 360 250" role="img" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={93} cy={28} r={12} /><path d="M66 62 Q93 46 120 62 L113 99 H73 Z" /><path d="M75 99 Q57 148 50 225 H139 Q129 145 113 99" /><path d="M67 62 Q103 94 124 134 Q139 164 137 213" /><path d="M77 84 Q102 114 126 127 M59 188 Q96 201 134 188" /><path d="M70 66 Q52 88 46 118 M117 67 Q135 88 141 116" /><circle cx={249} cy={28} r={12} /><path d="M215 61 Q249 44 283 61 L290 203 H208 Z" /><path d="M217 68 L195 120 M281 68 L303 120" /><path d="M222 203 L218 228 M276 203 L281 228" /><path d="M237 60 L249 77 L261 60 M249 77 V181" /><circle cx={249} cy={101} r={2} /><circle cx={249} cy={123} r={2} /><circle cx={249} cy={145} r={2} /><path d="M216 88 Q249 109 287 84 M216 178 Q249 193 289 176" />
  </svg>,
  // Reception: evening lehenga + bandhgala
  <svg key="reception" viewBox="0 0 360 250" role="img" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={92} cy={28} r={12} /><path d="M65 62 Q92 45 119 62 L111 99 H73 Z" /><path d="M74 99 Q54 147 39 225 H145 Q130 146 111 99" /><path d="M52 192 Q92 211 133 192 M60 162 Q92 177 124 162" /><path d="M68 67 L48 118 M116 67 L136 118" /><circle cx={73} cy={183} r={4} /><circle cx={111} cy={196} r={4} /><circle cx={251} cy={28} r={12} /><path d="M217 61 Q251 44 285 61 L291 188 H211 Z" /><path d="M217 68 L195 119 M285 68 L307 119" /><path d="M226 188 L220 228 M276 188 L282 228" /><path d="M237 60 L251 78 L265 60 M251 78 V167" /><path d="M220 83 Q251 101 288 79" /><circle cx={251} cy={104} r={2} /><circle cx={251} cy={126} r={2} /><circle cx={251} cy={148} r={2} /><path d="M216 166 Q251 181 290 164" />
  </svg>,
];

export function WardrobePlanner({ events }: { events: Event[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = events[activeIndex];

  if (!active) return null;

  const wardrobe = (active.extra_content as { wardrobe?: WardrobeContent })?.wardrobe;

  return (
    <div className="wp-explorer">
      <div className="wp-detail" key={active.id}>
        <div className="wp-panel-inner">
          <div className="wp-copy">
            <p className="gh-eyebrow" style={{ color: accentColors[activeIndex % accentColors.length] } as CSSProperties}>
              {active.name}
            </p>
            <h3 className="font-heading">{wardrobe?.title || "Dress code coming soon"}</h3>
            {active.start_time ? <p className="wp-time">{formatEventTime(active.start_time)}</p> : null}
            {wardrobe?.description ? <p>{wardrobe.description}</p> : null}
            {wardrobe?.good_to_know ? (
              <div className="wp-note">
                <strong>Good to know</strong>
                <span>{wardrobe.good_to_know}</span>
              </div>
            ) : null}
          </div>

          <div
            className="wp-visual"
            style={{ "--wp-wash": accentColors[activeIndex % accentColors.length] } as CSSProperties}
          >
            <div className="wp-sketch">{garmentSketches[activeIndex % garmentSketches.length]}</div>
            {wardrobe?.palette && wardrobe.palette.length > 0 ? (
              <div>
                <p className="wp-palette-label">Suggested palette</p>
                <div className="wp-swatches" aria-label={`${active.name} color palette`}>
                  {wardrobe.palette.map((color) => (
                    <span key={color.hex} className="wp-swatch" title={color.name} style={{ background: color.hex }} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="wp-tabs"
        role="tablist"
        aria-label="Wardrobe by event"
        style={{ "--wp-count": events.length } as CSSProperties}
      >
        {events.map((event, index) => (
          <button
            key={event.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className="wp-tab"
            style={{ "--wp-tab-color": accentColors[index % accentColors.length] } as CSSProperties}
          >
            <span>{formatEventTime(event.start_time)}</span>
            <strong>{event.name}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
