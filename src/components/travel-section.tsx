import "./travel-section.css";

type TravelOption = {
  id: string;
  type: "hotel-block" | "other-hotel" | "transport";
  name: string;
  label: string | null;
  description: string | null;
  room_block: string | null;
  address: string | null;
  booking_details: string | null;
  booking_link: string | null;
};

// Ported from the handoff's ".travel-card.hotel" -- an eyebrow label, name,
// description, a facts list (room block / address / booking details), and
// a link out to the hotel's own site.
function HotelCard({ option }: { option: TravelOption }) {
  return (
    <article className="tv-card tv-hotel">
      <div className="tv-hotel-copy">
        {option.label ? <p className="gh-eyebrow">{option.label}</p> : null}
        <h3 className="font-heading">{option.name}</h3>
        {option.description ? <p>{option.description}</p> : null}
        {option.booking_link ? (
          <a className="tv-text-link" href={option.booking_link} target="_blank" rel="noopener noreferrer">
            View the {option.name} &#8594;
          </a>
        ) : null}
      </div>
      <ul className="tv-hotel-facts">
        <li>
          <span>Room block</span>
          <strong>{option.room_block || "Coming soon"}</strong>
        </li>
        <li>
          <span>Address</span>
          <strong>{option.address || "Coming soon"}</strong>
        </li>
        <li>
          <span>Booking details</span>
          <strong>{option.booking_details || "Coming soon"}</strong>
        </li>
      </ul>
    </article>
  );
}

// Ported from the handoff's ".transport-note.shuttle-note" -- always shown
// (not admin content), with copy that swaps for hosted-stay households,
// same treatment as other fixed site chrome elsewhere in the app.
function ShuttleNote({ hotelCoveredByHost }: { hotelCoveredByHost: boolean }) {
  return (
    <article className="tv-card tv-shuttle">
      <div>
        <p className="gh-eyebrow">During the weekend</p>
        <h3 className="font-heading">
          {hotelCoveredByHost
            ? "Your complete stay plan is coming directly to you."
            : "Hotel shuttles are provided."}
        </h3>
      </div>
      <p>
        {hotelCoveredByHost
          ? "We will include your hotel assignment, check-in instructions, and any shuttle timing in your personal stay details. You do not need to contact either hotel or arrange transportation between our room-block hotels and the wedding events."
          : "Guests staying at the EVEN Hotel can use our scheduled shuttles to and from the wedding events at the Wyndham. Guests staying at the Wyndham will already be onsite. The full shuttle timetable and pickup location will be posted here closer to the weekend."}
      </p>
    </article>
  );
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

export function TravelSection({
  travelOptions,
  hotelCoveredByHost = false,
}: {
  travelOptions: TravelOption[];
  hotelCoveredByHost?: boolean;
}) {
  const hotels = travelOptions.filter((t) => t.type === "hotel-block" || t.type === "other-hotel");

  if (hotels.length === 0 && !hotelCoveredByHost) return null;

  return (
    <div className="tv-grid">
      {hotelCoveredByHost ? (
        <HostedStayCard />
      ) : (
        hotels.map((option) => <HotelCard key={option.id} option={option} />)
      )}
      <ShuttleNote hotelCoveredByHost={hotelCoveredByHost} />
    </div>
  );
}
