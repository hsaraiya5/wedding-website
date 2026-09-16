"use client";

import { useActionState } from "react";
import { saveTravelOption } from "@/app/actions/admin";
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
  room_block: string | null;
  address: string | null;
  booking_details: string | null;
  booking_link: string | null;
  sort_order: number;
} | null;

export function TravelOptionForm({ travelOption }: { travelOption: TravelOption }) {
  const [state, formAction, pending] = useActionState(saveTravelOption, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {travelOption ? (
        <input type="hidden" name="travel_option_id" value={travelOption.id} />
      ) : null}

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
          defaultValue={travelOption?.name}
          placeholder="e.g. Wyndham Grand Pittsburgh Downtown"
          required
        />
      </div>

      <div className="av-field">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          name="label"
          defaultValue={travelOption?.label ?? ""}
          placeholder="e.g. Venue hotel"
        />
        <p className="av-section-hint">Shown above the hotel name, e.g. &quot;Venue hotel&quot; or &quot;Shuttle hotel&quot;.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="av-field">
          <Label htmlFor="room_block">Room block</Label>
          <Input id="room_block" name="room_block" defaultValue={travelOption?.room_block ?? ""} placeholder="e.g. 75 King rooms" />
        </div>
        <div className="av-field">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={travelOption?.address ?? ""} />
        </div>
        <div className="av-field">
          <Label htmlFor="booking_details">Booking details</Label>
          <Input id="booking_details" name="booking_details" defaultValue={travelOption?.booking_details ?? ""} placeholder="Coming soon" />
        </div>
      </div>

      <div className="av-field">
        <Label htmlFor="booking_link">Booking link</Label>
        <Input id="booking_link" name="booking_link" defaultValue={travelOption?.booking_link ?? ""} />
      </div>

      <div className="av-field">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={travelOption?.description ?? ""} rows={3} />
      </div>

      <div className="av-field">
        <Label htmlFor="sort_order">Order</Label>
        <Input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={travelOption?.sort_order ?? 0}
        />
        <p className="av-section-hint">Lower numbers show first. Hotels with the same order fall back to name.</p>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
