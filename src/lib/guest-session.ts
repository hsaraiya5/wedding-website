import type { SupabaseClient } from "@supabase/supabase-js";

export type GuestContext = {
  household: {
    id: string;
    display_name: string;
    rsvp_submitted_at: string | null;
    song_request: string | null;
    dietary_needs: string | null;
    accessibility_needs: string | null;
    household_note: string | null;
    rsvp_deadline: string | null;
    hotel_covered_by_host: boolean;
  };
  guests: { id: string; first_name: string; last_name: string }[];
  events: {
    id: string;
    name: string;
    event_date: string | null;
    start_time: string | null;
    end_time: string | null;
    venue_name: string | null;
    address: string | null;
    dress_code: string | null;
    meal_info: string | null;
    room: string | null;
    description: string | null;
    extra_content: Record<string, unknown>;
  }[];
  guest_events: { guest_id: string; event_id: string }[];
  rsvps: { guest_id: string; event_id: string; attending: "yes" | "no" | null }[];
  site_settings: {
    rsvp_deadline: string | null;
    late_edits_enabled: boolean;
    travel_getting_here_title: string | null;
    travel_getting_here_body: string | null;
    travel_notice_title: string | null;
    travel_notice_body: string | null;
    about_body_1: string | null;
    about_body_2: string | null;
    about_photos: { url: string; caption: string | null }[];
  } | null;
  travel_options: {
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
  }[];
  faqs: { id: string; question: string; answer: string; order_index: number }[];
  whatsapp_numbers: { id: string; phone_number: string }[];
};

// Everything a guest-facing page (/events, /rsvp) needs, in one round-trip
// instead of several sequential ones. See get_guest_context in
// supabase/migrations/0004_get_guest_context.sql (updated in
// 0007_per_guest_invitations.sql for per-guest invitations). Returns null
// if this session isn't bound to a household (no code redeemed / expired).
export async function getGuestContext(
  supabase: SupabaseClient
): Promise<GuestContext | null> {
  const { data, error } = await supabase.rpc("get_guest_context");
  if (error || !data) {
    return null;
  }
  return data as GuestContext;
}
