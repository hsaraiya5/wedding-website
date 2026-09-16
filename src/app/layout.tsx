import type { Metadata } from "next";
import { Libre_Baskerville, Nunito_Sans, Mrs_Saint_Delafield, Geist_Mono } from "next/font/google";
import "./globals.css";

// Design system fonts (see Decision Log): the handoff design specifies
// Optima/Baskerville/Snell Roundhand, which are macOS-only system fonts
// with no web fallback. These are close free equivalents loaded properly
// via next/font so every visitor sees a consistent look regardless of OS.
// Libre Baskerville is the actual open-source counterpart to Baskerville.
const displayFont = Libre_Baskerville({
  variable: "--font-display",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const bodyFont = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const scriptFont = Mrs_Saint_Delafield({
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
