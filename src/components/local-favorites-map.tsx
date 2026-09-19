"use client";

import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { type LatLngBoundsExpression } from "leaflet";
import { TreePine, ShoppingBag, Landmark, Heart, UtensilsCrossed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./local-favorites-map.css";

export type FavoriteIcon = "walk" | "explore" | "visit" | "story" | "taste";

export type LocalFavorite = {
  tag: string;
  name: string;
  description: string;
  href: string;
  linkLabel: string;
  lat: number;
  lng: number;
  icon: FavoriteIcon;
};

// Category -> lucide icon + palette color, pulled from the site's existing
// chart-1..5 tokens so new pin colors don't introduce a new palette.
const ICON_CONFIG: Record<FavoriteIcon, { Icon: typeof TreePine; color: string }> = {
  walk: { Icon: TreePine, color: "var(--chart-4)" },
  explore: { Icon: ShoppingBag, color: "var(--chart-1)" },
  visit: { Icon: Landmark, color: "var(--chart-5)" },
  story: { Icon: Heart, color: "var(--chart-3)" },
  taste: { Icon: UtensilsCrossed, color: "var(--chart-2)" },
};

// Leaflet markers need a plain HTML string, not a React node -- render the
// lucide icon to static markup once per category and drop it into a
// teardrop-shaped divIcon (classic 45deg-rotated rounded square).
function pinIcon(kind: FavoriteIcon) {
  const { Icon, color } = ICON_CONFIG[kind];
  const svg = renderToStaticMarkup(<Icon size={18} strokeWidth={2.25} />);
  const html = `<span class="lfm-pin" style="--pin-color: ${color}"><span class="lfm-pin-badge">${svg}</span></span>`;

  return L.divIcon({
    html,
    className: "lfm-pin-wrapper",
    iconSize: [38, 48],
    iconAnchor: [19, 46],
    popupAnchor: [0, -42],
  });
}

export function LocalFavoritesMap({ picks }: { picks: LocalFavorite[] }) {
  const bounds: LatLngBoundsExpression = picks.map((pick) => [pick.lat, pick.lng]);

  return (
    <div className="lfm-map">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [36, 36] }}
        scrollWheelZoom={false}
        className="lfm-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {picks.map((pick) => (
          <Marker key={pick.name} position={[pick.lat, pick.lng]} icon={pinIcon(pick.icon)}>
            <Popup className="lfm-popup">
              <p className="lfm-popup-tag">{pick.tag}</p>
              <h4 className="font-heading">{pick.name}</h4>
              <p>{pick.description}</p>
              <a href={pick.href} target="_blank" rel="noopener noreferrer">
                {pick.linkLabel}
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
