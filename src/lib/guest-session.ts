import type { SupabaseClient } from "@supabase/supabase-js";

export type GuestContext = {
  household: {
    id: string;
    display_name: string;
    rsvp_submitted_at: string | null;
    song_request: string | null;
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
    description: string | null;
    extra_content: Record<string, unknown>;
  }[];
  guest_events: { guest_id: string; event_id: string }[];
  rsvps: { guest_id: string; event_id: string; attending: "yes" | "no" | null }[];
  site_settings: { rsvp_deadline: string | null; late_edits_enabled: boolean } | null;
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
