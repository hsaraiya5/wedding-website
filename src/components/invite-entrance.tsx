"use client";

import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { redeemInviteCode, type RedeemCodeState } from "@/app/actions/guest";
import { designAssets } from "@/lib/design-assets";
import "./invite-entrance.css";

// Ported from the design handoff's ".access" flow: a 3D-flipping invite
// card that turns to reveal an envelope, which opens to lift out a
// "Welcome, <household>" card before handing off to the real site.
// Phases are cumulative (matching the original's classList.add sequence --
// each stage's CSS relies on earlier stages' classes still being present.
// The launch phase then overrides the envelope state to hand the revealed
// card cleanly into the home page.
const PHASES = ["turning", "opening", "lifting", "welcoming", "launching", "leaving"] as const;
type PhaseIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const initialState: RedeemCodeState = { error: null, householdName: null };

export function InviteEntrance() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(redeemInviteCode, initialState);
  const [phaseIndex, setPhaseIndex] = useState<PhaseIndex>(0);
  const startedRef = useRef(false);
  const insertCopyRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLParagraphElement>(null);
  const [scriptFontSize, setScriptFontSize] = useState<number | null>(null);

  // Measures the actual rendered width of "Welcome, <Household>" (via an
  // offscreen canvas, using the real script font) and picks the largest
  // font-size that fills the card's width without overflowing -- a fixed
  // clamp() couldn't do this accurately since MonteCarlo's average glyph
  // width doesn't match the usual character-count heuristics. Re-measures
  // on resize since the card's own width is itself responsive.
  useEffect(() => {
    const insertCopy = insertCopyRef.current;
    const script = scriptRef.current;
    if (!insertCopy || !script || !state.householdName) return;

    const text = `Welcome, ${state.householdName}`;
    const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const minPx = 1.6 * rootPx;
    const maxPx = 3.9 * rootPx;
    const fillFraction = 0.96;

    const measure = () => {
      const containerWidth = insertCopy.clientWidth;
      if (containerWidth === 0) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const referenceSize = 100;
      ctx.font = `${referenceSize}px ${getComputedStyle(script).fontFamily}`;
      const textWidth = ctx.measureText(text).width;
      if (textWidth === 0) return;

      const idealSize = (referenceSize * containerWidth * fillFraction) / textWidth;
      setScriptFontSize(Math.min(Math.max(idealSize, minPx), maxPx));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(insertCopy);
    return () => observer.disconnect();
  }, [state.householdName]);

  // If the browser restores this page from its back/forward cache (e.g.
  // after redeeming a code, then hitting Back), the restored snapshot can
  // carry a stale "pending" state from a submission that never resolved.
  // Force a real reload in that case so the form always starts fresh.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    if (!state.householdName || startedRef.current) return;
    startedRef.current = true;

    // Deliberately always plays the full envelope sequence, ignoring
    // prefers-reduced-motion -- this is a one-time, few-second delight
    // moment for a small trusted guest list, not general site UI, and the
    // couple chose showing it in full over an abbreviated fallback.
    document.body.style.overflow = "hidden";

    const timing = [50, 600, 1150, 1600, 2400, 4200, 4650];
    const timers = [
      setTimeout(() => setPhaseIndex(1), timing[0]),
      setTimeout(() => setPhaseIndex(2), timing[1]),
      setTimeout(() => setPhaseIndex(3), timing[2]),
      setTimeout(() => setPhaseIndex(4), timing[3]),
      setTimeout(() => setPhaseIndex(5), timing[4]),
      setTimeout(() => setPhaseIndex(6), timing[5]),
      setTimeout(() => {
        document.body.style.overflow = "";
        router.push("/home");
      }, timing[6]),
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, [state.householdName, router]);

  const activeClasses = PHASES.slice(0, phaseIndex)
    .map((p) => `ie-${p}`)
    .join(" ");
  const isFlipped = phaseIndex >= 1;

  const heroArtStyle = { "--ie-hero-art": `url(${designAssets.hero})` } as CSSProperties;

  return (
    <div
      className={`ie-access ${activeClasses}`.trim()}
      style={heroArtStyle}
      aria-busy={phaseIndex > 0 && phaseIndex < 6 ? "true" : undefined}
      aria-labelledby="ie-access-title"
    >
      <div className="ie-card-shell">
        <div className="ie-card">
          <div className="ie-face ie-front" aria-hidden={isFlipped}>
            <div className="ie-copy">
              <div className="ie-monogram" aria-hidden="true">
                G&nbsp;H
              </div>
              <p className="ie-eyebrow">You are invited</p>
              <h1 id="ie-access-title">Gayathri &amp; Hrishikesh</h1>
              <p className="ie-access-date">May 29-30, 2027 &middot; Wyndham Grand, Pittsburgh Downtown</p>
              <form action={formAction} className="ie-code-form">
                <label htmlFor="invite-code">Invitation code</label>
                <input
                  id="invite-code"
                  name="code"
                  placeholder="Enter your code"
                  autoComplete="off"
                  disabled={pending || phaseIndex > 0}
                  aria-describedby="ie-code-error"
                />
                <button
                  className="ie-code-submit"
                  type="submit"
                  aria-label="Open invitation"
                  disabled={pending || phaseIndex > 0}
                >
                  &rarr;
                </button>
                <div className="ie-error" id="ie-code-error" role="alert">
                  {state.error}
                </div>
              </form>
            </div>
          </div>

          <div className="ie-face ie-back" aria-hidden={!isFlipped}>
            <div className="ie-insert" aria-label="Wedding invitation card">
              <div className="ie-insert-copy" ref={insertCopyRef}>
                <div className="ie-monogram" aria-hidden="true">
                  G&nbsp;H
                </div>
                <p className="ie-eyebrow">Gayathri &amp; Hrishikesh</p>
                <p
                  className="ie-script"
                  role="status"
                  ref={scriptRef}
                  style={scriptFontSize ? { fontSize: `${scriptFontSize}px` } : undefined}
                >
                  <span>Welcome, {state.householdName}</span>
                </p>
              </div>
              <div className="ie-insert-footer">
                <p className="ie-insert-footer-label">Wedding weekend</p>
                <p className="ie-access-date">
                  May 29-30, 2027
                  <br />
                  Wyndham Grand, Pittsburgh Downtown
                </p>
              </div>
            </div>
            <div className="ie-env-side ie-left" />
            <div className="ie-env-side ie-right" />
            <div className="ie-env-pocket" />
            <div className="ie-env-flap" />
            <div className="ie-seal">G&nbsp;H</div>
          </div>
        </div>
      </div>

      {phaseIndex === 0 ? (
        <Link href="/admin/login" className="ie-admin-link">
          Admin login
        </Link>
      ) : null}
    </div>
  );
}
