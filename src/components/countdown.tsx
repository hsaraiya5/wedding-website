"use client";

import { useEffect, useState } from "react";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";
import { cn } from "@/lib/utils";
import "./countdown.css";

function Unit({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="cd-unit">
      <span className="cd-value">
        {value === null ? "--" : String(value).padStart(2, "0")}
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
      <div className="cd-units" style={{ "--cd-count": showSeconds ? 6 : 5 } as React.CSSProperties}>
        <Unit value={parts?.months ?? null} label="Months" />
        <Unit value={parts?.weeks ?? null} label="Weeks" />
        <Unit value={parts?.days ?? null} label="Days" />
        <Unit value={parts?.hours ?? null} label="Hours" />
        <Unit value={parts?.minutes ?? null} label="Minutes" />
        {showSeconds ? <Unit value={parts?.seconds ?? null} label="Seconds" /> : null}
      </div>
    </div>
  );
}
