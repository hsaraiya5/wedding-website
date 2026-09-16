import type { CSSProperties } from "react";
import { designAssets } from "@/lib/design-assets";
import "./guest-guide.css";

// Fixed site content (real places, real links), same treatment as the
// Travel & Stay shuttle note -- not admin-editable via the CMS, since
// these aren't per-couple business data that changes.
const picks = [
  {
    tag: "Walk",
    name: "Point State Park",
    description: "Start at the meeting place of three rivers for skyline views and an easy downtown stroll.",
    href: "https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/point-state-park",
    linkLabel: "Plan a walk",
  },
  {
    tag: "Explore",
    name: "The Strip District",
    description: "Come hungry for markets, coffee, local shops, and a lively slice of the city.",
    href: "https://www.visitpittsburgh.com/neighborhoods/strip-district/",
    linkLabel: "Explore the Strip",
  },
  {
    tag: "Visit",
    name: "Sri Venkateswara Temple",
    description:
      "Visit Pittsburgh's beloved Hindu temple in Penn Hills for prayer, reflection, and a meaningful community landmark.",
    href: "https://www.svtemple.org/index.html",
    linkLabel: "Visit the temple",
  },
  {
    tag: "Our story",
    name: "Phipps Conservatory",
    description: "Wander through the glasshouse and gardens where Hrishikesh proposed to Gayathri.",
    href: "https://www.phipps.conservatory.org/visit-and-explore",
    linkLabel: "Plan a visit",
  },
  {
    tag: "Taste",
    name: "Noodlehead",
    description: "Head to Shadyside for Thai-inspired street noodles in a lively, casual dining room.",
    href: "https://noodleheadpgh.com/",
    linkLabel: "View Noodlehead",
  },
];

export function GuestGuide() {
  const floralStyle = { "--gg-floral-art": `url(${designAssets.floral})` } as CSSProperties;

  return (
    <div className="gg-grid">
      <article className="gg-panel" style={floralStyle}>
        <p className="gh-eyebrow">A few local favorites</p>
        <h3 className="font-heading">Make a Pittsburgh afternoon of it.</h3>
        <p>Save a little time to explore the city&apos;s gardens, neighborhoods, sacred spaces, and seriously good food.</p>
        <div className="gg-picks">
          {picks.map((pick) => (
            <article key={pick.name} className="gg-pick">
              <span>{pick.tag}</span>
              <h4 className="font-heading">{pick.name}</h4>
              <p>{pick.description}</p>
              <a href={pick.href} target="_blank" rel="noopener noreferrer">
                {pick.linkLabel}
              </a>
            </article>
          ))}
        </div>
      </article>
      <p className="gg-updated">Guest information last updated September 16, 2026</p>
    </div>
  );
}
