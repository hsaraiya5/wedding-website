"use client";

import { useEffect, useState } from "react";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";

function Unit({
  value,
  label,
  digits,
}: {
  value: number | null;
  label: string;
  digits: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-border/60 bg-background/60 px-3 py-2 min-w-[4.5rem]">
      <span className="font-heading text-2xl tabular-nums text-primary">
        {value === null ? "-".repeat(digits) : String(value).padStart(digits, "0")}
      </span>
      <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function Countdown({
  target,
  title,
  showSeconds = false,
}: {
  target: Date;
  title: string;
  showSeconds?: boolean;
}) {
  // Start null (server and first client render agree on the placeholder),
  // then fill in the real value after mount -- a ticking clock computed
  // with new Date() would otherwise mismatch between server render time
  // and client hydration time.
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(target));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Unit value={parts?.months ?? null} label="Months" digits={2} />
        <Unit value={parts?.weeks ?? null} label="Weeks" digits={2} />
        <Unit value={parts?.days ?? null} label="Days" digits={2} />
        <Unit value={parts?.minutes ?? null} label="Minutes" digits={4} />
        {showSeconds ? <Unit value={parts?.seconds ?? null} label="Seconds" digits={2} /> : null}
      </div>
    </div>
  );
}
