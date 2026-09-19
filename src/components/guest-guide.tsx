"use client";

import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { TreePine, ShoppingBag, Landmark, Heart, UtensilsCrossed } from "lucide-react";
import { designAssets } from "@/lib/design-assets";
import type { LocalFavorite } from "@/components/local-favorites-map";
import "./guest-guide.css";

const LocalFavoritesMap = dynamic(
  () => import("@/components/local-favorites-map").then((mod) => mod.LocalFavoritesMap),
  { ssr: false, loading: () => <div className="lfm-loading">Loading map...</div> }
);

// Fixed site content (real places, real links), same treatment as the
// Travel & Stay shuttle note -- not admin-editable via the CMS, since
// these aren't per-couple business data that changes.
const picks: LocalFavorite[] = [
  {
    tag: "Walk",
    name: "Point State Park",
    description: "Start at the meeting place of three rivers for skyline views and an easy downtown stroll.",
    href: "https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/point-state-park",
    linkLabel: "Plan a walk",
    lat: 40.4416,
    lng: -80.0107,
    icon: "walk",
  },
  {
    tag: "Explore",
    name: "The Strip District",
    description: "Come hungry for markets, coffee, local shops, and a lively slice of the city.",
    href: "https://www.visitpittsburgh.com/neighborhoods/strip-district/",
    linkLabel: "Explore the Strip",
    lat: 40.4531,
    lng: -79.9819,
    icon: "explore",
  },
  {
    tag: "Visit",
    name: "Sri Venkateswara Temple",
    description:
      "Visit Pittsburgh's beloved Hindu temple in Penn Hills for prayer, reflection, and a meaningful community landmark.",
    href: "https://www.svtemple.org/index.html",
    linkLabel: "Visit the temple",
    lat: 40.4734,
    lng: -79.7937,
    icon: "visit",
  },
  {
    tag: "Our story",
    name: "Phipps Conservatory",
    description: "Wander through the glasshouse and gardens where Hrishikesh proposed to Gayathri.",
    href: "https://www.phipps.conservatory.org/visit-and-explore",
    linkLabel: "Plan a visit",
    lat: 40.4386,
    lng: -79.9497,
    icon: "story",
  },
  {
    tag: "Taste",
    name: "Noodlehead",
    description: "Head to Shadyside for Thai-inspired street noodles in a lively, casual dining room.",
    href: "https://noodleheadpgh.com/",
    linkLabel: "View Noodlehead",
    lat: 40.4589,
    lng: -79.9327,
    icon: "taste",
  },
];

const legend: { icon: LocalFavorite["icon"]; label: string; Icon: typeof TreePine; color: string }[] = [
  { icon: "walk", label: "Walk", Icon: TreePine, color: "var(--chart-4)" },
  { icon: "explore", label: "Explore", Icon: ShoppingBag, color: "var(--chart-1)" },
  { icon: "visit", label: "Visit", Icon: Landmark, color: "var(--chart-5)" },
  { icon: "story", label: "Our story", Icon: Heart, color: "var(--chart-3)" },
  { icon: "taste", label: "Taste", Icon: UtensilsCrossed, color: "var(--chart-2)" },
];

export function GuestGuide() {
  const floralStyle = { "--gg-floral-art": `url(${designAssets.floral})` } as CSSProperties;

  return (
    <div className="gg-grid">
      <article className="gg-panel" style={floralStyle}>
        <p className="gh-eyebrow">A few local favorites</p>
        <h3 className="font-heading">Make a Pittsburgh afternoon of it.</h3>
        <p>
          Save a little time to explore the city&apos;s gardens, neighborhoods, sacred spaces, and
          seriously good food. Tap a pin to see what it is and why we love it.
        </p>

        <LocalFavoritesMap picks={picks} />

        <div className="lfm-legend">
          {legend.map(({ icon, label, Icon, color }) => (
            <span key={icon} className="lfm-legend-item">
              <span className="lfm-legend-dot" style={{ "--dot-color": color } as CSSProperties}>
                <Icon size={12} strokeWidth={2.25} />
              </span>
              {label}
            </span>
          ))}
        </div>
      </article>
      <p className="gg-updated">Guest information last updated September 16, 2026</p>
    </div>
  );
}
