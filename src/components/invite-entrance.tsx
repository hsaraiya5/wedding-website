"use client";

import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { redeemInviteCode, type RedeemCodeState } from "@/app/actions/guest";
import { designAssets } from "@/lib/design-assets";
import "./invite-entrance.css";

// The invite-code entrance: a sealed envelope flies in and lands, the guest
// writes their code onto its address lines in ink, and a valid code parts the
// wax so both flaps can unfold and reveal the invitation card underneath.
//
// The card never moves -- the envelope simply stops covering it. That's the
// whole trick, and it's what lets one mechanic work at every aspect ratio:
// the staging is full-bleed, so there's no fixed card box to proportion.
type Stage =
  | "idle"
  | "arriving"
  | "sealed"
  | "writing"
  | "breaking"
  | "opening"
  | "welcoming"
  | "launching"
  | "done";

// Beats after a valid code, in ms from submission. Deliberately driven by
// timers rather than chained transitionend listeners: a transition that never
// fires (offscreen element, interrupted transform) would strand the guest on
// this screen forever, and reaching /home matters more than frame-perfect
// sequencing.
const OPEN_BEATS: [Stage, number][] = [
  ["breaking", 0],
  ["opening", 300],
  ["welcoming", 1150],
  ["launching", 2750],
  ["done", 3450],
];
const HANDOFF_MS = 3900;

const initialState: RedeemCodeState = { error: null, householdName: null };

