import { redirect } from "next/navigation";

// The site is a single scrolling page (see /home). This route is kept so
// existing links and bookmarks to /rsvp land on the right section.
export default async function RsvpPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  redirect(submitted === "1" ? "/home?submitted=1#rsvp" : "/home#rsvp");
}
