import type { CSSProperties } from "react";
import { designAssets } from "@/lib/design-assets";
import "./site-footer.css";

export function SiteFooter() {
  const floralStyle = { "--sf-floral-art": `url(${designAssets.floral})` } as CSSProperties;

  return (
    <footer className="sf-footer" style={floralStyle}>
      <p className="sf-names">Gayathri &amp; Hrishikesh</p>
      <p className="sf-meta">May 29-30, 2027 &middot; Wyndham Grand, Pittsburgh Downtown</p>
    </footer>
  );
}
