"use client";

import { useEffect, useRef, useState } from "react";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";
import { cn } from "@/lib/utils";
import "./countdown.css";

// Mirrors the handoff's setCountdownValue: the top half is redrawn to the
// new value immediately (it's covered by the outgoing top panel until that
// panel rotates away), while the bottom half keeps showing the old value
// until the incoming bottom panel rotates in over it. Once the 620ms
// transition it triggers finishes, both static halves already agree with
// `value`, so dropping the panels back to their hidden resting state is
// seamless.
function Unit({ value, label }: { value: number | null; label: string }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  const [previous, setPrevious] = useState(text);
  const [flipping, setFlipping] = useState(false);
  const prevTextRef = useRef(text);
  const endTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (text === prevTextRef.current) return;
    const from = prevTextRef.current;
    prevTextRef.current = text;

    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    window.clearTimeout(endTimer.current);
    // Unlike a CSS transition, an `animation` restarts from its keyframe
    // 0% whenever the triggering class is freshly added -- no need to wait
    // a frame for a "not flipping" state to paint first, so this can just
    // set previous + flipping together in one go.
    setPrevious(from);
    setFlipping(true);
    endTimer.current = window.setTimeout(() => setFlipping(false), 620);
  }, [text]);

  useEffect(() => () => window.clearTimeout(endTimer.current), []);

  return (
    <div className="cd-unit">
      <span className={cn("cd-value", flipping && "cd-flipping")} aria-label={text}>
        <span className="cd-layer cd-static-top" aria-hidden="true">
          <span className="cd-layer-inner">{text}</span>
        </span>
        <span className="cd-layer cd-static-bottom" aria-hidden="true">
          <span className="cd-layer-inner">{flipping ? previous : text}</span>
        </span>
        <span className="cd-layer cd-panel-top" aria-hidden="true">
          <span className="cd-layer-inner">{flipping ? previous : text}</span>
        </span>
        <span className="cd-layer cd-panel-bottom" aria-hidden="true">
          <span className="cd-layer-inner">{text}</span>
        </span>
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
