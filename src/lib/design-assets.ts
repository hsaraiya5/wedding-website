// Public design assets uploaded to the Supabase "design-assets" bucket
// (see supabase/migrations/0014_design_assets_bucket.sql). Public bucket,
// since these are decorative branding images with nothing to protect.
const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/design-assets`;

export const designAssets = {
  hero: `${baseUrl}/jaipur-botanical-hero.png`,
  floral: `${baseUrl}/jaipur-botanical-transparent.png`,
  floralLeft: `${baseUrl}/jaipur-botanical-left.png`,
  floralRight: `${baseUrl}/jaipur-botanical-right.png`,
};
