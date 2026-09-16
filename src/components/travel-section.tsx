import { formatEventDayFull } from "@/lib/format";
import "./travel-section.css";

type TravelOption = {
  id: string;
  type: "hotel-block" | "other-hotel" | "transport";
  name: string;
  booking_code: string | null;
  booking_link: string | null;
  nightly_rate: string | null;
  rate_cutoff_date: string | null;
  description: string | null;
};

// Ported from the handoff's ".travel-card.hotel" -- a facts list of
// booking code / nightly rate / reserve-by date, each falling back to
// "Coming soon" (the handoff's own copy for a block not finalized yet)
// rather than an empty cell.
function HotelCard({ option, index }: { option: TravelOption; index: number }) {
  return (
    <article className="tv-card tv-hotel">
      <div className="tv-hotel-copy">
        <p className="gh-eyebrow">Hotel block {index + 1}</p>
        <h3 className="font-heading">{option.name}</h3>
        {option.description ? <p>{option.description}</p> : null}
        {option.booking_link ? (
          <a className="tv-text-link" href={option.booking_link} target="_blank" rel="noopener noreferrer">
            Reserve a room &#8594;
          </a>
        ) : null}
      </div>
      <ul className="tv-hotel-facts">
        <li>
          <span>Booking code</span>
          <strong>{option.booking_code || "Coming soon"}</strong>
        </li>
        <li>
          <span>Nightly rate</span>
          <strong>{option.nightly_rate || "Coming soon"}</strong>
        </li>
        <li>
          <span>Reserve by</span>
          <strong>{option.rate_cutoff_date ? formatEventDayFull(option.rate_cutoff_date) : "Coming soon"}</strong>
        </li>
      </ul>
    </article>
  );
}

// Ported from the handoff's ".transport-note" -- a wide, callout-styled
// card, no facts list (transport doesn't have a booking code/rate/cutoff).
function TransportCard({ option }: { option: TravelOption }) {
  return (
    <article className="tv-card tv-transport">
      <div>
        <p className="gh-eyebrow">{option.name}</p>
        <h3 className="font-heading">Please plan your own ride.</h3>
      </div>
      {option.description ? <p>{option.description}</p> : null}
    </article>
  );
}

// Shown instead of hotel-block cards when the host is covering the
// household's stay -- no rate/booking-code info is relevant to them.
function HotelCoveredCard() {
  return (
    <article className="tv-card tv-transport">
      <div>
        <p className="gh-eyebrow">Your stay</p>
        <h3 className="font-heading">You&apos;re all set.</h3>
      </div>
      <p>
        Your stay has been covered by the host family, we can&apos;t wait to celebrate with you!
        Please reach out to the hosts to get your hotel reservation details.
      </p>
    </article>
  );
}

export function TravelSection({
  travelOptions,
  hotelCoveredByHost = false,
}: {
  travelOptions: TravelOption[];
  hotelCoveredByHost?: boolean;
}) {
  if (travelOptions.length === 0 && !hotelCoveredByHost) return null;

  const hotels = travelOptions.filter((t) => t.type === "hotel-block" || t.type === "other-hotel");
  const transport = travelOptions.filter((t) => t.type === "transport");

  return (
    <div className="tv-grid">
      {hotelCoveredByHost ? (
        <HotelCoveredCard />
      ) : (
        hotels.map((option, index) => <HotelCard key={option.id} option={option} index={index} />)
      )}
      {transport.map((option) => (
        <TransportCard key={option.id} option={option} />
      ))}
    </div>
  );
}
