import Image from "next/image";
import { designAssets } from "@/lib/design-assets";

// The designers' official GH monogram (gold letters with a leafy branch).
// Decorative everywhere it's used -- each spot's link or heading already
// names the couple -- so the alt text is empty. `height` is the rendered
// height in px; the width follows the artwork's proportions. `preload` is for
// the spots visible on first paint (the envelope seal, the site header).
export function GhLogo({
  height,
  className,
  preload,
}: {
  height: number;
  className?: string;
  preload?: boolean;
}) {
  return (
    <Image
      src={designAssets.ghLogo}
      alt=""
      width={Math.round((height * 480) / 446)}
      height={height}
      className={className}
      preload={preload}
    />
  );
}
