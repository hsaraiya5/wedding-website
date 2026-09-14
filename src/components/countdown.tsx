"use client";

import { useEffect, useState } from "react";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";
import { cn } from "@/lib/utils";
import "./countdown.css";

function Unit({
  value,
  label,
  digits,
  long,
}: {
  value: number | null;
  label: string;
  digits: number;
  long?: boolean;
}) {
  return (
    <div className={cn("cd-unit", long && "cd-long")}>
      <span className="cd-value">
        {value === null ? "-".repeat(digits) : String(value).padStart(digits, "0")}
      </span>
      <span className="cd-label">{label}</span>
    </div>
  );
}

export function Countdown({
  target,
  title,
  showSeconds = false,
  variant = "mini",
}: {
  target: Date;
  title: string;
  showSeconds?: boolean;
  variant?: "mini" | "main";
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
    <div className={cn("cd-root", variant === "main" && "cd-main")}>
      <p className="cd-title">{title}</p>
      <div className="cd-units" style={{ "--cd-count": showSeconds ? 5 : 4 } as React.CSSProperties}>
        <Unit value={parts?.months ?? null} label="Months" digits={2} />
        <Unit value={parts?.weeks ?? null} label="Weeks" digits={2} />
        <Unit value={parts?.days ?? null} label="Days" digits={2} />
        <Unit value={parts?.minutes ?? null} label="Minutes" digits={4} long />
        {showSeconds ? <Unit value={parts?.seconds ?? null} label="Seconds" digits={2} /> : null}
      </div>
    </div>
  );
}
