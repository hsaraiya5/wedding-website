import { useEffect, useRef, useState } from "react";

// Character-by-character reveal, matching the design's timing (18ms/char)
// and respecting prefers-reduced-motion (shows the full text immediately
// instead of animating). Starts once, the first time `active` turns true.
export function useTypedText(text: string, active: boolean) {
  const [typed, setTyped] = useState("");
  const startedRef = useRef(false);
  const typing = typed.length > 0 && typed.length < text.length;

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    const showFullText = () => setTyped(text);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showFullText();
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [active, text]);

  return { typed, typing };
}
