import { SectionHeading } from "@/components/section";
import { HotelFlipCards, type HotelOption } from "@/components/hotel-flip-cards";
import "./travel-section.css";

const VENUE_ADDRESS = "Wyndham Grand Pittsburgh Downtown, 600 Commonwealth Place, Pittsburgh, PA 15222";

// Google's no-API-key "share > embed a map" URL format -- centers on the
// address and drops its own pin there. No custom pin overlay: a decorative
// one drawn on top drifts out of place as soon as a guest drags the map,
// since it isn't wired to the iframe's internal pan/zoom state.
export function VenueMap() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(VENUE_ADDRESS)}&z=16&output=embed`;

  return (
    <div className="tv-map">
      <iframe
        src={mapSrc}
        title="Map to the Wyndham Grand Pittsburgh Downtown"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export function TravelCopy({ children }: { children: string }) {
  return <p className="tv-copy">{children}</p>;
}

// Shown instead of hotel cards when the host is covering the household's
// stay -- ported from the handoff's ".travel-card.hosted-stay".
function HostedStayCard() {
  return (
    <article className="tv-card tv-hosted">
      <div className="tv-hotel-copy">
        <p className="gh-eyebrow">Your hosted stay</p>
        <h3 className="font-heading">Your room is reserved.</h3>
        <p>
          Your hotel room has been reserved and paid for. We will contact your family personally
          with the hotel name, stay dates, confirmation details, and check-in instructions. You do
          not need to book or pay for a room.
        </p>
      </div>
      <ul className="tv-hotel-facts">
        <li>
          <span>Reservation</span>
          <strong>Confirmed</strong>
        </li>
        <li>
          <span>Room cost</span>
          <strong>Covered by us</strong>
        </li>
        <li>
          <span>Next step</span>
          <strong>We will contact you directly</strong>
        </li>
      </ul>
    </article>
  );
}

export const DEFAULT_GETTING_HERE_TITLE = "However you're arriving, here's what to know.";
export const DEFAULT_GETTING_HERE_BODY =
  "The Wyndham Grand sits right in downtown Pittsburgh, so if you're driving in, please plan for extra time on the road -- Memorial Day weekend traffic downtown can get heavy. If you're flying in, the Wyndham Grand is about 30 minutes from Pittsburgh International Airport; we recommend arranging your own rideshare, taxi, or rental car for the trip into the city.";
export const DEFAULT_NOTICE_TITLE = "Two hotel blocks, held just for our guests.";
export const DEFAULT_NOTICE_BODY =
  "We're so excited to share two hotel blocks for our guests! Downtown Pittsburgh will be busy over Memorial Day weekend, so we've made booking as easy as possible -- just use the link on each hotel card below to reserve your room. A shuttle will run between the EVEN Hotel and the Wyndham Grand to and from every event, and the full schedule will be posted here closer to the weekend. Parking and other hotel details are on the back of each card. Our hotel blocks close on April 27, 2027 -- one month before the wedding -- so please book well ahead of time!";

export function TravelSection({
  travelOptions,
  hotelCoveredByHost = false,
  gettingHereTitle,
  gettingHereBody,
  noticeTitle,
  noticeBody,
}: {
  travelOptions: HotelOption[];
  hotelCoveredByHost?: boolean;
  gettingHereTitle?: string | null;
  gettingHereBody?: string | null;
  noticeTitle?: string | null;
  noticeBody?: string | null;
}) {
  const hotels = travelOptions.filter((t) => t.type === "hotel-block" || t.type === "other-hotel");

  if (hotels.length === 0 && !hotelCoveredByHost) return null;

  return (
    <div className="tv-sections">
      <div className="tv-subsection">
        <SectionHeading
          eyebrow="Getting here"
          title="Getting to the venue"
          intro={gettingHereTitle || DEFAULT_GETTING_HERE_TITLE}
        />
        <div className="tv-getting-here-grid">
          <TravelCopy>{gettingHereBody || DEFAULT_GETTING_HERE_BODY}</TravelCopy>
          <VenueMap />
        </div>
      </div>

      {hotelCoveredByHost ? (
        <div className="tv-subsection">
          <SectionHeading eyebrow="Your stay" title="Your stay is already taken care of." />
          <TravelCopy>
            Your room is booked and the cost is covered. We will contact your family personally
            with every hotel detail, so there is nothing you need to reserve.
          </TravelCopy>
          <HostedStayCard />
        </div>
      ) : (
        <div className="tv-subsection">
          <SectionHeading eyebrow="Where to stay" title="Hotels" intro={noticeTitle || DEFAULT_NOTICE_TITLE} />
          <TravelCopy>{noticeBody || DEFAULT_NOTICE_BODY}</TravelCopy>
          <HotelFlipCards options={hotels} />
        </div>
      )}
    </div>
  );
}