export function InviteEntrance() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(redeemInviteCode, initialState);
  const [stage, setStage] = useState<Stage>("idle");
  const [code, setCode] = useState("");
  const [refusing, setRefusing] = useState(false);
  const [scriptFontSize, setScriptFontSize] = useState<number | null>(null);

  const timers = useRef<number[]>([]);
  const startedRef = useRef(false);
  const errorSeenRef = useRef<RedeemCodeState | null>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLParagraphElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => {
      pendingTimers.forEach((id) => window.clearTimeout(id));
      document.body.style.overflow = "";
    };
  }, []);

  // Land the envelope only once its artwork has decoded, otherwise the first
  // frame of the arrival is an untextured red rectangle. Capped so a slow or
  // failed image fetch can't hold the guest on a blank screen.
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      setStage("arriving");
      later(() => setStage("sealed"), 760);
    };

    const img = new window.Image();
    img.onload = start;
    img.onerror = start;
    img.src = designAssets.hero;
    const fallback = window.setTimeout(start, 1200);

    // Warm the card's side rails too -- they're revealed mid-unfold, where a
    // late decode would show as a visible pop.
    [designAssets.floralLeft, designAssets.floralRight].forEach((src) => {
      const rail = new window.Image();
      rail.src = src;
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  // Focus the address line as soon as the envelope settles, so a guest on a
  // desktop keyboard can start typing without hunting for the field.
  useEffect(() => {
    if (stage !== "sealed") return;
    inputRef.current?.focus({ preventScroll: true });
  }, [stage]);

  // Measures "Welcome, <Household>" against the card's centre column (which
  // excludes the floral rails) and picks the largest size that fits. A fixed
  // clamp() can't do this: MonteCarlo's average glyph width doesn't track
  // character count closely enough for long household names.
  useEffect(() => {
    const copy = copyRef.current;
    const script = scriptRef.current;
    if (!copy || !script || !state.householdName) return;

    const text = `Welcome, ${state.householdName}`;
    const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const minPx = 1.1 * rootPx;
    const maxPx = 3.4 * rootPx;
    // Below this the line reads as an apology rather than a welcome, so we'd
    // rather break a long name across two lines than keep shrinking it.
    const comfortablePx = 1.45 * rootPx;
    const MAX_LINES = 3;

    const measure = () => {
      // clientWidth still includes the padding that reserves the floral rails,
      // so measuring against it sizes the line for a column roughly twice as
      // wide as the one the text actually gets -- and long household names
      // then wrap into three lines.
      const box = getComputedStyle(copy);
      const width =
        copy.clientWidth -
        Number.parseFloat(box.paddingLeft) -
        Number.parseFloat(box.paddingRight);
      if (width <= 0) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const reference = 100;
      ctx.font = `${reference}px ${getComputedStyle(script).fontFamily}`;
      const textWidth = ctx.measureText(text).width;
      if (textWidth === 0) return;

      // Take the fewest lines that still leave the name at a readable size.
      // A portrait card's centre column is narrow enough that forcing one
      // line would shrink a long household name to a whisper.
      let ideal = minPx;
      for (let lines = 1; lines <= MAX_LINES; lines += 1) {
        ideal = (reference * width * 0.96 * lines) / textWidth;
        if (ideal >= comfortablePx) break;
      }

      // The line model assumes the text splits evenly, which it never quite
      // does. Cap by the widest single word so a name can't overflow its
      // column and spill toward the floral rails.
      const widestWord = text
        .split(/\s+/)
        .reduce((max, word) => Math.max(max, ctx.measureText(word).width), 0);
      if (widestWord > 0) {
        ideal = Math.min(ideal, (reference * width * 0.96) / widestWord);
      }

      setScriptFontSize(Math.min(Math.max(ideal, minPx), maxPx));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [state.householdName]);

  // A restored bfcache snapshot can carry a stale "pending" state from a
  // submission that never resolved -- reload so the form always starts fresh.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Valid code: part the wax, unfold both flaps, then hand off to /home.
  useEffect(() => {
    if (!state.householdName || startedRef.current) return;
    startedRef.current = true;

    // Deliberately plays in full regardless of prefers-reduced-motion. This is
    // a one-time, few-second moment for a small trusted guest list, and the
    // couple chose showing it whole over an abbreviated fallback.
    document.body.style.overflow = "hidden";

    OPEN_BEATS.forEach(([next, at]) => later(() => setStage(next), at));
    later(() => {
      document.body.style.overflow = "";
      router.push("/home");
    }, HANDOFF_MS);
  }, [state.householdName, router]);

  // Wrong code: the envelope shudders and the seal holds.
  useEffect(() => {
    if (!state.error || errorSeenRef.current === state) return;
    errorSeenRef.current = state;
    setRefusing(true);
    later(() => setRefusing(false), 520);
    inputRef.current?.focus({ preventScroll: true });
  }, [state]);

  const artStyle = {
    "--ie-hero-art": `url(${designAssets.hero})`,
    "--ie-rail-left": `url(${designAssets.floralLeft})`,
    "--ie-rail-right": `url(${designAssets.floralRight})`,
  } as CSSProperties;

  const opening = stage === "breaking" || stage === "opening" || stage === "welcoming"
    || stage === "launching" || stage === "done";
  const canType = (stage === "sealed" || stage === "writing") && !pending;

  return (
    <div
      className="ie-access"
      data-stage={stage}
      style={artStyle}
      aria-busy={opening ? "true" : undefined}
      aria-labelledby="ie-access-title"
    >
      <div className={`ie-env ${refusing ? "ie-refusing" : ""}`.trim()}>
        <div className="ie-env-shadow" aria-hidden="true" />

        <div className="ie-card" aria-hidden={!opening}>
          <div className="ie-rail ie-rail-left" aria-hidden="true" />
          <div className="ie-rail ie-rail-right" aria-hidden="true" />
          <div className="ie-card-copy" ref={copyRef}>
            <div className="ie-monogram" aria-hidden="true">
              G&nbsp;H
            </div>
            <p className="ie-eyebrow">You are invited</p>
            <p
              className="ie-script"
              role="status"
              ref={scriptRef}
              style={scriptFontSize ? { fontSize: `${scriptFontSize}px` } : undefined}
            >
              <span>{state.householdName ? `Welcome, ${state.householdName}` : ""}</span>
            </p>
            <div className="ie-flourish" aria-hidden="true" />
          </div>
        </div>

        <div className="ie-flap ie-flap-bot">
          <form action={formAction} className="ie-addr">
            <p className="ie-addr-names" id="ie-access-title">
              Gayathri &amp; Hrishikesh
            </p>
            {/* A paper address plaque, the way a real wedding envelope carries
                one -- the guest writes on the label rather than on bare red,
                which also gives the ink somewhere with real contrast to sit. */}
            <div className="ie-addr-plate">
              <span className="ie-addr-ink" aria-hidden="true">
                <span>{code}</span>
                <i className="ie-caret" />
              </span>
              {code ? null : (
                <span className="ie-addr-ph" aria-hidden="true">
                  Your invite code
                </span>
              )}
              <input
                ref={inputRef}
                id="invite-code"
                name="code"
                className="ie-code-input"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  if (stage === "sealed" && event.target.value) setStage("writing");
                }}
                autoComplete="off"
                spellCheck={false}
                disabled={!canType}
                aria-label="Your invite code"
                aria-describedby="ie-code-error"
              />
            </div>
            {/* Height is reserved whether or not the button is showing, so the
                plaque doesn't jump the moment the guest starts typing. */}
            <div className="ie-addr-action">
              {code.trim() ? (
                <button className="ie-addr-go" type="submit" disabled={!canType}>
                  {pending ? "Opening…" : "Open the invitation →"}
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="ie-flap ie-flap-top" aria-hidden="true" />

        <div className="ie-seal" aria-hidden="true">
          <span className="ie-seal-half ie-seal-t" />
          <span className="ie-seal-half ie-seal-b" />
          <span className="ie-seal-ring" />
          <span className="ie-seal-mono">G&nbsp;H</span>
        </div>
      </div>

      <div className="ie-error" id="ie-code-error" role="alert">
        {state.error}
      </div>

      {stage === "sealed" || stage === "writing" || stage === "arriving" ? (
        <Link href="/admin/login" className="ie-admin-link">
          Admin login
        </Link>
      ) : null}
    </div>
  );
}
