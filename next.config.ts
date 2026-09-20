import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  // Next.js caps Server Action request bodies at 1MB by default. The About
  // Us photo form (saveAboutUs in src/app/actions/admin.ts) submits every
  // photo row's file in one request, each allowed up to 8MB by that
  // action's own validation -- the 1MB default made any real photo upload
  // fail below our own validation, as a hard framework-level error instead
  // of a friendly message. 50mb comfortably covers several 8MB photos in
  // one save.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
