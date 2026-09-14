import { redirect } from "next/navigation";

// The site is a single scrolling page (see /home). This route is kept so
// existing links and bookmarks to /events land on the right section.
export default function EventsPage() {
  redirect("/home#events");
}
