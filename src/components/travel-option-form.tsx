"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveTravelOption } from "@/app/actions/admin";
import { HotelFlipCards } from "@/components/hotel-flip-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TravelOption = {
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
  sort_order: number;
} | null;

export function TravelOptionForm({ travelOption }: { travelOption: TravelOption }) {
  const [state, formAction, pending] = useActionState(saveTravelOption, { error: null });

  // Mirrors the fields the hotel flip-card actually renders, so the
  // preview updates live as the admin types instead of only after saving.
  const [name, setName] = useState(travelOption?.name ?? "");
  const [label, setLabel] = useState(travelOption?.label ?? "");
  const [description, setDescription] = useState(travelOption?.description ?? "");
  const [roomTypes, setRoomTypes] = useState(travelOption?.room_types ?? "");
  const [address, setAddress] = useState(travelOption?.address ?? "");
  const [bookingLink, setBookingLink] = useState(travelOption?.booking_link ?? "");
  const [mapLink, setMapLink] = useState(travelOption?.map_link ?? "");
  const [distanceFromVenue, setDistanceFromVenue] = useState(travelOption?.distance_from_venue ?? "");
  const [parkingInfo, setParkingInfo] = useState(travelOption?.parking_info ?? "");
  const [checkinTime, setCheckinTime] = useState(travelOption?.checkin_time ?? "");
  const [checkoutTime, setCheckoutTime] = useState(travelOption?.checkout_time ?? "");

  const previewOption = {
    id: travelOption?.id ?? "preview",
    type: (travelOption?.type ?? "hotel-block") as "hotel-block" | "other-hotel" | "transport",
    name: name || "Untitled hotel",
    label: label || null,
    description: description || null,
    room_types: roomTypes || null,
    address: address || null,
    map_link: mapLink || null,
    booking_link: bookingLink || null,
    parking_info: parkingInfo || null,
    distance_from_venue: distanceFromVenue || null,
    checkin_time: checkinTime || null,
    checkout_time: checkoutTime || null,
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {travelOption ? (
        <input type="hidden" name="travel_option_id" value={travelOption.id} />
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <div className="av-field">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={travelOption?.type ?? "hotel-block"}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="hotel-block">Venue hotel</option>
              <option value="other-hotel">Other hotel</option>
            </select>
          </div>

          <div className="av-field">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wyndham Grand Pittsburgh Downtown"
              required
            />
          </div>

          <div className="av-field">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Venue hotel"
            />
            <p className="av-section-hint">Shown above the hotel name, e.g. &quot;Venue hotel&quot; or &quot;Shuttle hotel&quot;.</p>
          </div>

          <div className="av-field">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="av-field">
              <Label htmlFor="room_types">Room types</Label>
              <Input
                id="room_types"
                name="room_types"
                value={roomTypes}
                onChange={(e) => setRoomTypes(e.target.value)}
                placeholder="e.g. King and Double Queen rooms"
              />
            </div>
            <div className="av-field">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="av-field">
              <Label htmlFor="booking_link">Booking link</Label>
              <Input
                id="booking_link"
                name="booking_link"
                value={bookingLink}
                onChange={(e) => setBookingLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="av-field">
              <Label htmlFor="map_link">Map link</Label>
              <Input
                id="map_link"
                name="map_link"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>

          <p className="av-section-hint">The fields below show on the back of the card, once a guest flips it.</p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="av-field">
              <Label htmlFor="distance_from_venue">Distance from venue</Label>
              <Input
                id="distance_from_venue"
                name="distance_from_venue"
                value={distanceFromVenue}
                onChange={(e) => setDistanceFromVenue(e.target.value)}
                placeholder="e.g. 0.3 miles from the Wyndham Grand"
              />
            </div>
            <div className="av-field">
              <Label htmlFor="parking_info">Parking</Label>
              <Input
                id="parking_info"
                name="parking_info"
                value={parkingInfo}
                onChange={(e) => setParkingInfo(e.target.value)}
                placeholder="e.g. Valet only, $45/night"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="av-field">
              <Label htmlFor="checkin_time">Check-in time</Label>
              <Input
                id="checkin_time"
                name="checkin_time"
                value={checkinTime}
                onChange={(e) => setCheckinTime(e.target.value)}
                placeholder="e.g. 3:00 PM"
              />
            </div>
            <div className="av-field">
              <Label htmlFor="checkout_time">Check-out time</Label>
              <Input
                id="checkout_time"
                name="checkout_time"
                value={checkoutTime}
                onChange={(e) => setCheckoutTime(e.target.value)}
                placeholder="e.g. 11:00 AM"
              />
            </div>
          </div>

          <div className="av-field">
            <Label htmlFor="sort_order">Order</Label>
            <Input id="sort_order" name="sort_order" type="number" defaultValue={travelOption?.sort_order ?? 0} />
            <p className="av-section-hint">Lower numbers show first. Hotels with the same order fall back to name.</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <h3 className="av-section-title">Preview</h3>
            <p className="av-section-hint">Updates live. Select the card to see the back.</p>
          </div>
          <div className="av-preview-grid">
            <HotelFlipCards options={[previewOption]} />
          </div>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
