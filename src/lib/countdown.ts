// Calendar-aware months/weeks/days/minutes/seconds breakdown, ported from
// the design handoff's countdown logic (developer-handoff/index.html) so
// "2 months" always means "the same date, 2 calendar months from now"
// rather than a fixed 30-day approximation.

export type CountdownParts = {
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function dateAfterMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(
    year,
    month,
    Math.min(date.getDate(), lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

export function getCountdownParts(target: Date, now: Date = new Date()): CountdownParts {
  if (now >= target) {
    return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  let months =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  let anchor = dateAfterMonths(now, months);
  if (anchor > target) {
    months -= 1;
    anchor = dateAfterMonths(now, months);
  }

  let remaining = target.getTime() - anchor.getTime();
  const weeks = Math.floor(remaining / 604800000);
  remaining -= weeks * 604800000;
  const days = Math.floor(remaining / 86400000);
  remaining -= days * 86400000;
  const hours = Math.floor(remaining / 3600000);
  remaining -= hours * 3600000;
  const minutes = Math.floor(remaining / 60000);
  remaining -= minutes * 60000;
  const seconds = Math.floor(remaining / 1000);

  return { months, weeks, days, hours, minutes, seconds };
}

// The wedding weekend "starts" at the earliest invited event's date/time.
// Deriving it this way (rather than a separate hardcoded setting) means it
// can never drift out of sync with the actual event schedule.
export function getWeddingStart(
  events: { event_date: string | null; start_time: string | null }[]
): Date | null {
  const dates = events
    .filter((e) => e.event_date && e.start_time)
    .map((e) => new Date(`${e.event_date}T${e.start_time}`))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}
