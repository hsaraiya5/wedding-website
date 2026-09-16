import type { Metadata } from "next";
import { Cormorant_Garamond, Lora, MonteCarlo, Geist_Mono } from "next/font/google";
import "./globals.css";

// Design system fonts (see Decision Log): the 09/16/26 v2 handoff pins the
// exact web font stack -- Cormorant Garamond (display/menu), Lora (body),
// and MonteCarlo (calligraphy) -- loaded via next/font so every visitor
// gets the same look regardless of OS.
const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const bodyFont = Lora({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const scriptFont = MonteCarlo({
  variable: "--font-script",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gayathri & Hrishikesh | May 29-30, 2027",
  description:
    "Gayathri and Hrishikesh's wedding weekend at Wyndham Grand, Pittsburgh Downtown, May 29-30, 2027.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // globals.css sets scroll-behavior: smooth for the guest site's
      // single-page anchor nav (Welcome/Itinerary/Travel/...). Without this
      // attribute, Next's router inherits that for its own route-transition
      // scroll resets too -- harmless on the guest site (there's only ever
      // one real page), but every admin page is a real route, so clicking
      // between Dashboard/Events/Travel/FAQ animated the scroll reset on
      // each navigation instead of snapping instantly. This tells Next to
      // handle that itself rather than picking up the CSS rule.
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${bodyFont.variable} ${scriptFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
