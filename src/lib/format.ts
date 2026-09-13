// Shared date/time formatting for event displays. Inputs come straight
// from Postgres date/time columns (e.g. "2027-05-29", "10:00:00").

export function formatEventDay(eventDate: string | null): string {
  if (!eventDate) return "";
  const date = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return eventDate;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatEventDayFull(eventDate: string | null): string {
  if (!eventDate) return "";
  const date = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return eventDate;
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function formatEventTime(time: string | null): string {
  if (!time) return "";
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const date = new Date(2000, 0, 1, hours, minutes);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
