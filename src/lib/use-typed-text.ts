import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Character-by-character reveal, matching the design's timing (18ms/char).
// Starts once, the first time `active` turns true. With prefers-reduced-motion
// the full text shows straight away -- without waiting for `active`, which
// otherwise left the message popping in after the rest of the page.
export function useTypedText(text: string, active: boolean) {
  const [typed, setTyped] = useState("");
  const startedRef = useRef(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

  useEffect(() => {
    if (reducedMotion || !active || startedRef.current) return;
    startedRef.current = true;

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [active, text, reducedMotion]);

  if (reducedMotion) return { typed: text, typing: false };
  return { typed, typing: typed.length > 0 && typed.length < text.length };
}
