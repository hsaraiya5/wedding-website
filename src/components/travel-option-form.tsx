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
  booking_code: string | null;
  booking_link: string | null;
  nightly_rate: string | null;
  rate_cutoff_date: string | null;
  description: string | null;
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
          <option value="hotel-block">Hotel block</option>
          <option value="other-hotel">Other hotel</option>
          <option value="transport">Transport note</option>
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="av-field">
          <Label htmlFor="booking_code">Booking code</Label>
          <Input id="booking_code" name="booking_code" defaultValue={travelOption?.booking_code ?? ""} />
        </div>
        <div className="av-field">
          <Label htmlFor="nightly_rate">Nightly rate</Label>
          <Input id="nightly_rate" name="nightly_rate" defaultValue={travelOption?.nightly_rate ?? ""} />
        </div>
        <div className="av-field">
          <Label htmlFor="rate_cutoff_date">Reserve by</Label>
          <Input
            id="rate_cutoff_date"
            name="rate_cutoff_date"
            type="date"
            defaultValue={travelOption?.rate_cutoff_date ?? ""}
          />
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

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
