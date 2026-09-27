// Decorative branding art, served from the app itself rather than the Supabase
// "design-assets" bucket it used to live in.
//
// Two reasons. They were 8.5MB of uncompressed PNG, which meant the landing
// page's background graphic arrived long after its copy and the page visibly
// assembled itself in stages; as WebP they total 1.4MB. And serving them from
// our own origin drops a DNS + TLS handshake to a second host on first paint.
//
// Filenames carry a content hash so next.config.ts can cache them immutably --
// regenerate with the conversion step in the PR if the art is ever replaced.
export const designAssets = {
  hero: "/design/jaipur-botanical-hero.b4dee765.webp",
  floral: "/design/jaipur-botanical-transparent.e495c393.webp",
  floralLeft: "/design/jaipur-botanical-left.7e630ac9.webp",
  floralRight: "/design/jaipur-botanical-right.4bce3c5c.webp",
  wardrobeHaldi: "/design/wardrobe-haldi-pencil.37b9408d.webp",
  wardrobeSangeet: "/design/wardrobe-sangeet-pencil.2ba39e7c.webp",
  wardrobeWedding: "/design/wardrobe-wedding-pencil.f9e3979e.webp",
  wardrobeReception: "/design/wardrobe-reception-pencil.9b7420eb.webp",
};
